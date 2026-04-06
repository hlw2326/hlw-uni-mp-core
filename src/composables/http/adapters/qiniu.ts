/**
 * 七牛云适配器
 */
import type { UploadAdapter } from "./base";

export const qiniuAdapter: UploadAdapter = {
    name: "qiniu",
    buildFormData(ctx) {
        const c = ctx.credentials ?? {};
        return {
            token: c["token"] ?? "",
            key: c["key"] ?? ctx.fileName,
            ...(ctx.extraData ?? {}),
        };
    },
};
