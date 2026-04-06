/**
 * 阿里云 OSS 适配器
 */
import type { UploadAdapter } from "./base";

export const ossAdapter: UploadAdapter = {
    name: "oss",
    buildFormData(ctx) {
        const c = ctx.credentials ?? {};
        return {
            policy: c["policy"] ?? "",
            signature: c["signature"] ?? "",
            OSSAccessKeyId: c["accessKeyId"] ?? "",
            success_action_status: 200,
            "Content-Disposition": `inline;filename=${encodeURIComponent(ctx.fileName)}`,
            ...(ctx.extraData ?? {}),
        };
    },
};
