/**
 * hlw — 全局命名空间工厂
 * 提供 $msg、$device、$http 统一访问入口
 *
 * 注意：$msg、$device、$ad 使用懒加载 getter，避免在模块顶层执行
 * uni.getSystemInfoSync() 等同步 API，防止小程序启动超时。
 */
import { useMsg } from '@/composables/msg';
import { useDevice } from '@/composables/device';
import { http } from '@/composables/http';
import { useAd } from '@/composables/ad';

export interface HlwInstance {
  $msg: ReturnType<typeof useMsg>;
  $device: ReturnType<typeof useDevice>;
  $http: typeof http;
  $ad: ReturnType<typeof useAd>;
}

let _msg: ReturnType<typeof useMsg> | null = null;
let _device: ReturnType<typeof useDevice> | null = null;
let _ad: ReturnType<typeof useAd> | null = null;

export const hlw: HlwInstance = {
  get $msg() { return (_msg ??= useMsg()); },
  get $device() { return (_device ??= useDevice()); },
  $http: http,
  get $ad() { return (_ad ??= useAd()); },
};
