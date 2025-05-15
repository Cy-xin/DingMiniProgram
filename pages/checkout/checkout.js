Page({
  data: {
    cartItems: [], // 购物车商品
    totalPrice: 0, // 总价
    address: null, // 收货地址
  },

  /**
   * 页面加载时执行的函数
   */
  onLoad(query) {
    const cartItems = JSON.parse(decodeURIComponent(query.cartItems));
    const totalPrice = parseFloat(query.totalPrice);

    this.setData({
      cartItems,
      totalPrice
    });

    // 获取用户收货地址
    this.fetchUserAddress();
  },

  onShow() {
    console.log("显示页面......")
    this.fetchUserAddress();
  },

  /**
   * 获取用户收货地址
   */
  fetchUserAddress() {
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkAddress/getAddress`,
      method: "GET",
      headers: {
        "Authorization": "Bearer " + app.globalData.token
      },
      success: (res) => {
        if (res.data.code === 200) {
          const address = res.data.data;
          if (address != null) {
            this.setData({
              address: {
                name: address.name,
                phone: address.phone,
                detail: address.detail
              }
            });
          }
        }
      },
      fail: (err) => {
        console.error("获取收货地址失败:", err);
      }
    });
  },

  editAddress() {
    dd.navigateTo({
      url: '/pages/address/address'
    });
  },

  /**
   * 提交订单
   */
  submitOrder() {
    const app = getApp();
    const { cartItems, totalPrice, address } = this.data;

    // 1. 校验数据
    if (!cartItems || cartItems.length === 0) {
      dd.showToast({ content: '购物车为空', icon: 'none' });
      return;
    }
    if (!address) {
      dd.showToast({ content: '请先填写收货地址', icon: 'none' });
      return;
    }

    // 2. 防止重复提交（可选，需配合按钮 loading 状态）
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkOrder/createOrder`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + app.globalData.token
      },
      data: JSON.stringify({
        cartItems,
        totalPrice,
        address
      }),
      success: (res) => {
        console.log("创建订单成功信息：", res);
        if (res.data.code === 200) {
          dd.showToast({
            content: '订单提交成功',
            icon: 'success'
          });

          // 清空购物车
          app.globalData.cartItems = [];
          this.setData({ cartItems: [], totalPrice: 0 });
          // 通知购物车页面更新数据
          app.eventBus.emit('cartUpdated', []);

          // 更新购物车徽标
          this.updateCartBadge();

          dd.redirectTo({
            url: '/pages/orderDetail/orderDetail?orderNumber=' + res.data.data
          });
        } else {
          dd.showToast({
            content: res.data.msg || '订单提交失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error("订单提交失败:", err);
        dd.showToast({
          content: '网络错误，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        // 4. 恢复提交状态
        this.setData({ submitting: false });
      }
    });
  },
  /**
   * 更新购物车徽标
   */
  updateCartBadge() {
    const app = getApp();
    const total = app.globalData.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    console.log("更新徽标", total);
    if (total > 0) {
      dd.setTabBarBadge({
        index: 1, // 假设购物车是第二个tab（索引从0开始）
        text: `${total}`
      });
    } else {
      dd.removeTabBarBadge({
        index: 1
      });
    }
  },
});