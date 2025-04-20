Page({
  data: {
    cartItems: [],
    totalPrice: 0
  },

  /**
   * 页面加载时执行的函数
   *
   * @param query 页面加载时传递的查询参数
   */
  onLoad(query) {
    this.loadCartData();
  },
  
  /**
   * 页面加载完成后的回调函数
   */
  onReady() {
    // 页面加载完成
  },

  /**
   * 显示页面时调用，用于更新购物车商品数量和总价
   */
  onShow() {
    const app = getApp();
    const cartItems = app.globalData.cartItems || [];
    this.calculateTotal(cartItems);
    this.setData({ cartItems });

    // 监听购物车更新事件
    app.eventBus.on('cartUpdated', (cartItems) => {
      this.setData({ cartItems });
      this.calculateTotal(cartItems);
    });

    // 如果用户已登录，从服务器加载购物车数据
    if (app.globalData.isAuthorized) {
      this.fetchCartDataFromServer();
    }
  },

  onHide() {
    // 页面隐藏
  },

  onUnload() {
    // 页面被关闭
  },
  onTitleClick() {
    // 标题被点击
  },
  onPullDownRefresh() {
    // 页面被下拉
  },
  onReachBottom() {
    // 页面被拉到底部
  },
  
  /**
   * 加载购物车数据
   */
  loadCartData() {
    const app = getApp();
    const cartItems = app.globalData.cartItems || [];
    this.setData({ cartItems });
    this.calculateTotal(cartItems);
  },

  /**
   * 计算商品总价
   *
   * @param {Array} items - 商品列表数组，每个商品为一个对象，包含价格（price）和数量（quantity）属性
   */
  calculateTotal(items = []) {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.setData({ totalPrice: total });
  },

  /**
   * 增加商品数量
   *
   * @param {Object} e - 事件对象，包含当前目标元素的 dataset 属性
   */
  increaseQuantity(e) {
    const productId = e.currentTarget.dataset.id;
    const app = getApp();
    const cartItems = app.globalData.cartItems.map(item => {
      if (item.id === productId) {
        return {
          productId: item.id, // 确保 id 字段被正确传递
          ...item,
          quantity: item.quantity + 1
        };
      }
      return item;
    });
    this.updateCart(cartItems);

    // 如果用户已登录，同步购物车数据到后端
    if (app.globalData.isAuthorized) {
      this.syncCartDataToServer(cartItems);
    }
  },

  /**
   * 减少商品数量
   *
   * @param {Object} e - 事件对象，包含当前目标元素的 dataset 属性
   */
  decreaseQuantity(e) {
    const productId = e.currentTarget.dataset.id;
    const app = getApp();
    let cartItems = app.globalData.cartItems.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity - 1;
        return newQty > 0 ? {
          productId: item.id, // 确保 id 字段被正确传递
          ...item,
          quantity: newQty
        } : null;
      }
      return item;
    }).filter(Boolean);
    this.updateCart(cartItems);

    // 如果用户已登录，同步购物车数据到后端
    if (app.globalData.isAuthorized) {
      this.syncCartDataToServer(cartItems);
    }

    // 通知首页更新购物车数据
    app.eventBus.emit('cartUpdated', cartItems);
  },

  /**
   * 更新购物车
   */
  updateCart(cartItems) {
    const app = getApp();
    app.globalData.cartItems = cartItems;
    this.setData({ cartItems });
    this.calculateTotal(cartItems);
    this.updateCartBadge();
  },

  /**
   * 更新购物车徽标
   */
  updateCartBadge() {
    const total = this.data.cartItems.reduce((sum, item) => sum + item.quantity, 0);
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

  /**
   * 清空购物车
   */
  clearCart() {
    const app = getApp();

    // 检查购物车是否为空
    if (this.data.cartItems.length === 0) {
      dd.alert({
        title: '提示',
        content: '购物车已经是空的了！',
        buttonText: '确定',
      });
      return;
    }

    // 添加确认提示
    dd.confirm({
      title: '确认清空购物车',
      content: '您确定要清空购物车吗？',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      success: (result) => {
        if (result.confirm) {
          // 用户点击确定
          // 清空全局购物车数据
          app.globalData.cartItems = [];
          // 更新页面数据
          this.setData({
            cartItems: [],
            totalPrice: 0
          });
          // 更新购物车徽标
          this.updateCartBadge();

          // 通知首页更新购物车数据
          app.eventBus.emit('cartUpdated', []);

          // 请求后端更新数据
          this.syncCartDataToServer(null);
        }
      }
    });
  },

  /**
   * 从服务器获取购物车数据
   */
  fetchCartDataFromServer() {
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/cart/getCartInfo`,
      method: "GET",
      headers: {
        "Authorization": "Bearer " + app.globalData.token
      },
      success: (res) => {
        if (res.data.code === 200) {
          const cartItems = res.data.data;
          if (!Array.isArray(cartItems)) {
            console.error('fetchCartDataFromServer: cartItems 不是数组', cartItems);
            return;
          }
          // 同步到全局数据
          app.globalData.cartItems = cartItems;
          this.setData({ cartItems });
          this.calculateTotal(cartItems);
        }
      },
      fail: (err) => {
        console.error("获取购物车数据失败:", err);
      }
    });
  },

  /**
   * 同步购物车数据到后端
   * @param {Array} cartItems - 购物车数据
   */
  syncCartDataToServer(cartItems) {
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/cart/saveCartItemByMobile`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + app.globalData.token
      },
      data: JSON.stringify({ cartItems }),
      success: (res) => {
        if (res.data.code !== 200) {
          console.error("同步购物车数据失败:", res.data);
        }
      },
      fail: (err) => {
        console.error("同步购物车数据失败:", err);
      }
    });
  },

  /**
   * 跳转到结账单页面
   */
  goToCheckout() {
    const app = getApp();
    const cartItems = app.globalData.cartItems;

    // 检查购物车是否为空
    if (cartItems.length === 0) {
      dd.alert({
        title: '提示',
        content: '购物车为空，无法结算',
        buttonText: '确定',
      });
      return;
    }

    // 跳转到结账单页面
    dd.navigateTo({
      url: `/pages/checkout/checkout?cartItems=${encodeURIComponent(JSON.stringify(cartItems))}&totalPrice=${this.data.totalPrice}`
    });
  },
});
