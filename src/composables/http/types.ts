/**
 * HTTP 类型定义
 */

/** API 统一响应格式 */
export interface ApiResponse<T = unknown> {
    code: number;
    data: T;
    message: string;
}

/** 分页数据 */
export interface PageResult<T = unknown> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
}

/** 请求配置 */
export interface RequestConfig {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
}

/** 拦截器类型 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor<T = unknown> = (res: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
export type ErrorInterceptor = (err: Error) => void | Error | Promise<void | Error>;

/** 上传配置 */
export interface UploadConfig {
    /** 上传接口地址 */
    server: string;
    /** 文件路径 */
    filePath: string;
    /** 文件名（可选，默认取 filePath） */
    fileName?: string;
    /** 上传类型：cos | oss | qiniu | alist */
    type: string;
    /** 云存储密钥凭证 */
    credentials?: Record<string, string>;
    /** 自定义请求头 */
    header?: Record<string, string>;
    /** 上传类型为 local 时，作为最终 server */
    url?: string;
}

/** 上传结果 */
export interface UploadResult {
    code: number;
    msg: string;
    data: string;
}
