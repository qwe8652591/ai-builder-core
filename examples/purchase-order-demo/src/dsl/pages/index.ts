/**
 * DSL 页面自动加载入口
 * 
 * 所有页面在导入时自动注册到 Page Registry
 * 添加新页面只需在此添加 import
 */

// ==================== 采购订单模块 ====================
import './OrderList.page';    // /orders - 订单列表
import './OrderDetail.page';  // /orders/:id - 订单详情

// ==================== 系统管理模块 ====================
import './MetadataExplorer.page';  // /system/metadata - 元数据浏览器

// ==================== 其他模块（示例） ====================
// import './Dashboard.page';     // / - 首页
// import './ProductList.page';   // /products - 产品列表
// import './SupplierList.page';  // /suppliers - 供应商列表
// import './Settings.page';      // /settings - 系统设置

console.log('[DSL Pages] 所有页面已自动加载并注册');

