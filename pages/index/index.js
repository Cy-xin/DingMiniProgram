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
    this.fetchCategories(); // 获取分类数据
    this.initCartFromGlobal(); // 从全局初始化购物车数据
    this.setupCartListener(); // 设置购物车更新监听
  },

  onShow() {
    // 每次页面显示时，都从全局更新购物车状态
    this.initCartFromGlobal();
  },

  onUnload() {
    // 页面卸载时移除监听
    const app = getApp();
    if (this.cartUpdatedHandler) {
      app.eventBus.off('cartUpdated', this.cartUpdatedHandler);
    }
  },

  // 设置购物车监听
  setupCartListener() {
    const app = getApp();
    this.cartUpdatedHandler = (cartItems) => {
      this.updateCartState(cartItems);
    };
    app.eventBus.on('cartUpdated', this.cartUpdatedHandler);
  },

  // 从全局数据初始化或更新购物车状态
  initCartFromGlobal() {
    const app = getApp();
    this.updateCartState(app.globalData.cartItems || []);
  },
  
  // 更新本地的购物车相关数据
  updateCartState(cartItems) {
    const quantities = {};
    let total = 0;
    cartItems.forEach(item => {
      quantities[item.id] = item.quantity;
      total += item.quantity;
    });
    this.setData({
      cartItems,
      quantities,
      cartTotalQuantity: total,
    });
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

  fetchCategories() {
    dd.showLoading({ title: '加载中...' });
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkGoods/getGoodsCategories`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          const categories = res.data.data;
          this.setData({ categories }, () => {
            if (categories.length > 0 && !this.data.currentCategory.id) {
              this.selectCategory({ currentTarget: { dataset: { id: categories[0].id } } });
            }
          });
        }
      },
      fail: (err) => {
        dd.showToast({ title: '加载失败', icon: 'fail' });
      },
      complete: () => {
        dd.hideLoading();
      }
    });
  },

  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    const currentCategory = this.data.categories.find(category => category.id === categoryId);
    this.setData({ currentCategory, searchText: '' }); // 切换分类时清空搜索
    this.fetchProducts(categoryId);
  },

  fetchProducts(categoryId) {
    dd.showLoading({ title: '加载商品...' });
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkGoods/getGoodsProducts?categoryId=${categoryId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({ 
            products: res.data.data,
            filteredProducts: res.data.data // 初始时，过滤列表等于完整列表
          });
        }
      },
      fail: (err) => {
        dd.showToast({ title: '商品加载失败', icon: 'none' });
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

  increaseQuantity(e) {
    this.checkLogin(() => {
      const productId = e.currentTarget.dataset.id;
      const quantities = { ...this.data.quantities };
      quantities[productId] = (quantities[productId] || 0) + 1;
      this.updateCart(productId, quantities[productId]);
    });
  },

  decreaseQuantity(e) {
    this.checkLogin(() => {
      const productId = e.currentTarget.dataset.id;
      const quantities = { ...this.data.quantities };
      if (quantities[productId] > 0) {
        quantities[productId] -= 1;
        this.updateCart(productId, quantities[productId]);
      }
    });
  },

  updateCart(productId, quantity) {
    const product = this.data.products.find(p => p.id === productId);
    if (!product) return;
    
    const app = getApp();
    app.updateCartItem(product, quantity); // 使用全局方法更新购物车
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

  stopPropagation() {
    // 用于阻止事件冒泡
  }
});