/**
 * 扩展模块入口
 * 
 * 🎯 使用 Module Augmentation 扩展已有的领域对象和元数据
 * 
 * 扩展类型：
 * 1. 领域对象扩展：给 Model/Entity 添加方法（如 getStatusLabel、isEditable）
 * 2. 元数据扩展：给装饰器选项添加属性（如 Field 的 displayFormat、tooltip）
 * 
 * 使用方式：在应用入口处 import 此模块即可激活所有扩展
 * ```typescript
 * import './dsl/extensions';
 * ```
 */

// ==================== 元数据扩展 ====================
// 🎯 扩展 Field/Column/Entity/DTO 等装饰器的选项
import './Metadata.ext';

// ==================== 领域对象扩展 ====================
// 🎯 给领域对象添加计算方法
import './PurchaseOrder.ext';
import './Material.ext';
import './Supplier.ext';

console.log('[Extensions] 已加载所有扩展模块');




