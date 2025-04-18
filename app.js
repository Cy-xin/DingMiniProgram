// 在 app.js 中添加全局方法
App({
  globalData: {
    isAuthorized: false, // 默认未登录
    userInfo: null,      // 用户信息
    token: null,         // 用户 token
    cartItems: []        // 购物车数据
  },

  eventBus: {
    events: {},
    on(event, callback) {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(callback);
    },
    emit(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => callback(data));
      }
    }
  },

  /**
   * 在应用启动时调用此方法。
   *
   * @returns 无返回值。
   */
  onLaunch() {
    // 初始化逻辑
  }
});
