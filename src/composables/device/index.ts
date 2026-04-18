/**
 * useDevice — 设备信息 composable（单例缓存）
 * 使用微信 3.7.0+ 推荐的新 API 替代废弃的 getSystemInfoSync
 */
import { ref } from "vue";

export interface DeviceInfo {
    /** 小程序 appId */
    appid: string;
    /** 应用名称 */
    app_name: string;
    /** 小程序版本号（版本名称） */
    app_version: string;
    /** 小程序版本号（版本号） */
    app_version_code: string;
    /** 小程序来源渠道 */
    app_channel: string;
    /** 设备品牌。如：apple、huawei */
    device_brand: string;
    /** 设备型号 */
    device_model: string;
    /** 设备 ID */
    device_id: string;
    /** 设备类型：phone/pad/pc */
    device_type: string;
    /** 设备方向：portrait/landscape */
    device_orientation: "portrait" | "landscape";
    /** 手机品牌。H5 不支持 */
    brand: string;
    /** 手机型号 */
    model: string;
    /** 操作系统版本 */
    system: string;
    /** 操作系统版本（简写） */
    os: string;
    /** 设备像素比 */
    pixel_ratio: number;
    /** 屏幕宽度 (px) */
    screen_width: number;
    /** 屏幕高度 (px) */
    screen_height: number;
    /** 可用窗口宽度 (px) */
    window_width: number;
    /** 可用窗口高度 (px) */
    window_height: number;
    /** 状态栏高度 (px) */
    status_bar_height: number;
    /** 微信基础库版本 */
    sdk_version: string;
    /** 宿主名称。如：WeChat、alipay */
    host_name: string;
    /** 宿主版本。如：微信版本号 */
    host_version: string;
    /** 宿主语言 */
    host_language: string;
    /** 宿主主题：light/dark */
    host_theme: string;
    /** 平台类型 weapp/toutiao/h5 */
    platform: string;
    /** 客户端语言 */
    language: string;
    /** 客户端版本号 */
    version: string;
}

const _info = ref<DeviceInfo | null>(null);

/**
 * 安全调用 uni API，失败时返回空对象，避免平台差异导致中断。
 */
function tryCall(fn: (() => unknown) | undefined): Record<string, unknown> {
    try { return (fn?.() ?? {}) as Record<string, unknown>; } catch { return {}; }
}

/**
 * 收集当前设备、窗口与宿主应用信息并归一化字段。
 */
function collect(): DeviceInfo {
    // @ts-ignore — 新 API 在旧版 @dcloudio/types 中可能未声明
    let deviceInfo = tryCall(uni.getDeviceInfo);
    // @ts-ignore
    let windowInfo = tryCall(uni.getWindowInfo);
    let appBaseInfo = tryCall(uni.getAppBaseInfo);

    if (!deviceInfo.brand && !deviceInfo.model) {
        const sys = tryCall(() => uni.getSystemInfoSync());
        deviceInfo = { ...sys };
        windowInfo = { ...sys };
        appBaseInfo = { ...sys };
    }

    let appid = "";
    try {
        const accountInfo = uni.getAccountInfoSync() as { miniProgram?: { appId?: string } };
        appid = accountInfo?.miniProgram?.appId || "";
    } catch {
        appid = (deviceInfo.appId as string) || "";
    }

    const system = (deviceInfo.system as string) || "";

    return {
        appid,
        app_name: (appBaseInfo.appName as string) || "",
        app_version: (appBaseInfo.appVersion as string) || "",
        app_version_code: (appBaseInfo.appVersionCode as string) || "",
        app_channel: (appBaseInfo.appChannel as string) || "",
        device_brand: (deviceInfo.brand as string) || "",
        device_model: (deviceInfo.model as string) || "",
        device_id: (deviceInfo.deviceId as string) || "",
        device_type: (deviceInfo.deviceType as string) || "",
        device_orientation: (windowInfo.deviceOrientation as "portrait" | "landscape") || "portrait",
        brand: (deviceInfo.brand as string) || "",
        model: (deviceInfo.model as string) || "",
        system,
        os: system.split(" ")[0] || "",
        pixel_ratio: (windowInfo.pixelRatio as number) || 0,
        screen_width: (windowInfo.screenWidth as number) || 0,
        screen_height: (windowInfo.screenHeight as number) || 0,
        window_width: (windowInfo.windowWidth as number) || 0,
        window_height: (windowInfo.windowHeight as number) || 0,
        status_bar_height: (windowInfo.statusBarHeight as number) || 0,
        sdk_version: (appBaseInfo.SDKVersion as string) || "",
        host_name: (appBaseInfo.hostName as string) || "",
        host_version: (appBaseInfo.hostVersion as string) || "",
        host_language: (appBaseInfo.hostLanguage as string) || "",
        host_theme: (appBaseInfo.hostTheme as string) || "",
        platform: (deviceInfo.platform as string) || "",
        language: (appBaseInfo.language as string) || "",
        version: (appBaseInfo.version as string) || "",
    };
}

/**
 * 确保设备信息只在首次访问时采集一次。
 */
function ensure() {
    if (!_info.value) {
        _info.value = collect();
    }
}

/**
 * 获取单例缓存的设备信息。
 */
export function useDevice() {
    ensure();
    return _info;
}

/**
 * 把 deviceInfo 对象转成 URL query string（不含前导 ?）
 */
export function deviceToQuery(): string {
    ensure();
    if (!_info.value) return "";
    return Object.entries(_info.value)
        .filter(([, v]) => v !== "" && v !== 0)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join("&");
}

/**
 * 手动清除缓存（切换账号等场景可能需要）
 */
export function clearDeviceCache(): void {
    _info.value = null;
}
