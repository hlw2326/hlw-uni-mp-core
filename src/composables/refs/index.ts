/**
 * useRefs — 模板 Ref 管理
 */
import { ref, onBeforeUpdate } from "vue";

export function useRefs() {
    const refs = ref<Record<string, any>>({});

    onBeforeUpdate(() => {
        refs.value = {};
    });

    const setRefs = (key: string) => (el: any) => {
        if (el) refs.value[key] = el;
    };

    return { refs, setRefs };
}
