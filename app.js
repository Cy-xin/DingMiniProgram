// 在 app.js 中添加全局方法
App({
  globalData: {
    isAuthorized: false, // 默认未登录
    userInfo: null,      // 用户信息
    token: null,         // 用户 token
    cartItems: [],       // 购物车数据
    //baseUrl: "https://www.jxtjxx1949.cn" // 统一请求 URL 前缀
    baseUrl: "http://127.0.0.1:8081"
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
    try {
      const userInfo = dd.getStorageSync({
        key: 'userInfo',
        success: function (res) {
          if (res.data) {
            this.globalData.userInfo = res.data;
            this.globalData.token = res.data.token; // 从缓存中恢复token
            this.globalData.isAuthorized = true;
          }
        },
        fail: function (err) {
          console.log(err);
        }
      });
    } catch (e) {
      console.error('读取本地缓存失败:', e);
    }
  }
});
