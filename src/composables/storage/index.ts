/**
 * useStorage — 本地存储 composable
 */
export interface StorageInstance {
    get: <T = unknown>(key: string) => T | null;
    set: <T>(key: string, value: T) => boolean;
    remove: (key: string) => boolean;
    clear: () => boolean;
    info: () => UniApp.GetStorageInfoSuccess | null;
}

export function useStorage(): StorageInstance {
    function get<T = unknown>(key: string): T | null {
        try {
            const value = uni.getStorageSync(key);
            return value ?? null;
        } catch {
            return null;
        }
    }

    function set<T>(key: string, value: T): boolean {
        try {
            uni.setStorageSync(key, value);
            return true;
        } catch {
            return false;
        }
    }

    function remove(key: string): boolean {
        try {
            uni.removeStorageSync(key);
            return true;
        } catch {
            return false;
        }
    }

    function clear(): boolean {
        try {
            uni.clearStorageSync();
            return true;
        } catch {
            return false;
        }
    }

    function info(): UniApp.GetStorageInfoSyncResult | null {
        try {
            return uni.getStorageInfoSync();
        } catch {
            return null;
        }
    }

    return { get, set, remove, clear, info };
}
