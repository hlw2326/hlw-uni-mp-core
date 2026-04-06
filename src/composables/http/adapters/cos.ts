/**
 * 腾讯云 COS 适配器
 */
import type { UploadAdapter } from "./base";

export const cosAdapter: UploadAdapter = {
    name: "cos",
    buildFormData(ctx) {
        const c = ctx.credentials ?? {};
        return {
            "q-ak": c["ak"] ?? "",
            policy: c["policy"] ?? "",
            "q-key-time": c["key-time"] ?? "",
            "q-signature": c["signature"] ?? "",
            "Content-Disposition": `inline;filename=${encodeURIComponent(ctx.fileName)}`,
            success_action_status: 200,
            ...(ctx.extraData ?? {}),
        };
    },
};
