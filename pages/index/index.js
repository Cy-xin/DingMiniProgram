Page({
  data: {
    banners: [
      {
        id: 1,
        image: 'http://www.jxtejiao.com/picture/0/3c89920df7bb42de9bb290d84ff91a96.png',
        link: '/pages/detail/detail?id=1'
      },
      {
        id: 2,
        image: 'https://ts1.tc.mm.bing.net/th/id/R-C.dcf557d34058af24103cfb3a5b827cbf?rik=iWHxNIrm9sEGTQ&riu=http%3a%2f%2fimg95.699pic.com%2fphoto%2f30681%2f1310.jpg_wh300.jpg&ehk=GYMUmuAV5D6oDPpnJHfpn9NqyEhaLmbZIj15fezDnEQ%3d&risl=&pid=ImgRaw&r=0',
        link: '/pages/detail/detail?id=2'
      },
      {
        id: 3,
        image: 'https://x0.ifengimg.com/ucms/2021_44/E666F77ED85545827E83ED8646EC297042685DFA_size174_w1080_h810.jpg',
        link: '/pages/detail/detail?id=3'
      }
    ],
    categories: [],
    products: [], // 初始化为空数组
    currentCategory: {},
    quantities: {},
    filteredProducts: [],
    cartItems: []
  },

  /**
   * 页面加载时执行的函数
   */
  onLoad() {
    // 初始化购物车数量
    const quantities = {};
    this.data.products.forEach(product => {
      quantities[product.id] = 0;
    });
    this.setData({ quantities });

    // 获取分类数据
    this.fetchCategories();

    const app = getApp();
    this.cartUpdatedHandler = (cartItems) => {
      const quantities = {};
      cartItems.forEach(item => {
        quantities[item.id] = item.quantity;
      });
      this.setData({
        cartItems,
        quantities
      });
    };
    app.eventBus.on('cartUpdated', this.cartUpdatedHandler);
  },

  onShow() {
    console.log("页面显示onShow");
    const app = getApp();

    // 这里打印的是当前 data 中的值（还未更新）
    console.log("当前 cartItems", this.data.cartItems);
    console.log("当前 quantities", this.data.quantities);
  },

  onUnload() {
    const app = getApp();
    if (this.cartUpdatedHandler) {
      app.eventBus.off('cartUpdated', this.cartUpdatedHandler);
    }
  },

  /**
   * 检查登录状态
   * @param {Function} callback - 登录成功后的回调函数
   * @returns {boolean} - 是否已登录
   */
  checkLogin(callback) {
    const app = getApp();
    if (!app.globalData.isAuthorized) {
      dd.alert({
        title: '提示',
        content: '您需要登录后才能操作，请先登录',
        buttonText: '确定',
        success: () => {
          dd.switchTab({ url: '/pages/user/user' });
        }
      });
      return false;
    }
    if (typeof callback === 'function') {
      callback();
    }
    return true;
  },

  /**
   * 从服务器获取分类信息
   */
  fetchCategories() {
    dd.showLoading({ 
      title: '加载中...' 
    });
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkGoods/getGoodsCategories`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          console.log("菜单分类信息：", res.data)
          const categories = res.data.data;
          this.setData({ categories }, () => {
            if (categories.length > 0) {
              this.selectCategory({ 
                currentTarget: { dataset: { id: categories[0].id } } 
              });
            }
          });
        }
      },
      fail: (err) => {
        dd.showToast({ 
          title: '加载失败', 
          icon: 'fail',
          content: "code:" + err.error + "，mge:" + err.errorMessage
        });
      },
      complete: () => {
        dd.hideLoading();
      }
    });
  },

  /**
   * 选择分类
   * @param {Object} e - 事件对象
   */
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    const currentCategory = this.data.categories.find(category => category.id === categoryId);
    this.setData({ currentCategory });
    this.fetchProducts(categoryId);
  },

  /**
   * 根据分类ID获取商品列表
   * @param {string} categoryId - 分类ID
   */
  fetchProducts(categoryId) {
    dd.showLoading({ title: '加载商品...' });
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkGoods/getGoodsProducts?categoryId=${categoryId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          console.log("商品数据：", res.data);
          this.setData({ 
            filteredProducts: res.data.data,
            products: res.data.data
          });
        }
      },
      fail: (err) => {
        dd.showToast({ 
          title: '商品加载失败', 
          icon: 'none',
          content: err.errorMessage || '网络错误'
        });
      },
      complete: () => {
        dd.hideLoading();
      }
    });
  },

  /**
   * 增加商品数量
   * @param {Object} e - 事件对象
   */
  increaseQuantity(e) {
    this.checkLogin(() => {
      const productId = e.currentTarget.dataset.id;
      const quantities = this.data.quantities;
      quantities[productId] = (quantities[productId] || 0) + 1;
      this.setData({ quantities });
      this.updateCart(productId);
      this.updateCartBadge();
    });
  },

  /**
   * 减少商品数量
   * @param {Object} e - 事件对象
   */
  decreaseQuantity(e) {
    this.checkLogin(() => {
      const productId = e.currentTarget.dataset.id;
      const quantities = this.data.quantities;
      if (quantities[productId] > 0) {
        quantities[productId] -= 1;
        this.setData({ quantities });
        this.updateCart(productId);
        this.updateCartBadge();
      }
    });
  },

  /**
   * 更新购物车徽标
   */
  updateCartBadge() {
    const total = Object.values(this.data.quantities).reduce((a, b) => a + b, 0);
    if (total > 0) {
      dd.setTabBarBadge({
        index: 1, // 假设购物车在第二个tab
        text: total.toString()
      });
    } else {
      dd.removeTabBarBadge({
        index: 1
      });
    }
  },

  /**
   * 预览商品图片
   * @param {Object} e - 事件对象
   */
  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    const currentIndex = this.data.filteredProducts.findIndex(item => item.image === src);
    
    dd.previewImage({
      current: src,
      urls: this.data.filteredProducts.map(item => item.image),
      current: currentIndex
    });
  },

  /**
   * 更新购物车
   * @param {string} productId - 商品ID
   */
  updateCart(productId) {
    const quantity = this.data.quantities[productId] || 0;
    const product = this.data.filteredProducts.find(p => p.id === productId);
    
    let cartItems = [...this.data.cartItems];
    const index = cartItems.findIndex(item => item.id === productId);
    
    if (quantity > 0) {
      if (index === -1) {
        cartItems.push({
          ...product,
          quantity
        });
      } else {
        cartItems[index].quantity = quantity;
      }
    } else {
      cartItems = cartItems.filter(item => item.id !== productId);
    }
    
    // 同步到全局数据
    const app = getApp();
    app.globalData.cartItems = cartItems;
    this.setData({ cartItems });

    // 如果用户已登录，同步购物车数据到后端
    if (app.globalData.isAuthorized) {
      this.syncCartDataToServer(cartItems);
    }

    // 通过事件总线通知购物车页面
    app.eventBus.emit('cartUpdated', cartItems);
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
   * 页面加载完成时执行的函数
   */
  onReady() {
    this.calculateScrollHeight();
  },

  /**
   * 计算滚动高度
   */
  calculateScrollHeight() {
    const query = dd.createSelectorQuery();
    query.select('.banner-swiper').boundingClientRect();
    query.select('.main-wrapper').boundingClientRect();
    query.exec(res => {
      const bannerHeight = (res[0] && res[0].height) || 0;
      const mainHeight = (res[1] && res[1].height) || 0;
      this.setData({
        scrollHeight: mainHeight - bannerHeight - 20 // 减去边距
      });
    });
  },

  /**
   * 跳转到购物车页面
   */
  navigateToCart() {
    dd.switchTab({
      url: '/pages/cart/cart'
    });
  },

  /**
   * 刷新页面数据
   */
  handleRefresh() {
    dd.showLoading({ title: '刷新中...' });
    // 重新加载分类和商品数据
    this.fetchCategories();
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    return;
  }
});