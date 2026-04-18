/**
 * useLoading - 全局 Loading 状态
 */
export function useLoading() {
    /**
     * 显示全局加载提示。
     */
    function showLoading(message = "加载中...") {
        uni.showLoading({ title: message, mask: true });
    }

    /**
     * 关闭全局加载提示。
     */
    function hideLoading() {
        uni.hideLoading();
    }

    return {
        showLoading,
        hideLoading,
    };
}
