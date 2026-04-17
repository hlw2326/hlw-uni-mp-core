/**
 * HttpClient — Axios 风格的 HTTP 客户端
 * 支持请求/响应拦截器、组件内请求 composable、上传策略模式
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

/** 组件内请求返回的状态 */
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

  constructor(options: { baseURL?: string; headers?: Record<string, string>; noCache?: boolean } = {}) {
    this._baseURL = options.baseURL ?? '';
    this._noCache = options.noCache ?? true;
    this._defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  /** 运行时设置 baseURL（适用于库模式下 import.meta.env 不可用的场景） */
  setBaseURL(url: string): void {
    this._baseURL = url;
  }

  /** 添加请求拦截器，返回取消函数 */
  onRequest(fn: RequestInterceptor): () => void {
    this._reqInterceptors.push(fn);
    return () => {
      const idx = this._reqInterceptors.indexOf(fn);
      if (idx > -1) this._reqInterceptors.splice(idx, 1);
    };
  }

  /** 添加响应拦截器 */
  onResponse<T = unknown>(fn: ResponseInterceptor<T>): () => void {
    this._resInterceptors.push(fn as ResponseInterceptor);
    return () => {
      const idx = this._resInterceptors.indexOf(fn as ResponseInterceptor);
      if (idx > -1) this._resInterceptors.splice(idx, 1);
    };
  }

  /** 添加错误拦截器 */
  onError(fn: ErrorInterceptor): () => void {
    this._errInterceptors.push(fn);
    return () => {
      const idx = this._errInterceptors.indexOf(fn);
      if (idx > -1) this._errInterceptors.splice(idx, 1);
    };
  }

  /**
   * 全局请求
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

    const fullUrl = this._buildUrl(cfg.url);
    const res = await this._doRequest<T>(fullUrl, cfg);

    for (const fn of this._resInterceptors) {
      const modified = await fn<T>(res);
      if (modified !== undefined) return modified;
    }
    return res;
  }

  /**
   * 组件内请求，返回带状态的 composable
   */
  useRequest<T = unknown>(): UseRequestReturn<T> {
    const loading = ref(false);
    const data = ref<T | null>(null);
    const error = ref<Error | null>(null);

    async function run(cfg: RequestConfig): Promise<ApiResponse<T>> {
      loading.value = true;
      error.value = null;
      try {
        const res = await this.request<T>(cfg);
        data.value = res.data as T;
        return res;
      } catch (e) {
        error.value = e as Error;
        await this._applyErrorInterceptors(e as Error);
        throw e;
      } finally {
        loading.value = false;
      }
    }

    const get = (url: string, d?: unknown) => run({ url, method: 'GET', data: d });
    const post = (url: string, d?: unknown) => run({ url, method: 'POST', data: d });
    const put = (url: string, d?: unknown) => run({ url, method: 'PUT', data: d });
    const del = (url: string, d?: unknown) => run({ url, method: 'DELETE', data: d });

    return { loading, data, error, run: run.bind(this), get, post, put, del };
  }

  /**
   * 上传文件（策略模式）
   */
  upload(config: UploadConfig): Promise<UploadResult> {
    const adapter = getAdapter(config.type);
    const fileName = config.fileName ?? config.filePath.split('/').pop() ?? 'file';

    let server = config.server;
    if (config.type === 'local' && config.url) server = config.url;

    const formData = adapter.buildFormData({
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

  private _buildUrl(url: string): string {
    if (/^https?:\/\//.test(url)) return url;
    const full = `${this._baseURL}${url}`;
    if (!this._noCache) return full;
    const sep = full.includes('?') ? '&' : '?';
    return `${full}${sep}_t=${Date.now()}`;
  }

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
            reject(new Error(msg));
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '网络请求失败')),
      });
    });
  }

  private async _applyErrorInterceptors(err: Error): Promise<void> {
    for (const fn of this._errInterceptors) {
      await fn(err);
    }
  }
}

/**
 * 全局 HTTP 实例
 *
 * 注意：作为 npm 库发布时 import.meta.env 会在打包期被编译为空对象，
 * 因此不在此处读取 env。消费者应通过 setupDefaultInterceptors({ baseURL })
 * 或 http.setBaseURL() 在运行时注入。
 */
export const http = new HttpClient();
