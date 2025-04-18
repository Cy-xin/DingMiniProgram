// components/tabbar/index.js
Component({
  methods: {
    // 切换 Tab
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      console.log('Switching to:', path);
      my.switchTab({
        url: path,
        success: () => {
          console.log('Switch success');
          this.setData({ selectedPath: path });
        },
        fail: (error) => {
          console.log('Switch failed:', error);
        }
      });
    },

    // 更新选中状态
    updateSelected() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const currentPath = currentPage.route;
      console.log('Current path:', currentPath);
      this.setData({
        selectedPath: currentPath
      });
    }
  },

  lifetimes: {
    attached() {
      this.updateSelected();
    }
  }
});