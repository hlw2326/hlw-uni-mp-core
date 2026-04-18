/**
 * 云存储上传适配器 - 上传上下文
 */

/** 上传上下文。 */
export interface UploadContext {
    filePath: string;
    fileName: string;
    /** 云存储密钥凭证 */
    credentials?: Record<string, string>;
    /** 额外表单数据 */
    extraData?: Record<string, string>;
}

/** 云存储适配器接口。 */
export interface UploadAdapter {
    /** 适配器名称 */
    name: string;
    /** 根据上下文构建表单数据 */
    buildFormData(ctx: UploadContext): Record<string, string | number>;
}
