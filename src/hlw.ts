/**
 * hlw — 全局命名空间工厂
 * 提供 $msg、$device、$http 统一访问入口
 */
import { useMsg } from '@/composables/msg';
import { useDevice } from '@/composables/device';
import { http } from '@/composables/http';

const _msg = useMsg();
const _device = useDevice();

export interface HlwInstance {
  $msg: ReturnType<typeof useMsg>;
  $device: ReturnType<typeof useDevice>;
  $http: typeof http;
}

export const hlw: HlwInstance = {
  $msg: _msg,
  $device: _device,
  $http: http,
};
