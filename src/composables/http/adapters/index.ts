/**
 * 云存储上传适配器统一导出
 */
export { cosAdapter } from "./cos";
export { ossAdapter } from "./oss";
export { qiniuAdapter } from "./qiniu";
export { alistAdapter } from "./alist";
export type { UploadAdapter, UploadContext } from "./base";

import { cosAdapter } from "./cos";
import { ossAdapter } from "./oss";
import { qiniuAdapter } from "./qiniu";
import { alistAdapter } from "./alist";
import type { UploadAdapter } from "./base";

/** 所有已注册的适配器 */
export const adapters: Record<string, UploadAdapter> = {
    cos: cosAdapter,
    oss: ossAdapter,
    qiniu: qiniuAdapter,
    alist: alistAdapter,
};

/** 获取适配器，不存在则抛错 */
export function getAdapter(name: string): UploadAdapter {
    const adapter = adapters[name];
    if (!adapter) throw new Error(`[hlw] Unknown upload adapter: ${name}`);
    return adapter;
}
