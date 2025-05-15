Page({
  data: {
    pointsList: []
  },

  onLoad() {
    this.fetchPointsDetail();
  },

  fetchPointsDetail() {
    const app = getApp();
    dd.httpRequest({
      url: `${app.globalData.baseUrl}/dingTalkOrder/pointsList`,
      method: "GET",
      headers: {
        "Authorization": "Bearer " + app.globalData.token
      },
      success: (res) => {
        if (res.data.code === 200) {
            // 处理数据确保包含商品列表字段及格式化时间
            const list = res.data.data;
            this.setData({ pointsList: list});
        }
      },
      fail: (err) => {
        dd.showToast({ content: '获取订单失败', type: 'fail' });
      }
    });
  },
});