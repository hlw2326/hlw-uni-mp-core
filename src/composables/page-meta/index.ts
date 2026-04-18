/**
 * usePageMeta - 页面元信息 composable
 */
export interface PageMeta {
    title?: string;
    navigationBarTitleText?: string;
    navigationBarBackgroundColor?: string;
    navigationBarTextStyle?: "white" | "black";
    backgroundColor?: string;
    enablePullDownRefresh?: boolean;
}

/**
 * 页面导航栏与背景元信息工具。
 */
export function usePageMeta() {
    /**
     * 设置当前页面标题。
     */
    function setTitle(title: string) {
        uni.setNavigationBarTitle({ title });
    }

    /**
     * 批量设置页面标题、导航栏和背景样式。
     */
    function setOptions(options: PageMeta) {
        if (options.title || options.navigationBarTitleText) {
            setTitle(options.title || options.navigationBarTitleText!);
        }
        if (options.navigationBarBackgroundColor || options.navigationBarTextStyle) {
            uni.setNavigationBarColor({
                frontColor: options.navigationBarTextStyle === "white" ? "#ffffff" : "#000000",
                backgroundColor: options.navigationBarBackgroundColor ?? "#ffffff",
            });
        }
        if (options.backgroundColor) {
            uni.setBackgroundColor({ backgroundColor: options.backgroundColor });
        }
        if (options.enablePullDownRefresh !== undefined) {
            uni.setBackgroundTextStyle({ textStyle: "dark" });
        }
    }

    return {
        setTitle,
        setOptions,
    };
}
