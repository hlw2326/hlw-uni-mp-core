/**
 * useAd — 小程序广告 Composable
 *
 * 支持插屏广告（Interstitial）和激励视频广告（Rewarded Video）。
 * 底层使用 uni.createInterstitialAd / uni.createRewardedVideoAd，
 * 由 uni-app 框架自动适配微信、抖音等平台。
 *
 * 特性：
 *   - 同一 unitId 复用同一广告实例，不重复创建
 *   - 激励广告加载锁，防止并发 load 竞争
 *   - 精准移除事件监听（传入具体回调引用，不误删其他监听）
 *   - 调用 destroy() 统一释放所有实例（建议在 onUnload 中调用）
 *
 * @example
 * ```ts
 * const ad = useAd();
 *
 * onLoad(() => ad.preloadRewarded('adunit-yyy'));
 * onUnload(() => ad.destroy());
 *
 * // 插屏广告
 * await ad.showInterstitial('adunit-xxx');
 *
 * // 激励广告
 * const watched = await ad.showRewarded('adunit-yyy');
 * if (watched) giveReward();
 * ```
 */

/* -------------------------------------------------------------------------- */
/*  类型定义                                                                   */
/* -------------------------------------------------------------------------- */

/** 广告错误对象 */
export interface AdError {
    errCode: number;
    errMsg: string;
}

/** 激励广告关闭回调参数 */
export interface RewardedCloseResult {
    /** true = 用户完整观看，可发放奖励 */
    isEnded: boolean;
}

/** useAd 返回的公共接口 */
export interface HlwAd {
    /**
     * 展示插屏广告
     * @param unitId 广告单元 ID
     * @returns 是否成功触发展示
     */
    showInterstitial(unitId: string): Promise<boolean>;

    /**
     * 展示激励视频广告
     * @param unitId 广告单元 ID
     * @returns 用户是否完整观看（true = 可发奖励）
     */
    showRewarded(unitId: string): Promise<boolean>;

    /**
     * 预加载激励广告（建议在 onLoad 时调用，减少用户等待）
     * @param unitId 广告单元 ID
     */
    preloadRewarded(unitId: string): void;

    /**
     * 销毁所有缓存的广告实例（建议在 onUnload 中调用）
     */
    destroy(): void;
}

/* -------------------------------------------------------------------------- */
/*  useAd                                                                     */
/* -------------------------------------------------------------------------- */

export function useAd(): HlwAd {
    /** 插屏广告实例缓存 */
    const interstitialCache = new Map<string, any>();
    /** 激励广告实例缓存 */
    const rewardedCache = new Map<string, any>();
    /** 激励广告加载锁，避免并发重复 load */
    const rewardedLoading = new Set<string>();

    /* ---------------------------------------------------------------------- */
    /*  插屏广告                                                               */
    /* ---------------------------------------------------------------------- */

    function getInterstitial(unitId: string): any {
        if (!interstitialCache.has(unitId)) {
            const ad = uni.createInterstitialAd({ adUnitId: unitId });
            if (!ad) return null;

            ad.onError?.((err: AdError) => {
                console.error(`[useAd] 插屏广告错误 (${unitId}):`, err.errMsg, err.errCode);
            });

            interstitialCache.set(unitId, ad);
        }
        return interstitialCache.get(unitId) ?? null;
    }

    function showInterstitial(unitId: string): Promise<boolean> {
        return new Promise((resolve) => {
            const ad = getInterstitial(unitId);
            if (!ad) {
                console.warn(`[useAd] 插屏广告创建失败，请检查 adUnitId: ${unitId}`);
                resolve(false);
                return;
            }

            ad.show()
                .then(() => resolve(true))
                .catch((err: any) => {
                    console.warn("[useAd] 插屏广告展示失败:", err);
                    resolve(false);
                });
        });
    }

    /* ---------------------------------------------------------------------- */
    /*  激励视频广告                                                            */
    /* ---------------------------------------------------------------------- */

    function getRewarded(unitId: string): any {
        if (!rewardedCache.has(unitId)) {
            const ad = uni.createRewardedVideoAd({ adUnitId: unitId });
            if (!ad) return null;
            rewardedCache.set(unitId, ad);
        }
        return rewardedCache.get(unitId) ?? null;
    }

    function preloadRewarded(unitId: string): void {
        const ad = getRewarded(unitId);
        if (!ad || rewardedLoading.has(unitId)) return;

        rewardedLoading.add(unitId);
        ad.load()
            .catch(() => {
                /* 预加载失败静默处理，show 时会再次尝试 */
            })
            .finally(() => {
                rewardedLoading.delete(unitId);
            });
    }

    function showRewarded(unitId: string): Promise<boolean> {
        return new Promise((resolve) => {
            const ad = getRewarded(unitId);
            if (!ad) {
                console.warn(`[useAd] 激励广告创建失败，请检查 adUnitId: ${unitId}`);
                resolve(false);
                return;
            }

            /* 持有回调引用，确保 offClose/offError 精准移除 */
            let closeHandler: ((res: RewardedCloseResult) => void) | null = null;
            let errorHandler: ((err: AdError) => void) | null = null;

            function cleanup() {
                if (closeHandler) {
                    ad.offClose?.(closeHandler);
                    closeHandler = null;
                }
                if (errorHandler) {
                    ad.offError?.(errorHandler);
                    errorHandler = null;
                }
            }

            closeHandler = (res: RewardedCloseResult) => {
                cleanup();
                resolve(res?.isEnded ?? false);
            };

            errorHandler = (err: AdError) => {
                console.error(`[useAd] 激励广告错误 (${unitId}):`, err.errMsg, err.errCode);
                cleanup();
                resolve(false);
            };

            ad.onClose(closeHandler);
            ad.onError(errorHandler);

            const doShow = () =>
                ad.show().catch(() => {
                    cleanup();
                    resolve(false);
                });

            if (rewardedLoading.has(unitId)) {
                /* 正在预加载中，等待本轮微任务后再 show */
                Promise.resolve().then(doShow);
            } else {
                rewardedLoading.add(unitId);
                ad.load()
                    .then(doShow)
                    .catch(doShow) /* load 失败仍尝试 show（可能有缓存） */
                    .finally(() => {
                        rewardedLoading.delete(unitId);
                    });
            }
        });
    }

    /* ---------------------------------------------------------------------- */
    /*  统一销毁                                                               */
    /* ---------------------------------------------------------------------- */

    function destroy(): void {
        interstitialCache.forEach((ad) => ad?.destroy?.());
        interstitialCache.clear();

        rewardedCache.forEach((ad) => ad?.destroy?.());
        rewardedCache.clear();

        rewardedLoading.clear();
    }

    /* ---------------------------------------------------------------------- */

    return {
        showInterstitial,
        showRewarded,
        preloadRewarded,
        destroy,
    };
}
