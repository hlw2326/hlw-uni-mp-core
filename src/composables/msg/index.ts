/**
 * useMsg - 消息提示 composable
 */
export type ToastIcon = "success" | "fail" | "exception" | "none";
export type ToastDuration = "short" | "long";

export interface ToastOptions {
    message: string;
    icon?: ToastIcon;
    image?: string;
    duration?: number;
    mask?: boolean;
    position?: "top" | "center" | "bottom";
}

export interface ModalOptions {
    title?: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    cancelColor?: string;
}

export interface HlwMsg {
    toast(opts: ToastOptions | string): void;
    success(message: string): void;
    error(message: string): void;
    fail(message: string): void;
    showLoading(message?: string): void;
    hideLoading(): void;
    confirm(opts: ModalOptions): Promise<boolean>;
    modal(opts: ModalOptions): Promise<boolean>;
    setLoadingBar(progress: number): void;
}

/**
 * 统一的消息提示与弹窗能力。
 */
export function useMsg(): HlwMsg {
    /**
     * 显示普通 toast，支持字符串或完整配置。
     */
    function toast(opts: ToastOptions | string) {
        const normalized: ToastOptions = typeof opts === "string" ? { message: opts } : opts;
        const { message, icon = "none", image, duration = 2000, mask = false, position = "center" } = normalized;
        uni.showToast({ title: message, icon, image, duration, mask, position });
    }

    /**
     * 显示成功提示。
     */
    function success(message: string) {
        uni.showToast({ title: message, icon: "success", duration: 2000 });
    }

    /**
     * 显示失败提示。
     */
    function error(message: string) {
        uni.showToast({ title: message, icon: "fail", duration: 2000 });
    }

    /**
     * 显示全局 loading。
     */
    function showLoading(message = "加载中...") {
        uni.showLoading({ title: message, mask: true });
    }

    /**
     * 关闭全局 loading。
     */
    function hideLoading() {
        uni.hideLoading();
    }

    /**
     * 显示确认弹窗，返回用户是否点击确认。
     */
    function confirm(opts: ModalOptions): Promise<boolean> {
        return new Promise((resolve) => {
            const {
                title = "提示",
                content,
                confirmText = "确定",
                cancelText = "取消",
                confirmColor = "#3b82f6",
                cancelColor = "#999999",
            } = opts;
            uni.showModal({
                title,
                content,
                confirmText,
                cancelText,
                confirmColor,
                cancelColor,
                success: (res) => resolve(res.confirm),
                fail: () => resolve(false),
            });
        });
    }

    /**
     * modal 是 confirm 的语义别名。
     */
    function modal(opts: ModalOptions): Promise<boolean> {
        return confirm(opts);
    }

    /**
     * 通过标题文本模拟简单进度条展示。
     */
    function setLoadingBar(progress: number) {
        const clamped = Math.max(0, Math.min(100, progress));
        uni.setNavigationBarTitle({
            title: `${"■".repeat(Math.round(clamped / 2))}${"□".repeat(50 - Math.round(clamped / 2))} ${clamped}%`,
        });
    }

    return {
        toast,
        success,
        error,
        fail: error,
        showLoading,
        hideLoading,
        confirm,
        modal,
        setLoadingBar,
    };
}
