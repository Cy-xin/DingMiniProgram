Page({
  data: {
    orderList: [] // 实际应通过接口获取订单数据填充
  },

  onLoad() {
    this.fetchOrderList();
  },

  fetchOrderList() {
    // 调用后端接口获取订单列表
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkOrder/orderList`,
      method: "GET",
      headers: {
        "Authorization": "Bearer " + app.globalData.token
      },
      success: (res) => {
        if (res.data.code === 200) {
            // 处理数据确保包含商品列表字段及格式化时间
            const processedOrderList = res.data.data.map(item => {
              return {
                  ...item,
                  goodsList: item.goodsList || [], // 防止goodsList不存在导致渲染错误
                  formattedTime: this.formatTime(item.createTime), // 新增格式化时间字段
                  totalPrice: item.goodsList.reduce((sum, goods) => sum + (goods.price * goods.quantity), 0).toFixed(2) // 计算当前订单总价格
              };
            });
            // 计算总价格
            const totalPrice = processedOrderList.reduce((sum, order) => {
              return sum + order.goodsList.reduce((goodsSum, goods) => {
                return goodsSum + (goods.price * goods.quantity);
              }, 0);
            }, 0).toFixed(2);
            this.setData({ orderList: processedOrderList, totalPrice });
        }
      },
      fail: (err) => {
        dd.showToast({ content: '获取订单失败', type: 'fail' });
      }
    });
  },

  // 时间格式化方法（新增）
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  // 处理订单号复制
  handleCopyOrderNo(e) {
    const orderNo = e.currentTarget.dataset.orderNo;
    dd.setClipboard({
      text: orderNo,
      success: () => {
        dd.showToast({ content: '订单号已复制' });
      },
      fail: () => {
        dd.showToast({ content: '复制失败', type: 'fail' });
      }
    });
  }
});