/**
 * useApp - 应用根上下文
 * 生命周期、Pinia、拦截器、hlw 注入全部收敛在此。
 */
import { createSSRApp, type App, type Component } from 'vue';
import { hlw } from '@/hlw';
import { http } from '@/composables/http';
import { useDevice } from '@/composables/device';
import md5 from 'md5';
import type { ApiResponse, RequestConfig } from '@/composables/http/types';

let _installed = false;

export interface InterceptorOptions {
    /** API 基础地址 */
    baseURL?: string;
    /** 自动注入 Token 的 header 键名 */
    tokenHeader?: string;
    /** Token 来源函数 */
    getToken?: () => string;
    /** 登录失效时的处理函数 */
    onUnauthorized?: () => void;
    /** 接口业务错误码是否自动 toast */
    autoToastError?: boolean;
}

const _defaultOpts: InterceptorOptions = {
    tokenHeader: 'x-token',
    autoToastError: true,
};

/**
 * 创建 uni-app 应用入口工具。
 */
export function useApp() {
    /** 用于在导出前挂载插件。 */
    const _plugins: Array<(app: App) => void> = [];

    /**
     * 注册一个待安装的应用插件。
     */
    function use(pluginOrInstaller: any) {
        _plugins.push((app) => app.use(pluginOrInstaller));
    }

    /**
     * 生成符合 uni-app 约定的 createApp 入口函数。
     */
    function install(AppComponent: Component) {
        if (_installed) {
            console.warn('[hlw] useApp().install() 应只调用一次');
        }
        _installed = true;

        /**
         * 创建并返回 uni-app 运行时应用实例。
         */
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
 * 提取 URL 中的 query 参数，排序后拼接为签名字符串。
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

/** sig 签名密钥。 */
let _sigSecret = '';

/**
 * 注册默认请求、响应和错误拦截器。
 */
export function setupDefaultInterceptors(options: InterceptorOptions & { sigSecret?: string } = {}) {
    const opts = { ..._defaultOpts, ...options };
    if (opts.sigSecret) _sigSecret = opts.sigSecret;
    if (opts.baseURL) http.setBaseURL(opts.baseURL);

    /**
     * 请求拦截：注入设备信息、签名和 token。
     */
    http.onRequest((config: RequestConfig) => {
        const device = useDevice();
        if (device.value) {
            const d = device.value;
            const query = [
                ['appid', d.appid],
                ['device_brand', d.device_brand],
                ['device_model', d.device_model],
                ['device_id', d.device_id],
                ['device_type', d.device_type],
                ['device_orientation', d.device_orientation],
                ['platform', d.platform],
                ['system', d.system],
                ['os', d.os],
                ['version', d.version],
                ['sdk_version', d.sdk_version],
                ['host_name', d.host_name],
                ['host_version', d.host_version],
                ['host_language', d.host_language],
                ['language', d.language],
                ['app_version', d.app_version],
                ['app_version_code', d.app_version_code],
                ['screen_width', String(d.screen_width)],
                ['screen_height', String(d.screen_height)],
            ]
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
                .join('&');
            config.url = config.url + (config.url.includes('?') ? '&' : '?') + query;
            config.headers = { ...config.headers, 'X-Appid': d.appid };
        }

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

    /**
     * 响应拦截：处理业务错误提示。
     */
    http.onResponse((res: ApiResponse<unknown>) => {
        if (opts.autoToastError && res.code !== 1) {
            uni.showToast({ title: res.info || '请求失败', icon: 'none' });
        }
        return res;
    });

    /**
     * 错误拦截：处理未授权场景。
     */
    http.onError((err: Error) => {
        if (err.message.includes('401')) {
            opts.onUnauthorized?.();
        }
    });
}
