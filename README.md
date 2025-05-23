# 校园团购小程序

## 项目概述
为学校定制的教职工团购平台，集成钉钉授权登录，提供商品浏览、在线下单、订单管理等功能。

## 功能特性
- 钉钉一键授权登录
- 商品分类浏览
- 购物车管理
- 在线支付对接
- 个人中心（积分/订单）

## 技术栈
- 钉钉小程序原生框架
- RESTful API 接口
- 自定义组件开发
- 本地缓存管理

## 快速开始
### 环境要求
- 钉钉开发者工具 v3.5.0+
- Node.js 14+

### 安装步骤
```bash
git clone <仓库地址>
cd SchoolShop
npm install
```

## 钉钉授权配置
1. 在钉钉开放平台创建小程序
2. 配置`app.js`中的企业corpId
3. 在代码中处理`handleAuth`回调

## 目录结构
```
├── assets              # 静态资源
│   ├── icons           # 系统图标
│   └── tabbar          # 导航图标
├── components          # 公共组件
│   └── tabbar          # 底部导航
├── pages               # 页面模块
│   ├── cart            # 购物车
│   ├── checkout        # 结算
│   ├── index           # 首页
│   └── user            # 个人中心
```

## 接口联调
1. 配置`app.js`中的BASE_API地址
2. 接口需支持跨域请求
3. 用户凭证存储在`dd.getStorageSync('authToken')`

## 业务流程图
```
用户授权 → 首页加载 → 商品浏览 → 加入购物车 → 下单支付 → 订单生成
```
