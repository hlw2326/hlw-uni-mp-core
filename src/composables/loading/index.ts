/**
 * useLoading — 全局 Loading 状态
 */
export function useLoading() {
    function showLoading(message = "加载中...") {
        uni.showLoading({ title: message, mask: true });
    }

    function hideLoading() {
        uni.hideLoading();
    }

    return {
        showLoading,
        hideLoading,
    };
}
