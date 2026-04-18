/**
 * Alist 上传适配器。
 */
import type { UploadAdapter } from "./base";

export const alistAdapter: UploadAdapter = {
    name: "alist",
    /**
     * 生成 Alist 所需的表单字段。
     */
    buildFormData(ctx) {
        const c = ctx.credentials ?? {};
        return {
            "file-path": c["file-path"] ?? ctx.fileName,
            authorization: c["token"] ?? "",
            ...(ctx.extraData ?? {}),
        };
    },
};
