Page({
  data: {
    orderDetail: null,
    orderStatusMap: {
      '0': '待付款',
      '1': '已付款',
      '2': '已发货',
      '3': '已完成',
      '4': '已取消'
    }
  },

  onLoad(options) {
    const app = getApp()
    const orderNumber = options.orderNumber
    this.setData({ orderNumber })
    
    dd.showLoading({ content: '加载中...' })
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkOrder/getOrderDetail/${orderNumber}`,
      method: 'GET',
      headers: {
        "Authorization": "Bearer " + app.globalData.token
      },
      success: res => {
        if (res.data.code === 200) {
          this.setData({
            orderDetail: {
              ...res.data.data,
              createTime: this.formatTime(res.data.data.createTime),
              deliveryTime: res.data.data.deliveryTime ? this.formatTime(res.data.data.deliveryTime) : '--'
            }
          })
        }
      },
      fail: err => {
        dd.showToast({
          content: '获取订单失败',
          icon: 'none'
        })
      },
      complete: () => dd.hideLoading()
    })
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
})