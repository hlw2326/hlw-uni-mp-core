/**
 * useRequest - 组件内请求 composable
 */
import { http } from './client';
import type { RequestConfig, ApiResponse } from './types';
import { ref } from 'vue';

export interface UseRequestOptions<T = unknown> {
  /** 初始数据 */
  initialData?: T | null;
  /** 手动触发，不自动请求 */
  manual?: boolean;
  /** 成功回调 */
  onSuccess?: (data: T, res: ApiResponse<T>) => void;
  /** 失败回调 */
  onError?: (err: Error) => void;
}

/**
 * 创建带有 loading、data、error 状态的请求方法集。
 *
 * @example
 * const { loading, data, error, run } = useRequest<User>();
 * run({ url: '/user/info', method: 'GET' });
 */
export function useRequest<T = unknown>(options: UseRequestOptions<T> = {}) {
  const { initialData = null, manual = false, onSuccess, onError } = options;

  const loading = ref(false);
  const data = ref<T | null>(initialData);
  const error = ref<Error | null>(null);

  /**
   * 执行一次自定义请求配置。
   */
  async function run(config: RequestConfig): Promise<ApiResponse<T>> {
    loading.value = true;
    error.value = null;
    try {
      const res = await http.request<T>(config);
      data.value = res.data as T;
      onSuccess?.(res.data as T, res);
      return res;
    } catch (e) {
      error.value = e as Error;
      onError?.(e as Error);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 发起 GET 请求。
   */
  function get(url: string, data?: unknown) {
    return run({ url, method: 'GET', data });
  }

  /**
   * 发起 POST 请求。
   */
  function post(url: string, data?: unknown) {
    return run({ url, method: 'POST', data });
  }

  /**
   * 发起 PUT 请求。
   */
  function put(url: string, data?: unknown) {
    return run({ url, method: 'PUT', data });
  }

  /**
   * 发起 DELETE 请求。
   */
  function del(url: string, data?: unknown) {
    return run({ url, method: 'DELETE', data });
  }

  if (!manual) {
    // 空配置时保持手动触发，避免误请求。
  }

  return { loading, data, error, run, get, post, put, del };
}

/**
 * 上传文件状态管理 composable。
 */
export function useUpload() {
  const uploading = ref(false);

  /**
   * 调用全局 http.upload 执行文件上传。
   */
  async function upload(options: Parameters<typeof http.upload>[0]) {
    uploading.value = true;
    try {
      return await http.upload(options);
    } finally {
      uploading.value = false;
    }
  }

  return { uploading, upload };
}
