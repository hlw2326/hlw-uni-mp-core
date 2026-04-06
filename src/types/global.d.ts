/// <reference types="vite/client" />
/// <reference types="@dcloudio/types" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare const __uniConfig: {
  pages: Record<string, unknown>[];
  easycom: Record<string, unknown>;
  globalStyle: Record<string, unknown>;
  tabBar: Record<string, unknown>;
};

// === Import types from composables ===
import type { HlwMsg, ToastOptions, ModalOptions, ToastIcon } from '@/composables/msg';
import type { DeviceInfo } from '@/composables/device';
import type { HlwInstance } from '@/hlw';

// === Global Augmentation ===
declare global {
  interface Vue {
    /** 统一全局命名空间 */
    hlw: HlwInstance;
    /** 兼容旧写法 */
    $msg: HlwMsg;
  }
  interface Uni {
    hlw: HlwInstance;
    $msg: HlwMsg;
    $device: DeviceInfo;
  }
}

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }
}
