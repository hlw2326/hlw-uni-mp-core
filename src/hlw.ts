/**
 * hlw - 全局命名空间工厂
 * 提供 $msg、$device、$http、$utils、$color 的统一访问入口。
 *
 * 注意：广告能力请直接 `import { useAd } from "@hlw-uni/mp-core"`，不再通过 hlw.$ad 暴露。
 */
import { useMsg } from '@/composables/msg';
import { useDevice, type DeviceInfo } from '@/composables/device';
import { http } from '@/composables/http';
import { useUtils } from '@/composables/utils';
import { useColor } from '@/composables/color';

export interface HlwInstance {
  $msg: ReturnType<typeof useMsg>;
  $device: DeviceInfo;
  $http: typeof http;
  $utils: ReturnType<typeof useUtils>;
  $color: ReturnType<typeof useColor>;
}

let _msg: ReturnType<typeof useMsg> | null = null;
let _device: ReturnType<typeof useDevice> | null = null;
let _utils: ReturnType<typeof useUtils> | null = null;
let _color: ReturnType<typeof useColor> | null = null;

export const hlw: HlwInstance = {
  /** 延迟创建消息提示实例。 */
  get $msg() { return (_msg ??= useMsg()); },
  /** 延迟读取并缓存设备信息。 */
  get $device() { return (_device ??= useDevice()).value!; },
  /** 复用全局 HTTP 实例。 */
  $http: http,
  /** 延迟创建通用工具实例。 */
  get $utils() { return (_utils ??= useUtils()); },
  /** 延迟创建颜色工具实例。 */
  get $color() { return (_color ??= useColor()); },
};
