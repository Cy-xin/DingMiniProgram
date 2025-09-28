Component({
  props: {
    current: 'home' // 当前选中的 tab: home/cart/checkout/user
  },
  methods: {
    goHome() {
      if (this.props.current !== 'home') {
        dd.reLaunch({ url: '/pages/index/index' });
      }
    },
    goCart() {
      if (this.props.current !== 'cart') {
        dd.reLaunch({ url: '/pages/cart/cart' });
      }
    },
    goUser() {
      if (this.props.current !== 'user') {
        dd.reLaunch({ url: '/pages/user/user' });
      }
    }
  }
});