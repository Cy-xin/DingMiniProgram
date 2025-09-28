import { getGoodsCategories, getGoodsProducts } from '/services/api.js';

Page({
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

  // 刷新功能 (优化)
  async handleRefresh() {
    dd.showLoading({ content: '刷新中...' });
    try {
      if (this.data.currentCategory.id) {
        // 只刷新当前分类的商品
        const products = await getGoodsProducts(this.data.currentCategory.id);
        this.setData({
          products: products,
          filteredProducts: products,
          searchText: '', // 刷新后清空搜索
        });
      } else {
        // 如果没有当前分类（异常情况），则重新初始化
        await this.initPageData();
      }
    } catch (error) {
      console.error("刷新失败", error);
    } finally {
      dd.hideLoading();
    }
  },

  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    dd.previewImage({
      current: this.data.filteredProducts.findIndex(item => item.image === src),
      urls: this.data.filteredProducts.map(item => item.image),
    });
  },

  handleTabChange(e) {
    const newIndex = parseInt(e.detail.index);
    this.setData({
      activeTab: newIndex
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
});