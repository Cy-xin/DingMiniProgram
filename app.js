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
   * 在应用启动时调用此方法，优先从本地缓存恢复用户状态，无缓存时调用后端接口获取
   *
   * @returns 无返回值。
   */
  onLaunch() {
    const app = this;
    try {
      // 优先读取本地缓存
      const userInfo = dd.getStorageSync({ 
        key: 'userInfo',
        success: function (res) {
          if (res.data) {
            app.globalData.userInfo = res.data;
            app.globalData.token = res.data.token;
            app.globalData.isAuthorized = true;
            return;
          }
        },
      });
    } catch (e) {
      console.error('读取本地缓存失败:', e);
    }

    dd.getAuthCode({
      success(res) {
        console.log("app获取授权码成功:", res.authCode);
        const authCode = res.authCode;
        // 使用授权码换取用户信息
        // 无缓存时调用后端接口获取用户信息
        dd.httpRequest({
          url: `${app.globalData.baseUrl}/login/getCurrentUser`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ authCode }),
          success: (res) => {
            console.log("app获取用户数据：", res);
            if (res.data.code === 200 && res.data.data) {
              // 后端返回有效数据
              app.globalData.userInfo = res.data.data;
              app.globalData.token = res.data.data.token;
              app.globalData.isAuthorized = true;
              // 同步更新本地缓存
              dd.setStorageSync({ key: 'userInfo', data: res.data.data });
            } else {
              // 后端无有效数据，视为用户退出
              app.globalData.isAuthorized = false;
              app.globalData.userInfo = null;
              app.globalData.token = null;
              dd.removeStorageSync({ key: 'userInfo' });
            }
          },
          fail: (err) => {
            console.error('获取用户信息失败:', err);
            // 网络请求失败，视为用户退出
            app.globalData.isAuthorized = false;
            app.globalData.userInfo = null;
            app.globalData.token = null;
            dd.removeStorageSync({ key: 'userInfo' });
          }
        });
      },
      fail(err) {
        console.error("获取授权码失败:", err);
        dd.showToast({
          content: '授权失败，请重试',
          type: 'fail'
        });
      }
    });
  }
});
