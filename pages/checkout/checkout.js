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

  /**
   * 获取用户收货地址
   */
  fetchUserAddress() {
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/user/getAddress`,
      method: "GET",
      headers: {
        "Authorization": "Bearer " + app.globalData.token
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            address: res.data.data
          });
        }
      },
      fail: (err) => {
        console.error("获取收货地址失败:", err);
      }
    });
  },

  /**
   * 提交订单
   */
  submitOrder() {
    const app = getApp();
    const { cartItems, totalPrice, address } = this.data;

    dd.httpRequest({
      url: `${app.globalData.baseUrl}/order/create`,
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
        if (res.data.code === 200) {
          dd.showToast({
            title: '订单提交成功',
            icon: 'success'
          });

          // 清空购物车
          app.globalData.cartItems = [];
          dd.navigateBack();
        } else {
          dd.showToast({
            title: '订单提交失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error("订单提交失败:", err);
        dd.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  }
}); 