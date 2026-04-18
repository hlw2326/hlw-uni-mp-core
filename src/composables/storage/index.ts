/**
 * useStorage - 本地存储 composable
 */
export interface StorageInstance {
    get: <T = unknown>(key: string) => T | null;
    set: <T>(key: string, value: T) => boolean;
    remove: (key: string) => boolean;
    clear: () => boolean;
    info: () => UniApp.GetStorageInfoSuccess | null;
}

/**
 * 本地存储读写工具。
 */
export function useStorage(): StorageInstance {
    /**
     * 读取指定 key 的缓存值。
     */
    function get<T = unknown>(key: string): T | null {
        try {
            const value = uni.getStorageSync(key);
            return value ?? null;
        } catch {
            return null;
        }
    }

    /**
     * 写入指定 key 的缓存值。
     */
    function set<T>(key: string, value: T): boolean {
        try {
            uni.setStorageSync(key, value);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 删除指定 key 的缓存值。
     */
    function remove(key: string): boolean {
        try {
            uni.removeStorageSync(key);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 清空全部本地缓存。
     */
    function clear(): boolean {
        try {
            uni.clearStorageSync();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取当前缓存使用信息。
     */
    function info(): UniApp.GetStorageInfoSuccess | null {
        try {
            return uni.getStorageInfoSync();
        } catch {
            return null;
        }
    }

    return { get, set, remove, clear, info };
}
