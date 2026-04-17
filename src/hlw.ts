/**
 * hlw — 全局命名空间工厂
 * 提供 $msg、$device、$http、$utils 统一访问入口
 *
 * 注意：$msg、$device、$ad 使用懒加载 getter，避免在模块顶层执行
 * uni.getSystemInfoSync() 等同步 API，防止小程序启动超时。
 */
import { useMsg } from '@/composables/msg';
import { useDevice, type DeviceInfo } from '@/composables/device';
import { http } from '@/composables/http';
import { useAd } from '@/composables/ad';
import { useUtils } from '@/composables/utils';
import { useColor } from '@/composables/color';

export interface HlwInstance {
  $msg: ReturnType<typeof useMsg>;
  $device: DeviceInfo;
  $http: typeof http;
  $ad: ReturnType<typeof useAd>;
  $utils: ReturnType<typeof useUtils>;
  $color: ReturnType<typeof useColor>;
}

let _msg: ReturnType<typeof useMsg> | null = null;
let _device: ReturnType<typeof useDevice> | null = null;
let _ad: ReturnType<typeof useAd> | null = null;
let _utils: ReturnType<typeof useUtils> | null = null;
let _color: ReturnType<typeof useColor> | null = null;

export const hlw: HlwInstance = {
  get $msg() { return (_msg ??= useMsg()); },
  get $device() { return (_device ??= useDevice()).value!; },
  $http: http,
  get $ad() { return (_ad ??= useAd()); },
  get $utils() { return (_utils ??= useUtils()); },
  get $color() { return (_color ??= useColor()); },
};
