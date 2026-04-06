/**
 * useDevice — 设备信息 composable（单例缓存）
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

function collect(): DeviceInfo {
    const sys = uni.getSystemInfoSync() as unknown as Record<string, unknown>;

    let appid = "";
    try {
        const accountInfo = uni.getAccountInfoSync() as { miniProgram?: { appId?: string } };
        appid = accountInfo?.miniProgram?.appId || "";
    } catch {
        appid = (sys.appId as string) || "";
    }

    let appName = "";
    let appVersion = "";
    let appVersionCode = "";
    let hostName = "";
    let hostVersion = "";
    let hostLanguage = "";
    let hostTheme = "";
    try {
        const appInfo = uni.getAppBaseInfo() as unknown as Record<string, unknown>;
        appName = (appInfo.appName as string) || "";
        appVersion = (appInfo.appVersion as string) || "";
        appVersionCode = (appInfo.appVersionCode as string) || "";
        hostName = (appInfo.hostName as string) || "";
        hostVersion = (appInfo.hostVersion as string) || "";
        hostLanguage = (appInfo.hostLanguage as string) || "";
        hostTheme = (appInfo.hostTheme as string) || "";
    } catch {
        appVersion = (sys.appVersion as string) || "";
    }

    const deviceBrand = (sys.deviceBrand as string) || "";
    const deviceModel = (sys.deviceModel as string) || "";
    const deviceId = (sys.deviceId as string) || "";
    const deviceType = (sys.deviceType as string) || "";
    const deviceOrientation = (sys.deviceOrientation as "portrait" | "landscape") || "portrait";
    const system = (sys.system as string) || "";

    return {
        appid,
        app_name: appName,
        app_version: appVersion,
        app_version_code: appVersionCode,
        app_channel: (sys.appChannel as string) || "",
        device_brand: deviceBrand,
        device_model: deviceModel,
        device_id: deviceId,
        device_type: deviceType,
        device_orientation: deviceOrientation,
        brand: (sys.brand as string) || "",
        model: (sys.model as string) || "",
        system,
        os: system.split(" ")[0] || "",
        pixel_ratio: (sys.pixelRatio as number) || 0,
        screen_width: (sys.screenWidth as number) || 0,
        screen_height: (sys.screenHeight as number) || 0,
        window_width: (sys.windowWidth as number) || 0,
        window_height: (sys.windowHeight as number) || 0,
        status_bar_height: (sys.statusBarHeight as number) || 0,
        sdk_version: (sys.SDKVersion as string) || "",
        host_name: hostName,
        host_version: hostVersion,
        host_language: hostLanguage,
        host_theme: hostTheme,
        platform: (sys.platform as string) || "",
        language: (sys.language as string) || "",
        version: (sys.version as string) || "",
    };
}

function ensure() {
    if (!_info.value) {
        _info.value = collect();
    }
}

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
