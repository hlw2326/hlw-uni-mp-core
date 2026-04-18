/**
 * useAd - 小程序广告 composable
 *
 * 支持插屏广告和激励视频广告。
 */

/** 广告错误对象。 */
export interface AdError {
    errCode: number;
    errMsg: string;
}

/** 激励广告关闭回调参数。 */
export interface RewardedCloseResult {
    /** true 表示用户完整观看，可发放奖励 */
    isEnded: boolean;
}

/** useAd 返回的公共接口。 */
export interface HlwAd {
    /**
     * 展示插屏广告。
     */
    showInterstitial(unitId: string): Promise<boolean>;

    /**
     * 展示激励视频广告。
     */
    showRewarded(unitId: string): Promise<boolean>;

    /**
     * 预加载激励视频广告。
     */
    preloadRewarded(unitId: string): void;

    /**
     * 销毁所有缓存的广告实例。
     */
    destroy(): void;
}

/**
 * 广告能力封装，内部复用同一 unitId 的广告实例。
 */
export function useAd(): HlwAd {
    /** 插屏广告实例缓存。 */
    const interstitialCache = new Map<string, any>();
    /** 激励广告实例缓存。 */
    const rewardedCache = new Map<string, any>();
    /** 激励广告加载锁。 */
    const rewardedLoading = new Set<string>();

    /**
     * 获取或创建指定 unitId 的插屏广告实例。
     */
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

    /**
     * 展示插屏广告，失败时返回 false。
     */
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

    /**
     * 获取或创建指定 unitId 的激励视频广告实例。
     */
    function getRewarded(unitId: string): any {
        if (!rewardedCache.has(unitId)) {
            const ad = uni.createRewardedVideoAd({ adUnitId: unitId });
            if (!ad) return null;
            rewardedCache.set(unitId, ad);
        }
        return rewardedCache.get(unitId) ?? null;
    }

    /**
     * 预加载激励视频广告，减少展示时等待。
     */
    function preloadRewarded(unitId: string): void {
        const ad = getRewarded(unitId);
        if (!ad || rewardedLoading.has(unitId)) return;

        rewardedLoading.add(unitId);
        ad.load()
            .catch(() => {
                // 预加载失败时静默处理，show 时会再次尝试。
            })
            .finally(() => {
                rewardedLoading.delete(unitId);
            });
    }

    /**
     * 展示激励视频广告，并返回是否完整观看。
     */
    function showRewarded(unitId: string): Promise<boolean> {
        return new Promise((resolve) => {
            const ad = getRewarded(unitId);
            if (!ad) {
                console.warn(`[useAd] 激励广告创建失败，请检查 adUnitId: ${unitId}`);
                resolve(false);
                return;
            }

            let closeHandler: ((res: RewardedCloseResult) => void) | null = null;
            let errorHandler: ((err: AdError) => void) | null = null;

            /**
             * 移除本次展示过程中注册的事件监听。
             */
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

            /**
             * 真正执行广告展示逻辑。
             */
            const doShow = () =>
                ad.show().catch(() => {
                    cleanup();
                    resolve(false);
                });

            if (rewardedLoading.has(unitId)) {
                Promise.resolve().then(doShow);
            } else {
                rewardedLoading.add(unitId);
                ad.load()
                    .then(doShow)
                    .catch(doShow)
                    .finally(() => {
                        rewardedLoading.delete(unitId);
                    });
            }
        });
    }

    /**
     * 销毁全部广告实例并清空缓存。
     */
    function destroy(): void {
        interstitialCache.forEach((ad) => ad?.destroy?.());
        interstitialCache.clear();

        rewardedCache.forEach((ad) => ad?.destroy?.());
        rewardedCache.clear();

        rewardedLoading.clear();
    }

    return {
        showInterstitial,
        showRewarded,
        preloadRewarded,
        destroy,
    };
}
