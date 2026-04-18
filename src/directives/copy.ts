/**
 * v-copy 指令 - 点击自动复制
 *
 * 用法：
 *   <view v-copy="text">...</view>
 *   <text v-copy="userId">{{ userId }}</text>
 */
import type { Directive, DirectiveBinding, VNode } from 'vue'

/**
 * 将文本复制到剪贴板，并显示成功提示。
 */
function copyText(data: string) {
    uni.setClipboardData({
        data,
        showToast: false,
        success: () => uni.showToast({ title: '复制成功', icon: 'none', duration: 1500 }),
    })
}

/**
 * 向 vnode 注入 onTap 事件，在点击时执行复制逻辑。
 */
function injectTap(vnode: VNode, binding: DirectiveBinding) {
    if (!vnode.props) (vnode as any).props = {}
    const props = vnode.props as Record<string, any>
    const prev = props.onTap

    props.onTap = (e: any) => {
        prev?.(e)
        const value = binding.value
        if (value == null || value === '') return
        copyText(String(value))
    }
}

export const vCopy: Directive = {
    /**
     * 在指令创建时注入点击事件。
     */
    created(el: any, binding: DirectiveBinding, vnode: VNode) {
        injectTap(vnode, binding)
    },
    /**
     * 在绑定值更新前重新注入点击事件。
     */
    beforeUpdate(el: any, binding: DirectiveBinding, vnode: VNode) {
        injectTap(vnode, binding)
    },
}
