import { 
  getGoodsCategories, 
  getGoodsProducts, 
  clearCartDataToServer,
  cartDataToServer,
  getUserOrderInfo, 
  getUserInfo } from '/services/api.js';

Page({

  data: {
    //tabbar标签页
    activeTab: 0,

    //首页data相关
    categories: [],
    products: [],
    currentCategory: {},
    quantities: {},
    filteredProducts: [],
    cartItems: [],
    cartTotalQuantity: 0, // 新增：用于悬浮按钮徽标
    searchText: '', // 新增：用于搜索

    //购物车相关
    totalPrice: 0,

    //我的data相关
    isAuthorized: false,
    userInfo: null,
    points: 0,
    credits: 0,
    balance: 0,
  },

  /**
   * 切换标签 
   */
  handleTabChange(e) {
    const newIndex = parseInt(e.detail.index);
    if (newIndex === 1) {
      this.loadCartData();
    }

    this.setData({
      activeTab: newIndex
    });
  },

  //处理点击我的页面
  handleUserClick() {
    console.log("✅ 在 app-tabbar.js 中被触发了");
    // 这里可以调用任何逻辑，比如刷新购物车数据
    this.checkAuthStatus();
  },
  
  async onLoad() {
    await this.initPageData();

    const app = getApp();
    app.eventBus.on("goodsUpdated", (data) => {
      console.log("收到更新", data);
      this.setData({
        quantities: data.quantities,
        cartItems: data.totalPrice,
        totalPrice: data.totalPrice,
        cartTotalQuantity: data.cartTotalQuantity, 
      });
    });
  },

  /**
   * 页面初始化加载数据
   */
  async initPageData() {
    dd.showLoading({ content: '加载中...' });
    try {
      const categories = await getGoodsCategories();
      console.log("菜单分类信息：", categories);

      this.setData({ categories });

      // 如果有分类，默认加载第一个分类的商品
      if (categories && categories.length > 0) {
        await this.selectCategoryById(categories[0].id);
      }
    } catch (error) {
      console.error("初始化加载失败", error);
      dd.showToast({ type: 'fail', content: '数据加载失败' });
    } finally {
      dd.hideLoading();
    }
  },

  /**
   * 事件：选择分类
   */
  async selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    await this.selectCategoryById(categoryId);
  },

  /**
   * 核心逻辑：根据分类ID获取商品并更新页面
   * @param {string|number} categoryId 
   */
  async selectCategoryById(categoryId) {
    // 避免重复点击同一分类时重复加载
    if (this.data.currentCategory.id === categoryId) {
      return;
    }
    
    const currentCategory = this.data.categories.find(cat => cat.id === categoryId);
    this.setData({ 
      currentCategory,
      searchText: '', // 切换分类时清空搜索框
    });

    dd.showLoading({ content: '加载商品...' });
    try {
      const products = await getGoodsProducts(categoryId);
      console.log("商品数据：", products);
      this.setData({
        products: products,
        filteredProducts: products, // 初始状态下，展示列表和原始列表一致
      });
    } catch (error) {
      console.error("商品加载失败", error);
      // api.js 中已经有 toast 提示，这里可以只做日志记录或特定处理
    } finally {
      dd.hideLoading();
    }
  },

  // 搜索功能 (优化)
  onSearchInput(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    this.setData({ searchText });
    
    // 复用原始商品列表进行过滤，避免多次搜索后数据丢失
    const allProducts = this.data.products;
    if (!searchText) {
      this.setData({ filteredProducts: allProducts });
    } else {
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchText)
      );
      this.setData({ filteredProducts: filtered });
    }
  },

  /**
   * 点击图片展示
   */
  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    dd.previewImage({
      current: this.data.filteredProducts.findIndex(item => item.image === src),
      urls: this.data.filteredProducts.map(item => item.image),
    });
  },

  /**
   * 添加商品——检验是否登录
   */
  checkLogin(callback) {
    if (!this.data.isAuthorized) {
      dd.alert({
        title: '提示',
        content: '您需要登录后才能操作，请先登录',
        buttonText: '确定',
        success: () => {
          // 切换到 user tab
          this.setData({
            activeTab: 2
          });
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
   * 增加商品数量
   *
   * @param {Object} e - 事件对象，包含当前目标元素的 dataset 属性
   */
  increaseQuantity(e) {
    this.checkLogin(() => {
      const productId = e.currentTarget.dataset.id;
      const quantities = this.data.quantities;
      quantities[productId] = (quantities[productId] || 0) + 1;
      //更新数组数据
      this.setData({ quantities });
      //更新购物车数据
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
   * 更新购物车徽标
   */
  updateCartBadge() {
    const total = Object.values(this.data.quantities).reduce((a, b) => a + b, 0);
    console.log("图标数量：", total);
    this.setData({
      cartTotalQuantity: total
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
  },



  //购物车逻辑

  /**
   * 跳转到首页
   */
  goShopping() {
    this.setData({
      activeTab: 0
    });
  },

  /**
   * 同步购物车数据到后端
   * @param {Array} cartItems - 购物车数据
   */
  async syncCartDataToServer(cartItems) {
    await cartDataToServer(cartItems); 
  },

    /**
   * 加载购物车数据
   */
  loadCartData() {
    let cartItems = [...this.data.cartItems];
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

    console.log("数量", total);
    console.log("数量2：", this.data.totalPrice);
  },

  /**
   * 购物车增加商品数量
   *
   * @param {Object} e - 事件对象，包含当前目标元素的 dataset 属性
   */
  increaseCartQuantity(e) {
    const productId = e.currentTarget.dataset.id;
    const cartItems = this.data.cartItems.map(item => {
      if (item.id === productId) {
        return {
          ...item,
          quantity: item.quantity + 1
        };
      }
      return item;
    });

    const quantities = this.data.quantities;
    quantities[productId] = (quantities[productId] || 0) + 1;
    this.setData({ quantities });

    this.updateCartDataAndSync(cartItems);
  },

  /**
   * 减少商品数量
   *
   * @param {Object} e - 事件对象，包含当前目标元素的 dataset 属性
   */
  decreaseCartQuantity(e) {
    const productId = e.currentTarget.dataset.id;

    let cartItems = this.data.cartItems.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity - 1;
        if (newQty > 0) {
          return {
            ...item,
            quantity: newQty
          };
        } else {
          return null;
        }
      }
      return item;
    }).filter(Boolean);
    
    const quantities = this.data.quantities;
    if (quantities[productId] > 0) {
      quantities[productId] -= 1;
      this.setData({ quantities });
      this.updateCart(productId);
      this.updateCartBadge();
    }

    this.updateCartDataAndSync(cartItems);
  },

  /**
   * 统一更新购物车数据，更新视图，更新全局数据，调用后端同步并发送事件
   */
  updateCartDataAndSync(cartItems) {
    this.updateCartData(cartItems);

    const app = getApp();
    if (app.globalData.isAuthorized) {
      this.syncCartDataToServer(cartItems);
    }
  },

  /**
   * 更新购物车
   */
  updateCartData(cartItems) {
    this.setData({ cartItems });
    this.calculateTotal(cartItems);
    this.updateCartBadge();
  },

  /**
   * 清空购物车
   */
  clearCart() {
    // 检查购物车是否为空
    if (this.data.cartItems.length === 0) {
      dd.showToast({
        type: 'none',
        content: '购物车已经是空的了！',
        duration: 2000
      });
      return;
    }
    const app = getApp();
    // 添加确认提示
    dd.confirm({
      title: '确认清空购物车',
      content: '您确定要清空购物车吗？',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      success: (result) => {
        if (result.confirm) {
          // 用户点击确定
          app.globalData.cartItems = [];
          this.setData({
            cartItems: [],
            totalPrice: 0,
            quantities: {}
          });
          // 更新购物车徽标
          this.updateCartBadge();

          // 清空购物车数据
          this.syncClearCartData();
          dd.showToast({
            type: 'success',
            content: '购物车已清空',
            duration: 2000
          });
        }
      }
    });
  },

  /**
   * 清空购物车数据到后端
   */
  async syncClearCartData() {
    const result = await clearCartDataToServer();
    console.log("清空购物车，请求后端返回结果：", result);
  },

    /**
   * 跳转到结账单页面
   */
  goToCheckout() {
    const app = getApp();

    // 检查购物车是否为空
    if (this.data.cartItems.length === 0) {
      dd.showToast({
        type: 'none',
        content: '购物车是空的，请先添加商品再结算',
        duration: 2000
      });
      return;
    }

    // 检查用户是否已登录
    if (!app.globalData.isAuthorized) {
      dd.showToast({
        type: 'none',
        content: '您需要登录后才能结算，请先登录',
        duration: 2000
      });
      setTimeout(() => {
        this.setData({
          activeTab: 2
        });
      }, 2000);
      return;
    }

    const cartItems = this.data.cartItems;

    // 跳转到结账单页面
    dd.navigateTo({
      url: `/pages/checkout/checkout?cartItems=${encodeURIComponent(JSON.stringify(cartItems))}&totalPrice=${this.data.totalPrice}`
    });
  },



  //我的逻辑

  /**
   * 检查授权状态
   */
  async checkAuthStatus() {
    console.log('检查授权状态');
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
   * 获取用户积分、订单数量、余额等信息
   */
  async getUserOrderDetail() {
    const that = this;
    const mobile = this.data.userInfo.mobile;
    //console.log('开始获取用户订单信息......', mobile);
    const userOrderDetail = await getUserOrderInfo(mobile);
    if (userOrderDetail == 501) {
      //token过期，重新登录
      dd.alert({
        title: '提示',
        content: '登录过期，请重新登录',
        buttonText: '确定',
      });
      console.log('登录过期', userOrderDetail);

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
      this.setData({
        activeTab: 2
      });
    } else {
      that.setData({
        points: userOrderDetail.points,
        credits: userOrderDetail.credits,
        balance: userOrderDetail.balance
      });
    }
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
  async getUserInfo(authCode) {
    const that = this;
    const app = getApp();

    const userInfo = await getUserInfo(authCode);
    dd.setStorage({
      key: 'userInfo',
      data: userInfo,
      success: () => {
        // 更新全局数据
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

        // 登录成功获取用户订单信息，加载购物车数据
        if (that.data.isAuthorized && app.globalData.token != null) {
          that.getUserOrderDetail();
          that.fetchCartDataFromServer();
        }
      },
      fail: (err) => {
        console.error('保存用户信息失败:', err);
      }
    });
  },

    /**
   * 从服务器获取购物车数据
   */
  fetchCartDataFromServer() {
    const app = getApp();
    dd.httpRequest({
      url: `${app.urlData.baseUrl}/cart/getCartInfo`,
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
          // 通知购物车页面更新数据
          app.eventBus.emit('cartUpdated', cartItems);

          // 更新购物车徽标
          this.updateCartBadge();
        }
      },
      fail: (err) => {
        console.error("获取购物车数据失败:", err);
      }
    });
  },

  // 导航到积分明细页面
  navigateToPoints() {
    dd.navigateTo({
      url: '/pages/points/points',
      success: () => {},
      fail: (err) => {
        dd.showToast({
          content: '跳转积分列表失败：' + (err.errorMessage || '未知错误'),
          type: 'fail'
        });
      }
    });
  },

    /** 
   * 跳转到订单列表页面
   */
  navigateToOrders() {
    dd.navigateTo({
      url: '/pages/order/list',
      success: () => {},
      fail: (err) => {
        dd.showToast({
          content: '跳转订单列表失败：' + (err.errorMessage || '未知错误'),
          type: 'fail'
        });
      }
    });
  },

  /**
   * 处理退出登录
   */
  handleLogout() {
    const that = this;
    const app = getApp();
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
              app.globalData.isAuthorized = false;
              app.globalData.userInfo = null;
              app.globalData.token = null;

              // 清空购物车数据
              app.globalData.cartItems = [];

              // 更新页面数据
              this.setData({
                isAuthorized: false,
                userInfo: null,
                points: 0,
                credits: 0,
                balance: 0
              });

              // 更新购物车徽标
              this.updateCartBadge();
            }
          });
        }
      },
      fail: (err) => {
        console.error("调用 confirm 失败:", err);
      }
    });
  },

});