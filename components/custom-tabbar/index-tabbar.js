Component({
  props: {
    activeTab: 0,
    onTabChange: null,
    cartCount: 0 // 新增：购物车数量
  },
  data: {
    current: 0, // 内部维护的当前选中状态
  },

  // 组件生命周期
  didMount() {
    // 初始化时同步外部传入的activeTab
    console.log('custom-tabbar didMount, activeTab:', this.props.activeTab);
    this.setData({
      current: this.props.activeTab || 0
    });
  },

  // 监听props变化
  didUpdate(prevProps, prevData) {
    if (prevProps.activeTab !== this.props.activeTab) {
      console.log('custom-tabbar didUpdate, activeTab changed from', prevProps.activeTab, 'to', this.props.activeTab);
      this.setData({
        current: this.props.activeTab
      });
    }
  },

  methods: {
    onTabClick(e) {
      const index = parseInt(e.currentTarget.dataset.index);
      
      // 更新内部状态
      this.setData({ 
        current: index 
      });
      
      // 调用父组件传递的事件处理函数
      if (this.props.onTabChange && typeof this.props.onTabChange === 'function') {
        this.props.onTabChange({ 
          detail: { 
            index: index 
          } 
        });
      }
    },
  }
});