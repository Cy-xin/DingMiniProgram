Page({
  data: {
    addressList: [], // 地址列表
    currentAddress: null, // 当前选中地址
    editMode: false, // 是否为编辑模式
    editAddress: {
      name: '',
      phone: '',
      detail: ''
    }
  },

  onLoad() {
    this.fetchAddressList();
  },

  // 获取地址列表
  fetchAddressList() {
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkAddress/getAddress`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      success: (res) => {
        if (res.data.code === 200) {
          if (res.data.data != null) {
            this.setData({
              addressList: [res.data.data],
              editMode: true,
              editAddress: res.data.data
            });
          } else {
            this.setData({
              editMode: true,
            });
          }
        }
      },
      fail: (err) => {
        console.error('获取地址列表失败:', err);
        dd.showToast({
          content: '获取地址失败',
          icon: 'none'
        });
      }
    });
  },

  // 输入事件处理
  onNameInput(e) {
    this.setData({
      'editAddress.name': e.detail.value
    });
  },

  onPhoneInput(e) {
    this.setData({
      'editAddress.phone': e.detail.value
    });
  },

  onDetailInput(e) {
    this.setData({
      'editAddress.detail': e.detail.value
    });
  },

  // 保存地址
  saveAddress() {
    const app = getApp();
    const method = this.data.editAddress.id ? 'POST' : 'POST';
    const url = this.data.editAddress.id ? 
      `${app.globalData.baseUrl}/dingTalkAddress/updateAddress` :
      `${app.globalData.baseUrl}/dingTalkAddress/addAddress`;

    dd.httpRequest({
      url: url,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + app.globalData.token
      },
      data: JSON.stringify(this.data.editAddress),
      success: (res) => {
        if (res.data.code === 200) {
          dd.showToast({
            content: '保存成功',
            icon: 'success'
          });
          this.fetchAddressList();

          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          prevPage.fetchUserAddress();
          dd.navigateBack({
            delta: 1
          });
        }
      },
      fail: (err) => {
        console.error('保存地址失败:', err);
        dd.showToast({
          content: '保存失败',
          icon: 'none'
        });
      }
    });
  },

  // 取消编辑
  cancelEdit() {
    dd.navigateBack({
      delta: 1
    });
  },

});