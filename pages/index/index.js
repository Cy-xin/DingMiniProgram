Page({
  data: {
    // banners 数据已移除
    categories: [],
    products: [],
    currentCategory: {},
    quantities: {},
    filteredProducts: [],
    cartItems: [],
    cartTotalQuantity: 0, // 新增：用于悬浮按钮徽标
    searchText: '' // 新增：用于搜索
  },

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
    // 页面卸载时移除监听
    const app = getApp();
    if (this.cartUpdatedHandler) {
      app.eventBus.off('cartUpdated', this.cartUpdatedHandler);
    }
  },

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
   *
   * @param categoryId 分类ID
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

  // 搜索功能
  onSearchInput(e) {
    const searchText = e.detail.value.toLowerCase();
    this.setData({ searchText });
    
    if (searchText === '') {
      this.setData({ filteredProducts: this.data.products });
    } else {
      const filtered = this.data.products.filter(p => 
        p.name.toLowerCase().includes(searchText)
      );
      this.setData({ filteredProducts: filtered });
    }
  },

  /**
   * 增加商品数量
   *
   * @param {Object} e - 事件对象，包含当前目标元素的 dataset 属性
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
   *
   * @param {Object} e - 事件对象，包含当前目标元素的 dataset 属性
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
   * 添加新商品
   */
  addNewProduct() {
    const newProduct = {
      id: this.data.products.length + 1,
      name: `商品${this.data.products.length + 1}`,
      price: Math.floor(Math.random() * 100) + 50,
      image: '/images/default.jpg',
      categoryId: this.data.currentCategory.id || 1
    };
    this.setData({
      products: [...this.data.products, newProduct],
      filteredProducts: [...this.data.filteredProducts, newProduct]
    });
    dd.showToast({
      content: '新商品已添加',
      duration: 1000
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

  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    dd.previewImage({
      current: this.data.filteredProducts.findIndex(item => item.image === src),
      urls: this.data.filteredProducts.map(item => item.image),
    });
  },

  navigateToCart() {
    dd.switchTab({ url: '/pages/cart/cart' });
  },

  handleRefresh() {
    dd.showLoading({ title: '刷新中...' });
    if (this.data.currentCategory.id) {
      this.fetchProducts(this.data.currentCategory.id);
    } else {
      this.fetchCategories();
    }
    setTimeout(() => dd.hideLoading(), 1000);
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

  stopPropagation() {
    // 用于阻止事件冒泡
  }
});