// /services/api.js

const app = getApp();
const BASE_URL = app.urlData.baseUrl;

/**
 * 封装一个通用的请求函数
 * @param {object} options - dd.httpRequest 的参数对象
 * @returns {Promise}
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    dd.httpRequest({
      ...options,
      url: `${BASE_URL}${options.url}`, // 自动拼接 baseUrl
      success: (res) => {
        if (res.data && res.data.code === 200) {
          // 只返回核心数据部分
          resolve(res.data.data);
        } else if (res.data.code == 501) {
          
          //token过期，重新登录
          dd.alert({
            title: '提示',
            content: '登录过期，请重新登录',
            buttonText: '确定',
          });
          resolve(res.data.code);
        } else {
          // 统一处理业务错误
          reject(res.data || { message: '服务器返回错误' });
        }
      },
      fail: (err) => {
        // 统一处理网络或接口调用失败
        dd.showToast({
          type: 'fail',
          content: err.errorMessage || '网络请求失败'
        });
        reject(err);
      }
    });
  });
};

/**
 * 获取商品分类信息
 */
export const getGoodsCategories = () => {
  return request({
    url: '/dingTalkGoods/getGoodsCategories',
    method: 'GET'
  });
};

/**
 * 根据分类ID获取商品列表
 * @param {string|number} categoryId - 分类ID
 */
export const getGoodsProducts = (categoryId) => {
  return request({
    url: `/dingTalkGoods/getGoodsProducts?categoryId=${categoryId}`,
    method: 'GET'
  });
};


export const getUserOrderInfo = (mobile) => {
  return request({
    url: `/dingTalkOrder/getOrderInfo`,
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + app.globalData.token
    },
    data: JSON.stringify({ mobile }),
  });
};


export const getUserInfo = (authCode) => {
  return request({
    url: `/login/getUserInfo`,
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    data: JSON.stringify({ authCode }),
  });
};