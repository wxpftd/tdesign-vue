import {
  defineComponent, computed, inject, onMounted, getCurrentInstance,
} from 'vue';
import props from './menu-item-props';
import { TdMenuInterface, TdSubMenuInterface } from './const';
import ripple from '../utils/ripple';
import { renderContent, renderTNodeJSX } from '../utils/render-tnode';
import { getKeepAnimationMixins } from '../config-provider/config-receiver';
import { AnimationType } from '../config-provider/type';
import { usePrefixClass } from '../hooks/useConfig';

const keepAnimationMixins = getKeepAnimationMixins();

export default defineComponent({
  name: 'TMenuItem',
  mixins: [keepAnimationMixins],
  props: { ...props },
  directives: { ripple },
  setup(props, ctx) {
    const menu = inject<TdMenuInterface>('TdMenu');
    const submenu = inject<TdSubMenuInterface>('TdSubmenu', null);
    const active = computed(() => menu.activeValue.value === props.value);
    const classPrefix = usePrefixClass();

    const classes = computed(() => [
      `${classPrefix.value}-menu__item`,
      {
        [`${classPrefix.value}-is-active`]: active.value,
        [`${classPrefix.value}-is-disabled`]: props.disabled,
        [`${classPrefix.value}-menu__item--plain`]: !ctx.slots.icon && !props.icon,
        [`${classPrefix.value}-submenu__item`]: !!submenu && !menu.isHead,
      },
    ]);
    // methods
    const handleClick = () => {
      if (props.disabled) return;
      menu.select(props.value);
      ctx.emit('click');

      if (props.href) {
        window.open(props.href, props.target);
      } else if (props.to) {
        const { proxy } = getCurrentInstance();
        const router = props.router || (proxy as Record<string, any>).$router;
        const methods: string = props.replace ? 'replace' : 'push';
        router[methods](props.to).catch((err: Error) => {
          // vue-router 3.1.0+ push/replace cause NavigationDuplicated error
          // https://github.com/vuejs/vue-router/issues/2872
          // 当前path和目标path相同时，会抛出NavigationDuplicated的错误
          if (
            err.name !== 'NavigationDuplicated'
            && !err.message.includes('Avoided redundant navigation to current location')
          ) {
            throw err;
          }
        });
      }
    };

    // lifetimes
    onMounted(() => {
      menu?.vMenu?.add({
        value: props.value,
        parent: submenu?.value,
        vnode: ctx.slots.default && ctx.slots.default(),
      });
    });

    return {
      menu,
      active,
      classes,
      handleClick,
      classPrefix,
    };
  },
  render() {
    return (
      <li
        v-ripple={(this.keepAnimation as Record<AnimationType, boolean>).ripple}
        class={this.classes}
        onClick={this.handleClick}
      >
        {renderTNodeJSX(this, 'icon')}
        <span class={[`${this.classPrefix}-menu__content`]}>{renderContent(this, 'default', 'content')}</span>
      </li>
    );
  },
});
