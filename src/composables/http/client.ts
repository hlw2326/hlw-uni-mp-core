/**
 * HttpClient - Axios 风格的 HTTP 客户端
 * 支持请求/响应拦截器、组件内请求 composable、上传策略模式。
 */
import { ref } from 'vue';
import type {
  ApiResponse,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  UploadConfig,
  UploadResult,
} from './types';
import { getAdapter } from './adapters';

/** 组件内请求返回的状态对象。 */
export interface UseRequestReturn<T = unknown> {
  loading: ReturnType<typeof ref<boolean>>;
  data: ReturnType<typeof ref<T | null>>;
  error: ReturnType<typeof ref<Error | null>>;
  run: (config: RequestConfig) => Promise<ApiResponse<T>>;
  get: (url: string, data?: unknown) => Promise<ApiResponse<T>>;
  post: (url: string, data?: unknown) => Promise<ApiResponse<T>>;
  put: (url: string, data?: unknown) => Promise<ApiResponse<T>>;
  del: (url: string, data?: unknown) => Promise<ApiResponse<T>>;
}

export class HttpClient {
  private _reqInterceptors: RequestInterceptor[] = [];
  private _resInterceptors: ResponseInterceptor[] = [];
  private _errInterceptors: ErrorInterceptor[] = [];
  private _baseURL: string;
  private _defaultHeaders: Record<string, string>;
  private _noCache: boolean;

  /**
   * 创建 HttpClient 实例并初始化默认配置。
   */
  constructor(options: { baseURL?: string; headers?: Record<string, string>; noCache?: boolean } = {}) {
    this._baseURL = options.baseURL ?? '';
    this._noCache = options.noCache ?? true;
    this._defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  /** 运行时设置 baseURL。 */
  setBaseURL(url: string): void {
    this._baseURL = url;
  }

  /** 注册请求拦截器，并返回注销函数。 */
  onRequest(fn: RequestInterceptor): () => void {
    this._reqInterceptors.push(fn);
    return () => {
      const idx = this._reqInterceptors.indexOf(fn);
      if (idx > -1) this._reqInterceptors.splice(idx, 1);
    };
  }

  /** 注册响应拦截器，并返回注销函数。 */
  onResponse<T = unknown>(fn: ResponseInterceptor<T>): () => void {
    this._resInterceptors.push(fn as ResponseInterceptor);
    return () => {
      const idx = this._resInterceptors.indexOf(fn as ResponseInterceptor);
      if (idx > -1) this._resInterceptors.splice(idx, 1);
    };
  }

  /** 注册错误拦截器，并返回注销函数。 */
  onError(fn: ErrorInterceptor): () => void {
    this._errInterceptors.push(fn);
    return () => {
      const idx = this._errInterceptors.indexOf(fn);
      if (idx > -1) this._errInterceptors.splice(idx, 1);
    };
  }

  /**
   * 执行一次全局请求，自动串联请求与响应拦截器。
   */
  async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    let cfg: RequestConfig = {
      method: 'GET',
      ...config,
      headers: { ...this._defaultHeaders, ...config.headers },
    };

    for (const fn of this._reqInterceptors) {
      cfg = await fn(cfg);
    }

    try {
      const fullUrl = this._buildUrl(cfg.url);
      const res = await this._doRequest<T>(fullUrl, cfg);

      for (const fn of this._resInterceptors) {
        const modified = await fn(res as ApiResponse<unknown>);
        if (modified !== undefined) return modified as ApiResponse<T>;
      }
      return res;
    } catch (e) {
      const err = e as Error;
      await this._applyErrorInterceptors(err);
      throw err;
    }
  }

  /**
   * 创建组件内可复用的请求状态对象。
   */
  useRequest<T = unknown>(): UseRequestReturn<T> {
    const loading = ref(false);
    const data = ref<T | null>(null);
    const error = ref<Error | null>(null);

    /**
     * 执行一次请求并维护 loading、data、error 状态。
     */
    const run = async (cfg: RequestConfig): Promise<ApiResponse<T>> => {
      loading.value = true;
      error.value = null;
      try {
        const res = await this.request<T>(cfg);
        data.value = res.data as T;
        return res;
      } catch (e) {
        error.value = e as Error;
        throw e;
      } finally {
        loading.value = false;
      }
    };

    /** 发起 GET 请求。 */
    const get = (url: string, d?: unknown) => run({ url, method: 'GET', data: d });
    /** 发起 POST 请求。 */
    const post = (url: string, d?: unknown) => run({ url, method: 'POST', data: d });
    /** 发起 PUT 请求。 */
    const put = (url: string, d?: unknown) => run({ url, method: 'PUT', data: d });
    /** 发起 DELETE 请求。 */
    const del = (url: string, d?: unknown) => run({ url, method: 'DELETE', data: d });

    return { loading, data, error, run, get, post, put, del };
  }

  /**
   * 根据上传类型选择适配器并执行文件上传。
   */
  upload(config: UploadConfig): Promise<UploadResult> {
    const fileName = config.fileName ?? config.filePath.split('/').pop() ?? 'file';

    let server = config.server;
    if (config.type === 'local' && config.url) server = config.url;

    const formData = config.type === 'local'
      ? (config.credentials ?? {})
      : getAdapter(config.type).buildFormData({
          filePath: config.filePath,
          fileName,
          credentials: config.credentials,
        });

    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: server,
        filePath: config.filePath,
        name: 'file',
        formData: formData as unknown as UniNamespace.UploadFileOption['formData'],
        header: config.header as Record<string, string>,
        success: (res) => {
          if (res.statusCode === 200) {
            try {
              const body = JSON.parse(res.data);
              resolve({ code: body.code ?? 1, msg: body.message ?? '上传成功', data: body.data ?? '' });
            } catch {
              resolve({ code: 1, msg: '上传成功', data: res.data });
            }
          } else {
            reject(new Error('上传失败'));
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '上传失败')),
      });
    });
  }

  /**
   * 拼接 baseURL，并在开启防缓存时追加时间戳参数。
   */
  private _buildUrl(url: string): string {
    if (/^https?:\/\//.test(url)) return url;
    const full = `${this._baseURL}${url}`;
    if (!this._noCache) return full;
    const sep = full.includes('?') ? '&' : '?';
    return `${full}${sep}_t=${Date.now()}`;
  }

  /**
   * 调用 uni.request 发起底层网络请求。
   */
  private async _doRequest<T>(url: string, cfg: RequestConfig): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      uni.request({
        url,
        method: cfg.method,
        data: cfg.data as UniNamespace.RequestOptions['data'],
        header: cfg.headers as Record<string, string>,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as ApiResponse<T>);
          } else {
            const msg = (res.data as Record<string, unknown>)?.info ?? `请求失败: ${res.statusCode}`;
            reject(new Error(String(msg)));
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '网络请求失败')),
      });
    });
  }

  /**
   * 顺序执行已注册的错误拦截器。
   */
  private async _applyErrorInterceptors(err: Error): Promise<void> {
    for (const fn of this._errInterceptors) {
      await fn(err);
    }
  }
}

/**
 * 全局 HTTP 实例。
 */
export const http = new HttpClient();
