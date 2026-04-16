/**
 * v-copy 指令 — 点击自动复制
 *
 * 用法：
 *   <view v-copy="text">...</view>
 *   <text v-copy="userId">{{ userId }}</text>
 *
 * 注册（main.ts）：
 *   import { vCopy } from '@hlw-uni/mp-core'
 *   app.directive('copy', vCopy)
 *
 * 原理：在 created 钩子中向 vnode.props 注入 onTap，
 * 在 uni-app 编译阶段即绑定，无需模板显式写 @tap。
 */
import type { Directive, DirectiveBinding, VNode } from 'vue'

function copyText(data: string) {
    uni.setClipboardData({
        data,
        showToast: false,
        success: () => uni.showToast({ title: '复制成功', icon: 'none', duration: 1500 }),
    })
}

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
    created(el: any, binding: DirectiveBinding, vnode: VNode) {
        injectTap(vnode, binding)
    },
    beforeUpdate(el: any, binding: DirectiveBinding, vnode: VNode) {
        injectTap(vnode, binding)
    },
}
