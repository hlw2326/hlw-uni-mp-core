/**
 * useApp — 应用根上下文
 * 生命周期、Pinia、拦截器、hlw 注入全部收敛在此
 */
import { createSSRApp, type App, type Component } from 'vue';
import { hlw } from '@/hlw';
import { http } from '@/composables/http';
import { useDevice } from '@/composables/device';
import md5 from 'md5';

let _installed = false;

export interface InterceptorOptions {
    /** API 基础地址（库模式下 import.meta.env 不可用，需在此传入） */
    baseURL?: string;
    /** 自动注入 Token 的 header 键名 */
    tokenHeader?: string;
    /** Token 来源函数（需平台自行提供） */
    getToken?: () => string;
    /** 登录失效时的处理函数（需平台自行提供） */
    onUnauthorized?: () => void;
    /** 接口业务错误码是否自动 toast */
    autoToastError?: boolean;
}

const _defaultOpts: InterceptorOptions = {
    tokenHeader: 'x-token',
    autoToastError: true,
};

/**
 * 创建 uni-app 应用入口。
 * 返回的 `createApp` 函数符合 uni-app 要求的导出签名：
 * ```ts
 * export function createApp() { return { app }; }
 * ```
 */
export function useApp() {
    /** 用于在导出前挂载插件 */
    const _plugins: Array<(app: App) => void> = [];

    /**
     * 注册一个插件（Pinia / Router 等），
     * 会在 createApp 被 uni-app 框架调用时自动 use。
     */
    function use(pluginOrInstaller: any) {
        _plugins.push((app) => app.use(pluginOrInstaller));
    }

    /**
     * 生成 uni-app 要求的 createApp 入口函数。
     * 必须在 main.ts 中以 `export { createApp }` 导出。
     */
    function install(AppComponent: Component) {
        if (_installed) {
            console.warn('[hlw] useApp().install() 应只调用一次');
        }
        _installed = true;

        function createApp() {
            const app = createSSRApp(AppComponent);
            app.config.globalProperties['hlw'] = hlw;
            _plugins.forEach((fn) => fn(app));
            return { app };
        }

        return createApp;
    }

    return { install, use, hlw, http };
}

/**
 * 从 URL 中提取所有 query 参数并按 key 排序后生成签名字符串
 */
function buildSignString(url: string): string {
    try {
        const [path, query] = url.split('?');
        if (!query) return path + '&';
        const params = query.split('&').filter(Boolean);
        params.sort();
        return params.join('&') + '&';
    } catch {
        return url;
    }
}

/** sig 签名密钥，需在平台配置中注入 */
let _sigSecret = '';

/**
 * 注册默认拦截器
 * @param options 可传入平台自定义的 token/unauthorized 处理
 */
export function setupDefaultInterceptors(options: InterceptorOptions & { sigSecret?: string } = {}) {
    const opts = { ..._defaultOpts, ...options };
    if (opts.sigSecret) _sigSecret = opts.sigSecret;
    if (opts.baseURL) http.setBaseURL(opts.baseURL);

    // 请求拦截：自动注入 Token、拼接设备信息、添加 sig 签名
    http.onRequest((config) => {
        const device = useDevice();
        if (device.value) {
            const params = new URLSearchParams();
            params.append('appid', device.value.appid);
            params.append('device_brand', device.value.device_brand);
            params.append('device_model', device.value.device_model);
            params.append('device_id', device.value.device_id);
            params.append('device_type', device.value.device_type);
            params.append('platform', device.value.platform);
            params.append('version', device.value.version);
            config.url = config.url + (config.url.includes('?') ? '&' : '?') + params.toString();
        }

        // 添加 sig 签名
        if (_sigSecret) {
            const signStr = buildSignString(config.url);
            const sig = md5(signStr + _sigSecret);
            config.url = config.url + '&sig=' + sig;
        }

        if (opts.getToken) {
            const token = opts.getToken();
            if (token) {
                config.headers = {
                    ...config.headers,
                    [opts.tokenHeader!]: token,
                };
            }
        }
        return config;
    });

    // 响应拦截：处理业务错误码
    http.onResponse((res) => {
        if (opts.autoToastError && res.code !== 0) {
            uni.showToast({ title: res.message || '请求失败', icon: 'none' });
        }
        return res;
    });

    // 错误拦截：401 跳转登录
    http.onError((err) => {
        if (err.message.includes('401')) {
            opts.onUnauthorized?.();
        }
    });
}
