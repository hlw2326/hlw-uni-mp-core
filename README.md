# @hlw-uni/mp-core

UniApp 运行时核心包，提供 `Composables`、`Utils`、`Components` 和统一的 `hlw` 全局命名空间，开箱即用。

## 包含模块

| 模块 | 说明 |
|------|------|
| **hlw 全局命名空间** | `hlw.$msg`、`hlw.$device`、`hlw.$http` — 在 `app.config.globalProperties` 中注入 |
| **Composables** | `useHttp`、`useLoading`、`useMsg`、`useRefs`、`useDevice` |
| **Utils** | `format`、`validate`、`storage`、`device` 工具函数 |
| **Components** | `Avatar`、`Empty`、`Loading`、`MenuList` |

## 安装

```bash
npm install @hlw-uni/mp-core
```

配合 `@hlw-uni/mp-vite-plugin` 使用，可自动注入环境变量、SCSS 主题和 Auto-Import。

## hlw 全局命名空间

通过 `app.config.globalProperties['hlw'] = hlw` 注入后，可在任何 Vue 上下文直接访问：

```ts
// 在 Options API 或模板中
this.hlw.$msg.success('操作成功');
this.hlw.$msg.confirm({ content: '确定删除？' });
this.hlw.$device.platform;  // 'mp-weixin'
this.hlw.$device.statusBarHeight;

// 在 Composition API 中直接 import
import { hlw } from '@hlw-uni/mp-core';
hlw.$msg.toast('提示');
```

> 旧写法 `$msg` 和 `$device` 仍然保留兼容。

## Composables

### useHttp — HTTP 请求

```ts
import { useHttp } from '@hlw-uni/mp-core';

const { loading, data, error, run, get, post } = useHttp();

// GET 请求
const res = await get<UserInfo>('/user/info');

// POST 请求
const res = await post('/user/login', { phone, code });

// 状态追踪
if (loading.value) { /* 显示加载态 */ }
if (error.value) { /* 处理错误 */ }
console.log(data.value);

// 全局拦截器（建议在 main.ts 中集中配置）
import { http } from '@hlw-uni/mp-core';
http.onRequest((config) => {
  const token = useUserStore().token;
  if (token) config.headers!['token'] = token;
  return config;
});
```

请求会自动携带 `token`（从用户 store 读取）。401 时自动清除存储。

> `VITE_API_BASE_URL` 通过 `@hlw-uni/mp-vite-plugin` 在编译时注入，无需手动配置。

### useLoading — Loading 状态

```ts
import { useLoading } from '@hlw-uni/mp-core';

const { loading, showLoading, hideLoading } = useLoading();

showLoading('加载中...');
const data = await fetchSomething();
hideLoading();
```

### useMsg — 消息提示

```ts
import { useMsg } from '@hlw-uni/mp-core';

const msg = useMsg();

msg.success('保存成功');       // 成功提示
msg.error('提交失败');         // 失败提示
msg.toast({ message: '提示', position: 'top' });

await msg.confirm({           // 确认对话框
  title: '提示',
  content: '确定要删除吗？',
  confirmText: '确定',
  cancelText: '取消',
});
```

同时自动注入为 `this.hlw.$msg` 或 `this.$msg`。

### useDevice — 设备信息

```ts
import { useDevice } from '@hlw-uni/mp-core';

const device = useDevice();

console.log(device.value.platform);     // 'mp-weixin'
console.log(device.value.brand);         // 'weixin'
console.log(device.value.statusBarHeight); // 20
console.log(device.value.navBarHeight);   // 64 (statusBar + 44)
```

### useRefs — 模板 Refs

```ts
import { useRefs } from '@hlw-uni/mp-core';

const { refs, setRefs } = useRefs();

// 在 <template> 中使用
// <view :ref="setRefs('item0')">...</view>
// 访问: refs.value['item0']
```

## Utils

### 格式化 (format)

```ts
import { formatDate, formatMoney, formatPhone, formatFileSize } from '@hlw-uni/mp-core';

formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');  // '2026-04-05 12:00:00'
formatMoney(1234567.89);                         // '1,234,567.89'
formatPhone('13812345678');                      // '138****5678'
formatFileSize(1024 * 1024 * 5);                // '5.00 MB'
```

### 校验 (validate)

```ts
import { validatePhone, validateEmail, validateUrl, validateIdCard, validateCarNumber, validatePassword, isEmpty } from '@hlw-uni/mp-core';

validatePhone('13812345678');   // true
validateEmail('test@example.com'); // true
validateUrl('https://example.com'); // true
validateIdCard('110101199001011234'); // true
validateCarNumber('京A12345');     // true
validatePassword('Abc12345');     // true
isEmpty(null);                    // true
isEmpty({});                      // true
```

### 存储 (storage)

```ts
import { getStorage, setStorage, removeStorage, clearStorage, getStorageInfoSync } from '@hlw-uni/mp-core';

setStorage('token', 'abc123');
const token = getStorage<string>('token');      // 'abc123'
removeStorage('token');
clearStorage();
const info = getStorageInfoSync();             // { keys: [...], currentSize: 0, limitSize: 1024 }
```

### 设备 (device)

```ts
import { getDeviceInfo, deviceToQuery, clearDeviceCache } from '@hlw-uni/mp-core';

const info = getDeviceInfo();       // 单例缓存，自动复用
const query = deviceToQuery();      // 转换为 URL query string
clearDeviceCache();                  // 清除缓存（如切换账号）
```

## Components（easycom 方式使用）

在 `pages.json` 中配置：

```json
{
  "easycom": {
    "autoscan": true,
    "regular": {
      "^hlw-(.*)": "@hlw-uni/mp-core/components/$1.vue"
    }
  }
}
```

使用示例：

```vue
<hlw-avatar :src="avatar" name="张三" size="medium" />
<hlw-empty text="暂无数据" />
<hlw-loading text="加载中..." />
<hlw-menu-list :items="menuItems" @click="onMenuClick" />
```

## 类型

```ts
import type { RequestConfig, ApiResponse, PageResult, HlwMsg, HlwInstance, DeviceInfo } from '@hlw-uni/mp-core';
```

类型声明统一在 `@hlw-uni/mp-core/types/global.d.ts`，模板项目通过 `/// <reference types="@hlw-uni/mp-core/types/global" />` 引入即可获得完整类型提示。

## 依赖

```json
{
  "peerDependencies": {
    "pinia": ">=2.1.0",
    "vue": ">=3.4.0"
  }
}
```

## 构建

```bash
npm run build   # 构建产物到 dist/
npm run dev     # 监听模式
```
