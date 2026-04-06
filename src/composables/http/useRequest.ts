/**
 * useRequest — 组件内请求 composable
 */
import { http } from './client';
import type { RequestConfig, ApiResponse } from './types';
import { ref } from 'vue';

export interface UseRequestOptions<T = unknown> {
  /** 初始数据 */
  initialData?: T | null;
  /** 手动触发（不自动请求） */
  manual?: boolean;
  /** 成功回调 */
  onSuccess?: (data: T, res: ApiResponse<T>) => void;
  /** 失败回调 */
  onError?: (err: Error) => void;
}

/**
 * useRequest — 组件内请求 composable
 * @example
 * const { loading, data, error, run } = useRequest<User>();
 * run({ url: '/user/info', method: 'GET' });
 */
export function useRequest<T = unknown>(options: UseRequestOptions<T> = {}) {
  const { initialData = null, manual = false, onSuccess, onError } = options;

  const loading = ref(false);
  const data = ref<T | null>(initialData);
  const error = ref<Error | null>(null);

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

  function get(url: string, data?: unknown) {
    return run<T>({ url, method: 'GET', data });
  }

  function post(url: string, data?: unknown) {
    return run<T>({ url, method: 'POST', data });
  }

  function put(url: string, data?: unknown) {
    return run<T>({ url, method: 'PUT', data });
  }

  function del(url: string, data?: unknown) {
    return run<T>({ url, method: 'DELETE', data });
  }

  if (!manual) {
    // 空配置，默认不自动请求，保持灵活性
  }

  return { loading, data, error, run, get, post, put, del };
}

/**
 * useUpload — 上传文件 composable
 */
export function useUpload() {
  const uploading = ref(false);

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
