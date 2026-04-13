/**
 * useShare — 小程序分享 composable
 *
 * 支持两种分享场景：
 *   1. 分享给朋友（onShareAppMessage）—— 全平台
 *   2. 分享到朋友圈（onShareTimeline）—— 仅微信小程序
 *
 * 用法一：静态配置
 *   useShare({
 *     title: '快来看看',
 *     path: '/pages/index/index',
 *     imageUrl: 'https://xxx.png',
 *   })
 *
 * 用法二：动态配置（根据分享来源返回不同内容）
 *   useShare((from) => ({
 *     title: from === 'button' ? '按钮分享' : '菜单分享',
 *     path: '/pages/index/index?from=share',
 *   }))
 *
 * 用法三：朋友 / 朋友圈分别配置
 *   useShare({
 *     title: '分享给朋友的标题',
 *     path: '/pages/index/index',
 *     timeline: {
 *       title: '分享到朋友圈的标题',
 *       query: 'id=1',
 *       imageUrl: 'https://xxx.png',
 *     },
 *   })
 */
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';

export interface ShareAppMessageContent {
    /** 分享标题 */
    title?: string;
    /** 分享路径，必须是以 / 开头的完整路径 */
    path?: string;
    /** 自定义图片路径，支持 PNG/JPG，推荐比例 5:4 */
    imageUrl?: string;
}

export interface ShareTimelineContent {
    /** 朋友圈分享标题 */
    title?: string;
    /** 自定义页面路径携带的参数，如 a=1&b=2 */
    query?: string;
    /** 自定义图片路径，推荐比例 1:1 */
    imageUrl?: string;
}

export interface ShareConfig extends ShareAppMessageContent {
    /** 朋友圈专属配置，不填则复用朋友分享的 title/imageUrl */
    timeline?: ShareTimelineContent;
}

/**
 * 分享来源：
 * - 'button' 页面内转发按钮
 * - 'menu'   右上角菜单
 */
export type ShareFrom = 'button' | 'menu';

export type ShareConfigResolver = (from: ShareFrom) => ShareConfig;

/**
 * 注册小程序分享（朋友 + 朋友圈）
 *
 * 必须在页面 setup() 中调用，内部会注册 onShareAppMessage / onShareTimeline 生命周期。
 * 朋友圈分享仅微信小程序支持，其他平台自动忽略。
 */
export function useShare(config: ShareConfig | ShareConfigResolver) {
    const resolve = (from: ShareFrom): ShareConfig =>
        typeof config === 'function' ? config(from) : config;

    // 分享给朋友
    onShareAppMessage((options) => {
        const resolved = resolve((options?.from as ShareFrom) ?? 'menu');
        const payload: ShareAppMessageContent = {};
        if (resolved.title !== undefined) payload.title = resolved.title;
        if (resolved.path !== undefined) payload.path = resolved.path;
        if (resolved.imageUrl !== undefined) payload.imageUrl = resolved.imageUrl;
        return payload;
    });

    // 分享到朋友圈（仅微信小程序，其他平台 onShareTimeline 为空实现）
    onShareTimeline(() => {
        const resolved = resolve('menu');
        const timeline = resolved.timeline ?? {};
        const payload: ShareTimelineContent = {};
        // 朋友圈未配置时回退到朋友分享的 title / imageUrl
        const title = timeline.title ?? resolved.title;
        const imageUrl = timeline.imageUrl ?? resolved.imageUrl;
        if (title !== undefined) payload.title = title;
        if (timeline.query !== undefined) payload.query = timeline.query;
        if (imageUrl !== undefined) payload.imageUrl = imageUrl;
        return payload;
    });
}
