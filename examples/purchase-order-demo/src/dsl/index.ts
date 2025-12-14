/**
 * DSL 自动加载入口
 * 
 * 只需要导入这个文件，所有 DSL 定义就会自动注册：
 * - Model/Domain/DTO/Service → Metadata Store
 * - Page → Page Registry（用于路由匹配）
 * - Component → Component Registry
 * 
 * 无需手动列出每个定义！
 */

// ==================== 领域层 (Domain Layer) ====================
// Model - 实体、值对象、枚举
// 🎯 导入即自动注册到 Metadata Store，类本身就是 TypeScript 类型
import './models/PurchaseOrder.model';

// Domain - 领域规则
import './domain/PurchaseOrder.domain';

// Service - 内部服务
import './services/PurchaseOrder.service';

// ==================== 基础设施层 (Infrastructure Layer) ====================
// Repository - 数据访问
import './repositories/PurchaseOrder.repository';

// ==================== 应用层 (Application Layer) ====================
// DTO - 数据传输对象
import './dto/PurchaseOrder.dto';

// AppService - 应用服务
import './services/PurchaseOrder.appservice';

// ==================== 表现层 (Presentation Layer) ====================
// 🎯 组件 - 自动注册到 Component Registry
import './components';

// 🎯 页面 - 自动注册到 Page Registry
import './pages';

// ==================== 导出说明 ====================
/**
 * 使用方式：
 * 
 * 1. 在入口文件中导入此模块：
 *    import './dsl';
 * 
 * 2. 使用 Metadata Store 获取所有 DSL 定义：
 *    import { metadataStore, getLayeredMetadata, getLayeredStats } from '@ai-builder/jsx-runtime';
 *    
 *    // 获取所有定义
 *    const all = metadataStore.getAll();
 *    
 *    // 按 DDD 分层获取
 *    const layered = getLayeredMetadata();
 *    
 *    // 获取统计信息
 *    const stats = getLayeredStats();
 * 
 * 3. 使用 Page Registry 获取页面：
 *    import { getPageByRoute, getDefaultPage, getAllPages } from '@ai-builder/jsx-runtime';
 *    
 *    // 根据路由获取页面
 *    const page = getPageByRoute('/orders');
 *    
 *    // 获取默认页面
 *    const defaultPage = getDefaultPage();
 *    
 *    // 获取所有页面（用于生成菜单）
 *    const allPages = getAllPages();
 * 
 * 4. 使用 Component Registry 获取组件：
 *    import { getComponent, getAllComponents, getComponentsByCategory } from '@ai-builder/jsx-runtime';
 *    
 *    // 根据名称获取组件
 *    const OrderCard = getComponent('OrderCard');
 *    
 *    // 获取所有业务组件
 *    const businessComponents = getComponentsByCategory('business');
 */

console.log('[DSL] 所有 DSL 定义已自动加载并注册');
