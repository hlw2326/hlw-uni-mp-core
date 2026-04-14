/**
 * 小程序工具类
 */

/**
 * 复制文本到剪贴板
 * @param data 要复制的文本内容
 * @param showToast 是否显示提示，默认 true
 * @returns Promise<boolean> 是否成功
 */
export const copyToClipboard = (data: string, showToast = true): Promise<boolean> => {
    return new Promise((resolve) => {
        uni.setClipboardData({
            data,
            showToast,
            success: () => resolve(true),
            fail: () => resolve(false),
        });
    });
};

/**
 * 获取剪贴板内容
 * @returns Promise<string> 剪贴板内容，失败返回空字符串
 */
export const getClipboardData = (): Promise<string> => {
    return new Promise((resolve) => {
        uni.getClipboardData({
            success: (res) => resolve(res.data),
            fail: () => resolve(""),
        });
    });
};

/**
 * 保存图片到相册
 * @param filePath 图片文件路径，可以是临时文件路径或永久文件路径
 * @returns Promise<boolean> 是否成功
 */
export const saveImageToPhotosAlbum = (filePath: string): Promise<boolean> => {
    return new Promise((resolve) => {
        uni.saveImageToPhotosAlbum({
            filePath,
            success: () => {
                uni.showToast({
                    title: "保存成功",
                    icon: "success",
                });
                resolve(true);
            },
            fail: (err) => {
                if (err.errMsg.includes("auth deny") || err.errMsg.includes("authorize")) {
                    uni.showModal({
                        title: "提示",
                        content: "需要授权相册权限",
                        confirmText: "去设置",
                        success: (res) => {
                            if (res.confirm) {
                                uni.openSetting();
                            }
                        },
                    });
                } else {
                    uni.showToast({
                        title: "保存失败",
                        icon: "none",
                    });
                }
                resolve(false);
            },
        });
    });
};

/**
 * 下载文件选项
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

/**
 * 下载文件结果
 */
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

/**
 * 下载文件
 * @param options 下载选项
 * @returns Promise<DownloadFileResult> 下载结果
 */
export const downloadFile = (options: DownloadFileOptions): Promise<DownloadFileResult> => {
    return new Promise((resolve) => {
        const downloadTask = uni.downloadFile({
            url: options.url,
            filePath: options.filePath,
            header: options.header,
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve({
                        success: true,
                        tempFilePath: res.tempFilePath,
                        statusCode: res.statusCode,
                    });
                } else {
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        errMsg: `下载失败，状态码：${res.statusCode}`,
                    });
                }
            },
            fail: (err) => {
                resolve({
                    success: false,
                    errMsg: err.errMsg,
                });
            },
        });

        if (options.onProgress) {
            downloadTask.onProgressUpdate((res) => {
                options.onProgress!(res.progress, res.totalBytesWritten, res.totalBytesExpectedToWrite);
            });
        }
    });
};

/**
 * 下载图片并保存到相册
 * @param url 图片地址
 * @param onProgress 下载进度回调（可选）
 * @returns Promise<boolean> 是否成功
 */
export const downloadAndSaveImage = async (url: string, onProgress?: (progress: number) => void): Promise<boolean> => {
    try {
        uni.showLoading({
            title: "下载中...",
            mask: true,
        });

        const downloadResult = await downloadFile({
            url,
            onProgress: onProgress ? (progress) => onProgress(progress) : undefined,
        });

        uni.hideLoading();

        if (!downloadResult.success || !downloadResult.tempFilePath) {
            uni.showToast({
                title: downloadResult.errMsg || "下载失败",
                icon: "none",
            });
            return false;
        }

        return await saveImageToPhotosAlbum(downloadResult.tempFilePath);
    } catch (error) {
        uni.hideLoading();
        uni.showToast({
            title: "操作失败",
            icon: "none",
        });
        return false;
    }
};

/**
 * 工具类导出
 */
export const useUtils = () => {
    return {
        copyToClipboard,
        getClipboardData,
        saveImageToPhotosAlbum,
        downloadFile,
        downloadAndSaveImage,
    };
};
