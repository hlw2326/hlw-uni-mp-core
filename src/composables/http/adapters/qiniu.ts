/**
 * 七牛云上传适配器。
 */
import type { UploadAdapter } from "./base";

export const qiniuAdapter: UploadAdapter = {
    name: "qiniu",
    /**
     * 生成七牛直传所需的表单字段。
     */
    buildFormData(ctx) {
        const c = ctx.credentials ?? {};
        return {
            token: c["token"] ?? "",
            key: c["key"] ?? ctx.fileName,
            ...(ctx.extraData ?? {}),
        };
    },
};
