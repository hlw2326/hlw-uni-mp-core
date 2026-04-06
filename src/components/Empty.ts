import { defineComponent, useSlots } from 'vue';

export default defineComponent({
  name: 'Empty',
  props: {
    text: { type: String },
    image: { type: String },
  },
  setup(props) {
    const slots = useSlots();
    return () => {
      return (
        // @ts-ignore
        h('view', { class: 'hlw-empty' }, [
          props.image
            ? (
              // @ts-ignore
              h('image', { class: 'hlw-empty__image', src: props.image, mode: 'aspectFit' })
            )
            : (
              // @ts-ignore
              h('view', { class: 'hlw-empty__icon' }, [
                // @ts-ignore
                h('text', '📦'),
              ])
            ),
          // @ts-ignore
          h('text', { class: 'hlw-empty__text' }, props.text || '暂无数据'),
          slots.default?.(),
        ])
      );
    };
  },
});
