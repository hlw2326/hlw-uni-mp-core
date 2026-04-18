/**
 * 阿里云 OSS 上传适配器。
 */
import type { UploadAdapter } from "./base";

export const ossAdapter: UploadAdapter = {
    name: "oss",
    /**
     * 生成 OSS 直传所需的表单字段。
     */
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
