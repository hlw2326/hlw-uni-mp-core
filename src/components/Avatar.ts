import { defineComponent, ref, computed } from 'vue';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
}

export default defineComponent({
  name: 'Avatar',
  props: {
    src: { type: String },
    name: { type: String },
    size: { type: String as () => 'small' | 'medium' | 'large', default: 'medium' },
  },
  setup(props) {
    const loadError = ref(false);

    const initial = computed(() => {
      if (!props.name) return '?';
      return props.name.charAt(0).toUpperCase();
    });

    function onError() { loadError.value = true; }

    return () => {
      const sizeClass = `hlw-avatar--${props.size}`;
      return (
        // @ts-ignore - uni app nodes
        h('view', { class: `hlw-avatar ${sizeClass}` }, [
          props.src && !loadError.value
            ? (
              // @ts-ignore
              h('image', {
                class: 'hlw-avatar__image',
                src: props.src,
                mode: 'aspectFill',
                onError,
              })
            )
            : (
              // @ts-ignore
              h('view', { class: 'hlw-avatar__placeholder' }, [
                // @ts-ignore
                h('text', { class: 'hlw-avatar__initial' }, initial.value),
              ])
            ),
        ])
      );
    };
  },
});
