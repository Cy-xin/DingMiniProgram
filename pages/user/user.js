Page({
  data: {
    isAuthorized: false,
    userInfo: null,
    points: 0,
    credits: 0,
    balance: 0
  },

  /**
   * 页面加载时调用的函数
   */
  onLoad() {
    console.log('页面加载 onLoad');
    this.checkAuthStatus();
  },

  /**
   * 页面显示时执行的函数
   */
  onShow() {
    const that = this;
    console.log('页面显示', this.data);
    if (this.data.isAuthorized) {
      //实时更新用户信息
      this.getUserOrderDetail();
    }
  },

  /**
   * 检查授权状态
   */
  checkAuthStatus() {
    console.log('检查授权状态');
    const that = this;
    dd.getStorage({
      key: 'userInfo',
      success: (res) => {
        console.log('获取存储的用户信息:', res.data);
        if (res.data) {
          this.setData({
            isAuthorized: true,
            userInfo: res.data
          });
        } else {
          this.setData({
            isAuthorized: false,
            userInfo: null
          });
        }

        console.log('是否登录:', this.data.isAuthorized);
        if (this.data.isAuthorized) {
          this.getUserOrderDetail();
        }
      },
      fail: (err) => {
        console.error('获取存储失败:', err);
        this.setData({
          isAuthorized: false,
          userInfo: null
        });
      }
    });
  },

  /**
   * 处理授权
   */
  handleAuth(e) {
    console.log('点击授权按钮', e);
    dd.showToast({
      content: '正在处理授权...',
      type: 'none'
    });
    
    const that = this;
    dd.getAuthCode({
      success(res) {
        console.log("获取授权码成功:", res.authCode);
        // 使用授权码换取用户信息
        that.getUserInfo(res.authCode);
      },
      fail(err) {
        console.error("获取授权码失败:", err);
        dd.showToast({
          content: '授权失败，请重试',
          type: 'fail'
        });
      }
    });
  },

  /**
   * 获取用户信息
   */
  getUserInfo(authCode) {
    const that = this;
    dd.httpRequest({
      url: "http://127.0.0.1:8081/login/getUserInfo",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify({ authCode }),
      success(res) {
        if (res.data.code == 200) {
          const userInfo = res.data.data;
          // 保存用户信息到本地存储
          dd.setStorage({
            key: 'userInfo',
            data: userInfo,
            success: () => {
              // 更新全局数据
              const app = getApp();
              app.globalData.isAuthorized = true;
              app.globalData.userInfo = userInfo;
              app.globalData.token = userInfo.token; // 假设 userInfo 中包含 token

              // 更新页面数据
              that.setData({ 
                isAuthorized: true,
                userInfo: userInfo,
                points: userInfo.points,
                credits: userInfo.credits,
                balance: userInfo.balance
              });

              dd.showToast({
                content: '登录成功',
                type: 'success'
              });

              // 登录成功获取用户订单信息
              if (that.data.isAuthorized) {
                that.getUserOrderDetail();
              }

              // 用户登录后同步购物车数据
              const cartPage = getCurrentPages().find(page => page.route === 'pages/cart/cart');
              if (cartPage) {
                cartPage.syncCartData();
              }
            },
            fail: (err) => {
              console.error('保存用户信息失败:', err);
            }
          });
        } else {
          console.error("获取用户信息失败:", res.data);
          dd.showToast({
            content: '获取用户信息失败',
            type: 'fail'
          });
        }
      },
      fail(err) {
        console.error("网络请求失败:", err);
        dd.showToast({
          content: '网络请求失败',
          type: 'fail'
        });
      }
    });
  },

  /**
   * 获取用户积分、订单数量、余额等信息
   */
  getUserOrderDetail() {
    const that = this;
    const mobile = this.data.userInfo.mobile;
    console.log('开始获取用户订单信息......', mobile);

    const app = getApp();
    dd.httpRequest({
      url: "http://127.0.0.1:8081/dingTalkOrder/getOrderDetail",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + app.globalData.token
      },
      data: JSON.stringify({ mobile }),
      success(res) {
        console.log("获取用户订单信息成功:", res.data);
        if (res.data.code == 200) {
          const userOrderDetail = res.data.data;
          that.setData({ 
            points: userOrderDetail.points,
            credits: userOrderDetail.credits,
            balance: userOrderDetail.balance
          });
        } else if (res.data.code == 501) {
          //token过期，重新登录
          dd.alert({
            title: '提示',
            content: '登录过期，请重新登录',
            buttonText: '确定',
          });

          dd.removeStorage({
            key: 'userInfo',
            success: () => {
              // 更新全局数据
              const app = getApp();
              app.globalData.isAuthorized = false;
              app.globalData.userInfo = null;
              app.globalData.token = null;

              // 更新页面数据
              that.setData({
                isAuthorized: false,
                userInfo: null,
                points: 0,
                credits: 0,
                balance: 0
              });
            }
          });
        } else {
          console.error("获取用户订单信息失败:", res.data);
          dd.showToast({
            content: '获取用户信息失败',
            type: 'fail'
          });
        }
      },
      fail(err) {
        console.error("网络请求失败:", err);
        dd.showToast({
          content: '网络请求失败',
          type: 'fail'
        });
      }
    });
  },

  /**
   * 处理退出登录
   */
  handleLogout() {
    dd.confirm({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      success: (res) => {
        if (res.confirm) {
          dd.removeStorage({
            key: 'userInfo',
            success: () => {
              // 更新全局数据
              const app = getApp();
              app.globalData.isAuthorized = false;
              app.globalData.userInfo = null;
              app.globalData.token = null;

              // 更新页面数据
              this.setData({
                isAuthorized: false,
                userInfo: null,
                points: 0,
                credits: 0,
                balance: 0
              });

              // 用户退出登录后同步购物车数据
              const cartPage = getCurrentPages().find(page => page.route === 'pages/cart/cart');
              if (cartPage) {
                cartPage.syncCartData();
              }
            }
          });
        }
      },
      fail: (err) => {
        console.error("调用 confirm 失败:", err);
      }
    });
  },

  // 导航到订单页面
  navigateToOrders() {
    dd.navigateTo({
      url: '/pages/orders/orders'
    });
  },

  // 导航到积分明细页面
  navigateToPoints() {
    dd.navigateTo({
      url: '/pages/points/points'
    });
  },

  // 导航到余额明细页面
  navigateToBalance() {
    dd.navigateTo({
      url: '/pages/balance/balance'
    });
  }
});
