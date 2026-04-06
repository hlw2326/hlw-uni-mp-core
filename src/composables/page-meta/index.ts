/**
 * usePageMeta — 页面元信息 composable
 */
export interface PageMeta {
    title?: string;
    navigationBarTitleText?: string;
    navigationBarBackgroundColor?: string;
    navigationBarTextStyle?: "white" | "black";
    backgroundColor?: string;
    enablePullDownRefresh?: boolean;
}

export function usePageMeta() {
    function setTitle(title: string) {
        uni.setNavigationBarTitle({ title });
    }

    function setOptions(options: PageMeta) {
        if (options.title) setTitle(options.title);
        if (options.enablePullDownRefresh !== undefined) {
            uni.setBackgroundTextStyle({ textStyle: "dark" });
        }
    }

    return {
        setTitle,
        setOptions,
    };
}
