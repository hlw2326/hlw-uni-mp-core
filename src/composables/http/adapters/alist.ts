/**
 * Alist 适配器
 */
import type { UploadAdapter } from "./base";

export const alistAdapter: UploadAdapter = {
    name: "alist",
    buildFormData(ctx) {
        const c = ctx.credentials ?? {};
        return {
            "file-path": c["file-path"] ?? ctx.fileName,
            authorization: c["token"] ?? "",
            ...(ctx.extraData ?? {}),
        };
    },
};
