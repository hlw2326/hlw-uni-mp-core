/**
 * 路由/跳转能力 —— 包装 uni-app 各类 jump API 为一个统一对象
 *
 * 使用：
 *   const { navigate } = useRouter();
 *   navigate(tool.jump_type, tool.jump_value);
 *
 * 未装 vue-router 也能用；命名风格对齐 Vue Router，熟悉的 push/replace/back
 * 会在后续迭代中补齐。
 */

/** 已知的跳转类型；保留 `(string & {})` 允许任意自定义值向下兼容 */
export type NavigateType =
    | "navigateTo"
    | "redirectTo"
    | "switchTab"
    | "reLaunch"
    | "webview"
    | "miniprogram"
    | (string & {});

export interface NavigateOptions {
    /** 失败回调，收到 uni 返回的错误信息 */
    onFail?: (errMsg: string) => void;
    /** 是否禁用默认的 Toast 错误提示，默认 false */
    silent?: boolean;
    /** 仅 miniprogram：目标小程序的页面路径（如 pages/index/index?id=1），留空则打开首页 */
    path?: string;
    /** 仅 miniprogram：目标小程序版本，默认 release */
    envVersion?: "develop" | "trial" | "release";
    /** 仅 miniprogram：传给目标小程序的额外数据，对方从 onLaunch/onShow 读取 */
    extraData?: Record<string, unknown>;
}

/**
 * 根据 type + value 调用对应的 uni API，屏蔽参数差异。
 *
 * 对应关系：
 * - `navigateTo`（默认） → uni.navigateTo
 * - `redirectTo`          → uni.redirectTo
 * - `switchTab`           → uni.switchTab（value 必须是 tabBar 页）
 * - `reLaunch`            → uni.reLaunch
 * - `webview`             → 默认 Toast 提示，上层需接入 web-view 承载页
 * - `miniprogram`         → uni.navigateToMiniProgram，value 格式 `appid:path`
 */
function doNavigate(type: NavigateType, value: string, options: NavigateOptions = {}): void {
    const { onFail, silent = false } = options;

    if (!value) {
        if (!silent) uni.showToast({ title: "跳转目标未配置", icon: "none" });
        onFail?.("跳转目标未配置");
        return;
    }

    const fail = (err?: { errMsg?: string }) => {
        const msg = err?.errMsg || `无法跳转：${value}`;
        if (!silent) uni.showToast({ title: msg, icon: "none" });
        onFail?.(msg);
    };

    switch (type) {
        case "switchTab":
            uni.switchTab({ url: value, fail });
            break;
        case "redirectTo":
            uni.redirectTo({ url: value, fail });
            break;
        case "reLaunch":
            uni.reLaunch({ url: value, fail });
            break;
        case "webview":
            // H5 需要上层承载页接入；这里仅 Toast 告知
            if (!silent) uni.showToast({ title: `H5：${value}`, icon: "none" });
            break;
        case "miniprogram": {
            // @ts-ignore 部分平台 navigateToMiniProgram 定义可能缺失
            uni.navigateToMiniProgram?.({
                appId: value,
                path: options.path || "",
                envVersion: options.envVersion,
                extraData: options.extraData,
                fail,
            });
            break;
        }
        case "navigateTo":
        default:
            uni.navigateTo({ url: value, fail });
            break;
    }
}

/**
 * 路由 composable：返回跳转方法集合。
 *
 * @example
 *   const { navigate } = useRouter();
 *   navigate("switchTab", "/pages/index/index");
 */
export function useRouter() {
    return {
        navigate: doNavigate,
    };
}
