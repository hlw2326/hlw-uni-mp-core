/**
 * useRefs - 模板 Ref 批量管理
 *
 * 用于 v-for 场景下收集一组动态生成的子元素或子组件引用。
 */
import { ref, onBeforeUpdate, onUnmounted } from "vue";

/**
 * 管理动态 ref 集合，适合 v-for 场景。
 */
export function useRefs() {
    const refs = ref<Record<string, any>>({});

    onBeforeUpdate(() => {
        refs.value = {};
    });

    onUnmounted(() => {
        refs.value = {};
    });

    /**
     * 按 key 生成 ref 回调并写入 refs 集合。
     */
    const setRefs = (key: string) => (el: any) => {
        if (el) refs.value[key] = el;
    };

    return { refs, setRefs };
}
