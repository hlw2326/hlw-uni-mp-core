/**
 * useShare - 小程序分享 composable
 *
 * 支持分享给朋友与分享到朋友圈两种场景。
 */
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';

export interface ShareAppMessageContent {
    /** 分享标题 */
    title?: string;
    /** 分享路径，必须是以 / 开头的完整路径 */
    path?: string;
    /** 自定义图片路径 */
    imageUrl?: string;
}

export interface ShareTimelineContent {
    /** 朋友圈分享标题 */
    title?: string;
    /** 页面携带的 query 参数 */
    query?: string;
    /** 自定义图片路径 */
    imageUrl?: string;
}

export interface ShareConfig extends ShareAppMessageContent {
    /** 朋友圈专属配置，不填则复用朋友分享配置 */
    timeline?: ShareTimelineContent;
}

/**
 * 分享来源。
 * - `button` 页面内转发按钮
 * - `menu` 右上角菜单
 */
export type ShareFrom = 'button' | 'menu';

export type ShareConfigResolver = (from: ShareFrom) => ShareConfig;

/**
 * 注册小程序分享钩子。
 */
export function useShare(config: ShareConfig | ShareConfigResolver) {
    /**
     * 根据分享来源解析最终分享配置。
     */
    const resolve = (from: ShareFrom): ShareConfig =>
        typeof config === 'function' ? config(from) : config;

    /**
     * 注册分享给朋友的回调。
     */
    onShareAppMessage((options: { from?: string } | undefined) => {
        const resolved = resolve((options?.from as ShareFrom) ?? 'menu');
        const payload: ShareAppMessageContent = {};
        if (resolved.title !== undefined) payload.title = resolved.title;
        if (resolved.path !== undefined) payload.path = resolved.path;
        if (resolved.imageUrl !== undefined) payload.imageUrl = resolved.imageUrl;
        return payload;
    });

    /**
     * 注册分享到朋友圈的回调。
     */
    onShareTimeline(() => {
        const resolved = resolve('menu');
        const timeline = resolved.timeline ?? {};
        const payload: ShareTimelineContent = {};
        const title = timeline.title ?? resolved.title;
        const imageUrl = timeline.imageUrl ?? resolved.imageUrl;
        if (title !== undefined) payload.title = title;
        if (timeline.query !== undefined) payload.query = timeline.query;
        if (imageUrl !== undefined) payload.imageUrl = imageUrl;
        return payload;
    });
}
