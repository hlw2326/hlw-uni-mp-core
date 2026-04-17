/**
 * useRefs — 模板 Ref 批量管理
 *
 * 用于 v-for 场景下收集一组动态生成的子元素 / 子组件引用，
 * 避免手动为每一项声明独立的 ref 变量。
 *
 * ─────────────────────────────────────────────────────────────
 * 用法一：收集 v-for 生成的一组元素
 * ─────────────────────────────────────────────────────────────
 *   <script setup lang="ts">
 *   import { useRefs } from '@hlw-uni/mp-core'
 *
 *   const { refs, setRefs } = useRefs()
 *   const list = ref([
 *     { id: 'a', text: '第一项' },
 *     { id: 'b', text: '第二项' },
 *   ])
 *
 *   function focusItem(id: string) {
 *     // 通过 id 直接拿到对应的 DOM / 组件实例
 *     refs.value[id]?.focus()
 *   }
 *   </script>
 *
 *   <template>
 *     <view
 *       v-for="item in list"
 *       :key="item.id"
 *       :ref="setRefs(item.id)"
 *     >
 *       {{ item.text }}
 *     </view>
 *   </template>
 *
 * ─────────────────────────────────────────────────────────────
 * 用法二：收集子组件实例并调用其暴露的方法
 * ─────────────────────────────────────────────────────────────
 *   <MyInput
 *     v-for="field in fields"
 *     :key="field.name"
 *     :ref="setRefs(field.name)"
 *   />
 *
 *   // 批量校验
 *   function validateAll() {
 *     return Object.values(refs.value).every((comp) => comp?.validate?.())
 *   }
 *
 * ─────────────────────────────────────────────────────────────
 * 注意事项
 * ─────────────────────────────────────────────────────────────
 * 1. `setRefs(key)` 返回的是一个函数 ref，模板里要写 `:ref="setRefs(key)"`，
 *    不要写成 `ref="setRefs(key)"`（少了冒号就变成字符串字面量了）。
 * 2. 组件更新前（onBeforeUpdate）会自动清空 refs，避免残留已卸载节点的引用。
 *    因此**不要在 onBeforeUpdate 之后、组件重渲染之前**缓存 refs.value 的值。
 * 3. 小程序端（mp-weixin 等）`refs.value[key]` 拿到的是组件实例而不是 DOM 节点，
 *    访问原生 DOM 属性（如 offsetWidth）请改用 uni.createSelectorQuery。
 * 4. 如需带类型提示，可在调用时传入泛型收窄 refs 的类型：
 *      const { refs, setRefs } = useRefs()
 *      const input = refs.value['username'] as { focus: () => void } | undefined
 */
import { ref, onBeforeUpdate, onUnmounted } from "vue";

export function useRefs() {
    const refs = ref<Record<string, any>>({});

    onBeforeUpdate(() => {
        refs.value = {};
    });

    onUnmounted(() => {
        refs.value = {};
    });

    const setRefs = (key: string) => (el: any) => {
        if (el) refs.value[key] = el;
    };

    return { refs, setRefs };
}
