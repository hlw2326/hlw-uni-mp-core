/**
 * useMsg — 消息提示 composable
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
    toast(opts: ToastOptions): void;
    success(message: string): void;
    error(message: string): void;
    fail(message: string): void;
    showLoading(message?: string): void;
    hideLoading(): void;
    confirm(opts: ModalOptions): Promise<boolean>;
    modal(opts: ModalOptions): Promise<boolean>;
    setLoadingBar(progress: number): void;
}

export function useMsg(): HlwMsg {
    function toast(opts: ToastOptions) {
        const { message, icon = "none", image, duration = 2000, mask = false, position = "center" } = opts;
        uni.showToast({ title: message, icon, image, duration, mask, position });
    }

    function success(message: string) {
        uni.showToast({ title: message, icon: "success", duration: 2000 });
    }

    function error(message: string) {
        uni.showToast({ title: message, icon: "fail", duration: 2000 });
    }

    function fail(message: string) {
        uni.showToast({ title: message, icon: "fail", duration: 2000 });
    }

    function showLoading(message = "加载中...") {
        uni.showLoading({ title: message, mask: true });
    }

    function hideLoading() {
        uni.hideLoading();
    }

    function confirm(opts: ModalOptions): Promise<boolean> {
        return new Promise((resolve) => {
            const { title = "提示", content, confirmText = "确定", cancelText = "取消", confirmColor = "#3b82f6", cancelColor = "#999999" } = opts;
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

    function modal(opts: ModalOptions): Promise<boolean> {
        return confirm(opts);
    }

    function setLoadingBar(progress: number) {
        const clamped = Math.max(0, Math.min(100, progress));
        uni.setNavigationBarTitle({
            title: `${"█".repeat(Math.round(clamped / 2))}${"░".repeat(50 - Math.round(clamped / 2))} ${clamped}%`,
        });
    }

    return {
        toast,
        success,
        error,
        fail,
        showLoading,
        hideLoading,
        confirm,
        modal,
        setLoadingBar,
    };
}
