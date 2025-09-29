import { getGoodsCategories, getGoodsProducts } from '/services/api.js';

import CartPage from '/pages/cart/cart';
import UserPage from '/pages/user/user';

Page({

  components: {
    CartPage,
    UserPage
  },

  data: {
    activeTab: 0,

    //首页相关
    categories: [],
    products: [],
    currentCategory: {},
    quantities: {},
    filteredProducts: [],
    cartItems: [],
    cartTotalQuantity: 0, // 新增：用于悬浮按钮徽标
    searchText: '' // 新增：用于搜索
  },

  /**
   * 切换标签 
   */
  handleTabChange(e) {
    const newIndex = parseInt(e.detail.index);
    this.setData({
      activeTab: newIndex
    });
  },
  
  async onLoad() {
    await this.initPageData();
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

  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    dd.previewImage({
      current: this.data.filteredProducts.findIndex(item => item.image === src),
      urls: this.data.filteredProducts.map(item => item.image),
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

});