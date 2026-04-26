/**
 * useAd —— 完整的广告业务封装
 *
 * 内置了：
 *   - 6 个 unit_id 配置（store 缓存，调 getConfig 拉一次）
 *   - 激励视频：广告加载 loading → onShown 自动关闭 → 中途关闭挽留 modal → 看完调业务方的 claim 发奖
 *   - 插屏：一行调用
 *   - 底层 SDK 适配（onLoad / offClose / show 兜底 / 实例缓存）
 *
 * 业务侧使用方式：
 *
 *   1. 在 App.vue 注入「全局」回调（拿配置 + 校验登录）：
 *
 *      import { configAd } from "@hlw-uni/mp-core";
 *      import { getAdConfig } from "@/api/ad";
 *      import { useUserStore } from "@/store";
 *
 *      configAd({
 *          getConfig: async () => {
 *              const res = await getAdConfig();
 *              return res.code === 1 && res.data ? res.data : null;
 *          },
 *          isAuth: () => !!useUserStore().token,
 *      });
 *
 *   2. 任意页面拉配置 / 用 unit_id 渲染：
 *
 *      const { config, loadConfig, showPopup } = useAd();
 *      await loadConfig();
 *      <hlw-ad type="banner" :unit-id="config.banner" />
 *
 *   3. 看广告领奖励（业务方按场景传不同的 claim 接口）：
 *
 *      const ok = await showReward(async () => {
 *          const res = await claimAdReward();
 *          return res.code === 1
 *              ? { ok: true, reward: res.data?.reward }
 *              : { ok: false, msg: res.info };
 *      });
 *
 *      // 不传 claim 就是纯展示，看完即返回 true
 *      const ok = await showReward();
 */

import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useMsg, type HlwMsg } from "../msg";

/** 6 种广告类型 */
export type AdType = "banner" | "grid" | "custom" | "video" | "reward" | "popup";

/** 广告配置 —— 字段名跟后端表列名对齐（plugin_qz_mp.{type}_unit_id） */
export interface AdConfig {
    banner_unit_id: string;
    grid_unit_id: string;
    custom_unit_id: string;
    video_unit_id: string;
    reward_unit_id: string;
    popup_unit_id: string;
}

/** 广告错误对象（onError 回调参数） */
export interface AdError {
    errCode: number;
    errMsg: string;
}

/** 业务回调注入接口 —— configAd 时由项目提供 */
export interface AdAdapter {
    /** 拉取广告配置；返回 null 表示拉失败，store 不更新 */
    getConfig: () => Promise<AdConfig | null>;
    /** 是否已登录；不传 = 不校验（showReward 调用前会问一次） */
    isAuth?: () => boolean;
}

/** 激励视频关闭回调返回 */
export interface AdCloseResult {
    /** 用户是否完整观看 */
    isEnded: boolean;
}

/** showReward 的 claim 回调返回契约 */
export interface AdClaimResult {
    /** 本次结果：true=成功 / false=失败 */
    ok: boolean;
    /** 奖励数（用于 toast 显示 +N 积分；无则不 toast） */
    reward?: number;
    /** 失败提示语；不传不弹 toast */
    msg?: string;
    /** 仅 isEnded=false 时常用：true 让 mp-core 重新 show 一次（业务方挽留确认后用） */
    retry?: boolean;
}

/**
 * showReward 的 claim 回调签名 —— 业务方按场景实现（领积分、解锁、抽奖等）。
 * 每次广告关闭后被调用一次（无论是否完整看完），业务方根据 closeRes.isEnded 决定怎么走：
 *   - isEnded=true  → 调发奖接口 → return { ok: true, reward: N }
 *   - isEnded=false → 业务自己决定挽留：return { ok: false, retry: true } 让重新 show
 */
export type AdClaimFn = (closeRes: AdCloseResult) => Promise<AdClaimResult>;

const EMPTY: AdConfig = {
    banner_unit_id: "",
    grid_unit_id: "",
    custom_unit_id: "",
    video_unit_id: "",
    reward_unit_id: "",
    popup_unit_id: "",
};

let adapter: AdAdapter | null = null;

/**
 * 注入业务回调，应用启动时调用一次。
 * 不调用也不会崩，但 loadConfig / showReward 会无效。
 */
export function configAd(a: AdAdapter): void {
    adapter = a;
}

const useAdStore = defineStore("hlw_ad", () => {
    const config = ref<AdConfig>({ ...EMPTY });
    const loaded = ref(false);
    return { config, loaded };
});

/* ============================================================
 * 内部状态：消息单例 + 广告实例缓存
 * ============================================================ */

let _msg: HlwMsg | null = null;
const msg = (): HlwMsg => (_msg ??= useMsg());

interface RewardedEntry {
    ad: any;
    /** 同一 unit_id 是否在 load 中，避免并发 */
    loading: boolean;
}
const rewardedCache = new Map<string, RewardedEntry>();
const interstitialCache = new Map<string, any>();

/* ============================================================
 * 公共 composable
 * ============================================================ */

export function useAd() {
    const store = useAdStore();
    const { config, loaded } = storeToRefs(store);

    /** 拉取广告配置（小程序冷启动后调一次即可） */
    async function loadConfig(force = false): Promise<void> {
        if (loaded.value && !force) return;
        if (!adapter?.getConfig) {
            console.warn("[useAd] adapter.getConfig 未注入；先调用 configAd()");
            return;
        }
        try {
            const cfg = await adapter.getConfig();
            if (cfg) {
                store.config = cfg;
                store.loaded = true;
            }
        } catch (e) {
            console.warn("[useAd] load config failed", e);
        }
    }

    /** 取指定类型的 unit_id（hlw-ad 组件 / 业务直接调时用） */
    function getUnitId(type: AdType): string {
        return store.config[`${type}_unit_id` as keyof AdConfig] || "";
    }

    /**
     * 显示激励视频
     *
     * 流程：loading → 广告 UI → 关闭 → 业务 claim 回调（按 closeRes.isEnded 决定怎么走）
     *
     * @param claim 关闭后业务回调；不传则纯展示，看完即返回 true、未看完返回 false
     * @returns true=最终成功；false=未看完且业务放弃 / 配置缺失 / claim 失败
     */
    async function showReward(claim?: AdClaimFn): Promise<boolean> {
        const unitId = getUnitId("reward");
        if (!unitId) {
            msg().toast("激励广告未配置");
            return false;
        }
        if (adapter?.isAuth && !adapter.isAuth()) {
            msg().toast("请先登录");
            return false;
        }

        while (true) {
            const closeRes = await playRewardedOnce(unitId);

            // 没传 claim：默认行为 = 看完了 true / 没看完弹挽留 + 重试 / 放弃 false
            if (!claim) {
                if (closeRes.isEnded) return true;
                const goon = await confirmReward();
                if (!goon) return false;
                continue;
            }

            // 业务方决定怎么走（包括「未看完是否挽留」）
            try {
                const r = await claim(closeRes);
                if (r.retry) continue;
                if (!r.ok) {
                    if (r.msg) msg().error(r.msg);
                    return false;
                }
                if (r.reward && r.reward > 0) msg().success(`+${r.reward} 积分`);
                return true;
            } catch (e) {
                console.warn("[useAd] claim failed", e);
                msg().error("领取失败，请稍后再试");
                return false;
            }
        }
    }

    /**
     * 显示插屏广告
     * @returns true=展示成功；false=配置缺失 / show 失败（如近期已展示过）
     */
    async function showPopup(): Promise<boolean> {
        const unitId = getUnitId("popup");
        if (!unitId) return false;
        return await showInterstitialAd(unitId);
    }

    return {
        // 状态
        config,
        loaded,
        // 方法
        loadConfig,
        getUnitId,
        showReward,
        showPopup,
    };
}

/* ============================================================
 * 内部 helper：业务流程层
 * ============================================================ */

/** 播放一次激励视频，期间显示加载提示，广告 UI 弹出后自动 hide */
async function playRewardedOnce(unitId: string): Promise<AdCloseResult> {
    msg().showLoading("广告加载中");
    let hidden = false;
    const hide = () => {
        if (hidden) return;
        hidden = true;
        msg().hideLoading();
    };
    try {
        const isEnded = await showRewardedAd(unitId, { onShown: hide });
        return { isEnded };
    } finally {
        // 兜底：如果 onShown 没触发（show 直接 reject 等），最终也得关 loading
        hide();
    }
}

/**
 * 激励视频中途关闭挽留弹窗 —— 业务方在 claim 回调里也可以复用：
 *
 *   showReward(async (closeRes) => {
 *       if (!closeRes.isEnded) {
 *           const goon = await confirmReward();
 *           return { ok: false, retry: goon };
 *       }
 *       const r = await claimAdReward();
 *       return r.code === 1 ? { ok: true, reward: r.data?.reward } : { ok: false, msg: r.info };
 *   });
 *
 * @returns true=用户选「继续观看」 / false=放弃
 */
export function confirmReward(): Promise<boolean> {
    return new Promise((resolve) => {
        uni.showModal({
            title: "提示",
            content: "看完广告才可以领取奖励哦，要继续观看吗？",
            confirmText: "继续观看",
            cancelText: "放弃",
            success: (r) => resolve(!!r.confirm),
            fail: () => resolve(false),
        });
    });
}

/* ============================================================
 * 内部 helper：底层 SDK 适配
 * ============================================================ */

/**
 * 底层激励视频包装：onClose / onError 解绑 + load + show 兜底
 *
 * @param hooks.onShown 广告 UI 已渲染时回调（业务用来关 loading）
 */
function showRewardedAd(unitId: string, hooks?: { onShown?: () => void }): Promise<boolean> {
    return new Promise((resolve) => {
        let entry = rewardedCache.get(unitId);
        if (!entry) {
            const ad: any = uni.createRewardedVideoAd({ adUnitId: unitId });
            if (!ad) { resolve(false); return; }
            ad.onError?.((err: AdError) => {
                console.warn(`[useAd] reward onError (${unitId})`, err);
            });
            entry = { ad, loading: false };
            rewardedCache.set(unitId, entry);
        }
        const { ad } = entry;

        let closeHandler: ((res: { isEnded: boolean }) => void) | null = null;
        let errorHandler: ((err: AdError) => void) | null = null;
        const cleanup = () => {
            if (closeHandler) { ad.offClose?.(closeHandler); closeHandler = null; }
            if (errorHandler) { ad.offError?.(errorHandler); errorHandler = null; }
        };
        closeHandler = (res) => {
            cleanup();
            resolve(!!(res && res.isEnded));
        };
        errorHandler = (err) => {
            console.warn(`[useAd] reward show error (${unitId})`, err);
            cleanup();
            resolve(false);
        };
        ad.onClose(closeHandler);
        ad.onError(errorHandler);

        const doShow = () =>
            ad.show()
                .then(() => {
                    try { hooks?.onShown?.(); } catch (e) { console.warn("[useAd] onShown error", e); }
                })
                .catch(() => {
                    cleanup();
                    resolve(false);
                });

        if (entry.loading) {
            Promise.resolve().then(doShow);
        } else {
            entry.loading = true;
            ad.load()
                .then(doShow)
                .catch(doShow)
                .finally(() => { if (entry) entry.loading = false; });
        }
    });
}

/** 底层插屏广告包装：show 失败兜底 load → 再 show */
function showInterstitialAd(unitId: string): Promise<boolean> {
    return new Promise((resolve) => {
        let ad: any = interstitialCache.get(unitId);
        if (!ad) {
            ad = uni.createInterstitialAd({ adUnitId: unitId });
            if (!ad) { resolve(false); return; }
            ad.onError?.((err: AdError) => {
                console.warn(`[useAd] popup onError (${unitId})`, err);
            });
            interstitialCache.set(unitId, ad);
        }

        ad.show()
            .then(() => resolve(true))
            .catch(() => {
                if (typeof ad.load !== "function") { resolve(false); return; }
                ad.load()
                    .then(() => ad.show())
                    .then(() => resolve(true))
                    .catch(() => resolve(false));
            });
    });
}

/** 销毁全部广告实例并清空缓存（业务一般不用，hot reload 时调） */
export function destroyAds(): void {
    rewardedCache.forEach((e) => e.ad?.destroy?.());
    rewardedCache.clear();
    interstitialCache.forEach((ad) => ad?.destroy?.());
    interstitialCache.clear();
}
