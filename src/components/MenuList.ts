import { defineComponent } from 'vue';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  value?: string;
  url?: string;
  action?: () => void;
}

export default defineComponent({
  name: 'MenuList',
  props: {
    items: { type: Array as () => MenuItem[], required: true },
  },
  emits: ['click'],
  setup(props, { emit }) {
    function onTap(item: MenuItem) {
      if (item.url) {
        uni.navigateTo({ url: item.url });
      } else if (item.action) {
        item.action();
      }
      emit('click', item);
    }

    return () => {
      const items = props.items.map((item) =>
        // @ts-ignore
        h('view', {
          class: 'hlw-menu-list__item',
          key: item.key,
          onClick: () => onTap(item),
        }, [
          // @ts-ignore
          h('view', { class: 'hlw-menu-list__left' }, [
            item.icon
              ? (
                // @ts-ignore
                h('text', { class: 'hlw-menu-list__icon' }, item.icon)
              )
              : null,
            // @ts-ignore
            h('text', { class: 'hlw-menu-list__label' }, item.label),
          ]),
          // @ts-ignore
          h('view', { class: 'hlw-menu-list__right' }, [
            item.value
              ? (
                // @ts-ignore
                h('text', { class: 'hlw-menu-list__value' }, item.value)
              )
              : null,
            // @ts-ignore
            h('text', { class: 'hlw-menu-list__arrow' }, '›'),
          ]),
        ]),
      );
      // @ts-ignore
      return h('view', { class: 'hlw-menu-list' }, items);
    };
  },
});
