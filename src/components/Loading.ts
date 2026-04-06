import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Loading',
  props: {
    text: { type: String },
  },
  setup(props) {
    return () => {
      const dots = Array.from({ length: 12 }, (_, i) =>
        // @ts-ignore
        h('view', { key: i + 1, class: 'hlw-loading__dot' }),
      );
      return (
        // @ts-ignore
        h('view', { class: 'hlw-loading' }, [
          // @ts-ignore
          h('view', { class: 'hlw-loading__spinner' }, dots),
          props.text
            ? (
              // @ts-ignore
              h('text', { class: 'hlw-loading__text' }, props.text)
            )
            : null,
        ])
      );
    };
  },
});
