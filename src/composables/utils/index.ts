/**
 * 小程序工具类
 */

export interface DownloadFileOptions {
    /** 下载地址 */
    url: string;
    /** 文件保存路径（可选） */
    filePath?: string;
    /** HTTP 请求头（可选） */
    header?: Record<string, string>;
    /** 下载进度回调（可选） */
    onProgress?: (progress: number, totalBytesWritten: number, totalBytesExpectedToWrite: number) => void;
}

export interface DownloadFileResult {
    /** 是否成功 */
    success: boolean;
    /** 临时文件路径 */
    tempFilePath?: string;
    /** 状态码 */
    statusCode?: number;
    /** 错误信息 */
    errMsg?: string;
}

type TapEvent = { currentTarget?: { dataset?: Record<string, any> } };

export function useUtils() {
    /** 复制文本到剪贴板 */
    function copy(data: string, showToast = true): Promise<boolean> {
        return new Promise((resolve) => {
            uni.setClipboardData({
                data,
                showToast: false,
                success: () => {
                    if (showToast) {
                        uni.showToast({ title: "复制成功", icon: "none", duration: 1500 });
                    }
                    resolve(true);
                },
                fail: () => resolve(false),
            });
        });
    }

    /** 从 data-copy 属性读取内容并复制（配合模板 @tap 使用） */
    function copyFromEvent(event: TapEvent) {
        const dataset = event?.currentTarget?.dataset;
        const text = dataset?.copy;
        if (text == null || text === "") return;
        const showToast = dataset?.copyToast !== "false";
        copy(String(text), showToast);
    }

    /** 获取剪贴板内容 */
    function paste(): Promise<string> {
        return new Promise((resolve) => {
            uni.getClipboardData({
                success: (res) => resolve(res.data),
                fail: () => resolve(""),
            });
        });
    }

    /** 保存图片到相册 */
    function saveImage(filePath: string): Promise<boolean> {
        return new Promise((resolve) => {
            uni.saveImageToPhotosAlbum({
                filePath,
                success: () => {
                    uni.showToast({ title: "保存成功", icon: "success" });
                    resolve(true);
                },
                fail: (err) => {
                    if (err.errMsg.includes("auth deny") || err.errMsg.includes("authorize")) {
                        uni.showModal({
                            title: "提示",
                            content: "需要授权相册权限",
                            confirmText: "去设置",
                            success: (res) => {
                                if (res.confirm) uni.openSetting();
                            },
                        });
                    } else {
                        uni.showToast({ title: "保存失败", icon: "none" });
                    }
                    resolve(false);
                },
            });
        });
    }

    /** 下载文件 */
    function downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult> {
        return new Promise((resolve) => {
            const task = uni.downloadFile({
                url: options.url,
                filePath: options.filePath,
                header: options.header,
                success: (res) => {
                    if (res.statusCode === 200) {
                        resolve({ success: true, tempFilePath: res.tempFilePath, statusCode: res.statusCode });
                    } else {
                        resolve({ success: false, statusCode: res.statusCode, errMsg: `下载失败，状态码：${res.statusCode}` });
                    }
                },
                fail: (err) => resolve({ success: false, errMsg: err.errMsg }),
            });

            if (options.onProgress) {
                task.onProgressUpdate((res) => {
                    options.onProgress!(res.progress, res.totalBytesWritten, res.totalBytesExpectedToWrite);
                });
            }
        });
    }

    /** 下载图片并保存到相册 */
    async function downloadAndSaveImage(url: string, onProgress?: (progress: number) => void): Promise<boolean> {
        try {
            uni.showLoading({ title: "下载中...", mask: true });

            const result = await downloadFile({
                url,
                onProgress: onProgress ? (progress) => onProgress(progress) : undefined,
            });

            uni.hideLoading();

            if (!result.success || !result.tempFilePath) {
                uni.showToast({ title: result.errMsg || "下载失败", icon: "none" });
                return false;
            }

            return await saveImage(result.tempFilePath);
        } catch {
            uni.hideLoading();
            uni.showToast({ title: "操作失败", icon: "none" });
            return false;
        }
    }

    return { copy, copyFromEvent, paste, saveImage, downloadFile, downloadAndSaveImage };
}
