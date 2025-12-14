/**
 * 采购订单仓储 - ORM DSL 版本
 * 
 * 🎯 使用 ORM DSL 操作领域模型
 * - 声明式查询语法，链式 API
 * - 类型安全，自动补全
 * - 运行时适配到具体 ORM（InMemory / MikroORM）
 */

import { 
  Repository, 
  Method,
  // ORM DSL
  query,
  create,
  update,
  remove,
  save,        // 🆕 聚合保存
  findById,    // 🆕 根据 ID 查找
} from '@ai-builder/jsx-runtime';

// 🎯 直接使用领域模型，避免重复定义
import { 
  PurchaseOrderStatus,
  PurchaseOrder as PurchaseOrderEntity, // 用于 ORM DSL
  type PurchaseOrder,
  type PurchaseOrderItem,
  type SupplierInfo,
} from '../models/PurchaseOrder.model';
import { Supplier } from '../models/Supplier.model';
import { Material } from '../models/Material.model';

// 从 defineTypedEnum 获取类型
type PurchaseOrderStatusType = keyof typeof PurchaseOrderStatus.values;

// ==================== 工具函数 ====================

/** 生成订单号 */
function generateOrderNo(seq: number): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `PO${y}${m}${d}${String(seq).padStart(4, '0')}`;
}

// 🎯 Mock 数据现在由 database.ts 通过 resources/data.sql 加载

// ==================== Repository 实现 ====================

/**
 * 采购订单 Repository
 * 
 * 🎯 使用 ORM DSL 进行数据操作
 * - query(): 查询构建器
 * - create(): 创建实体
 * - update(): 更新实体
 * - remove(): 删除实体
 */
@Repository({ 
  description: '采购订单数据访问',
  entity: 'PurchaseOrder',
  table: 'purchase_orders',
})
export class PurchaseOrderRepository {
  
  // ==================== CRUD 方法 ====================
  
  /**
   * 创建订单
   */
  @Method({ description: '创建订单', command: true })
  static async create(data: {
    title: string;
    supplier: SupplierInfo;
    items: Omit<PurchaseOrderItem, 'id'>[];
    remark?: string;
    createdBy: string;
  }): Promise<string> {
    // 计算总金额
    let totalAmount = 0;
    const items: PurchaseOrderItem[] = data.items.map((item, index) => {
      const amount = item.quantity * item.unitPrice;
      totalAmount += amount;
      return {
        ...item,
        id: `item_${Date.now()}_${index}`,
      };
    });
    
    // 获取当前订单数量生成订单号
    const count = await query(PurchaseOrderEntity).count();
    const orderNo = generateOrderNo(count + 1);
    
    // 🎯 使用 ORM DSL 创建
    const order = await create(PurchaseOrderEntity, {
      orderNo,
      title: data.title,
      supplier: data.supplier,
      items,
      totalAmount,
      status: 'DRAFT' as PurchaseOrderStatusType,
      createdBy: data.createdBy,
      remark: data.remark,
    }).execute();
    
    console.log('[Repository] 创建订单:', order.id);
    return order.id;
  }
  
  /**
   * 根据 ID 查询
   */
  @Method({ description: '根据ID查询', query: true })
  static async findById(id: string): Promise<PurchaseOrder | null> {
    // 🎯 使用 ORM DSL 查询
    const result = await query(PurchaseOrderEntity)
      .where({ id })
      .first();
    
    return result as PurchaseOrder | null;
  }
  
  /**
   * 查询列表
   */
  @Method({ description: '查询列表', query: true })
  static async findList(params: {
    status?: string;
    keyword?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ data: PurchaseOrder[]; total: number }> {
    // 🎯 使用 ORM DSL 构建查询
    let queryBuilder = query(PurchaseOrderEntity);
    
    // 状态过滤
    if (params.status) {
      queryBuilder = queryBuilder.where({ status: params.status as PurchaseOrderStatusType });
    }
    
    // 关键词搜索 - 使用 ilike 模糊匹配
    if (params.keyword) {
      queryBuilder = queryBuilder
        .where('title', 'ilike', params.keyword)
        .orWhere('orderNo', 'ilike', params.keyword);
    }
    
    // 排序
    queryBuilder = queryBuilder.orderBy('createdAt', 'desc');
    
    // 分页
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const pageNo = Math.floor(offset / limit) + 1;
    queryBuilder = queryBuilder.paginate(pageNo, limit);
    
    const result = await queryBuilder.execute();
    
    return {
      data: result.data as PurchaseOrder[],
      total: result.total,
    };
  }
  
  /**
   * 更新订单
   */
  @Method({ description: '更新订单', command: true })
  static async update(id: string, data: Partial<PurchaseOrder>): Promise<boolean> {
    // 🎯 使用 ORM DSL 更新
    const count = await update(PurchaseOrderEntity)
      .where({ id })
      .set(data as Partial<PurchaseOrderEntity>)
      .execute();
    
    console.log('[Repository] 更新订单:', id, count > 0 ? '成功' : '失败');
    return count > 0;
  }
  
  /**
   * 更新状态
   */
  @Method({ description: '更新订单状态', command: true })
  static async updateStatus(id: string, status: string): Promise<boolean> {
    // 🎯 使用 ORM DSL 更新
    const count = await update(PurchaseOrderEntity)
      .where({ id })
      .set({ status: status as PurchaseOrderStatusType })
      .execute();
    
    console.log('[Repository] 更新订单状态:', id, '->', status);
    return count > 0;
  }
  
  /**
   * 删除订单
   */
  @Method({ description: '删除订单', command: true })
  static async delete(id: string): Promise<boolean> {
    // 🎯 使用 ORM DSL 删除
    const count = await remove(PurchaseOrderEntity)
      .where({ id })
      .execute();
    
    console.log('[Repository] 删除订单:', id);
    return count > 0;
  }
  
  // ==================== 业务查询方法 ====================
  
  /**
   * 获取供应商选项列表
   */
  @Method({ description: '获取供应商选项', query: true })
  static async getSupplierOptions(): Promise<SupplierInfo[]> {
    // 🎯 从 Supplier 实体查询
    const result = await query(Supplier)
      .where({ status: 'ACTIVE' })
      .orderBy('name', 'asc')
      .execute();
    
    // 转换为 SupplierInfo 格式
    return result.data.map(s => ({
      code: s.code,
      name: s.name,
      contactPerson: s.contactPerson,
      contactPhone: s.contactPhone,
      address: s.address,
    }));
  }
  
  /**
   * 获取物料选项列表
   */
  @Method({ description: '获取物料选项', query: true })
  static async getMaterialOptions(): Promise<Array<{
    materialCode: string;
    materialName: string;
    unit: string;
    latestPrice: number;
    specification?: string;
  }>> {
    // 🎯 从 Material 实体查询
    const result = await query(Material)
      .where({ status: 'ACTIVE' })
      .orderBy('name', 'asc')
      .execute();
    
    return result.data.map(m => ({
      materialCode: m.code,
      materialName: m.name,
      unit: m.unit || '',
      latestPrice: m.latestPrice || m.price || 0,
      specification: m.specification,
    }));
  }
  
  // ==================== 高级查询方法 ====================
  
  /**
   * 获取订单统计
   */
  @Method({ description: '获取订单统计', query: true })
  static async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
  }> {
    // 🎯 使用 ORM DSL 查询所有订单
    const result = await query(PurchaseOrderEntity).execute();
    const orders = result.data;
    
    const byStatus: Record<string, number> = {};
    let totalAmount = 0;
    
    for (const order of orders) {
      const status = order.status || 'UNKNOWN';
      byStatus[status] = (byStatus[status] || 0) + 1;
      totalAmount += order.totalAmount;
    }
    
    return {
      total: orders.length,
      byStatus,
      totalAmount,
    };
  }
  
  /**
   * 根据状态查询订单
   */
  @Method({ description: '根据状态查询订单', query: true })
  static async findByStatus(status: PurchaseOrderStatusType): Promise<PurchaseOrder[]> {
    // 🎯 使用 ORM DSL 查询
    const result = await query(PurchaseOrderEntity)
      .where({ status })
      .orderBy('createdAt', 'desc')
      .execute();
    
    return result.data as PurchaseOrder[];
  }
  
  /**
   * 根据供应商查询订单
   */
  @Method({ description: '根据供应商查询订单', query: true })
  static async findBySupplier(supplierCode: string): Promise<PurchaseOrder[]> {
    // 🎯 使用 whereNested 查询嵌套字段（类型安全）
    const result = await query(PurchaseOrderEntity)
    
    .whereNested('supplier.code', 'eq', supplierCode)
    .whereNested('items.materialCode', 'eq', "123")
      .orderBy('createdAt', 'desc')
      .execute();
    
    return result.data as PurchaseOrder[];
  }
  
  /**
   * 查询金额大于指定值的订单
   */
  @Method({ description: '查询大额订单', query: true })
  static async findLargeOrders(minAmount: number): Promise<PurchaseOrder[]> {
    // 🎯 使用 ORM DSL 比较操作符
    const result = await query(PurchaseOrderEntity)
      .where('totalAmount', 'gte', minAmount)
      .orderBy('totalAmount', 'desc')
      .execute();
    
    return result.data as PurchaseOrder[];
  }
  
  /**
   * 查询日期范围内的订单
   */
  @Method({ description: '查询日期范围内的订单', query: true })
  static async findByDateRange(startDate: Date, endDate: Date): Promise<PurchaseOrder[]> {
    // 🎯 使用 ORM DSL between 操作符
    const result = await query(PurchaseOrderEntity)
      .where('createdAt', 'between', [startDate, endDate])
      .orderBy('createdAt', 'desc')
      .execute();
    
    return result.data as PurchaseOrder[];
  }
  
  /**
   * 检查订单是否存在
   */
  @Method({ description: '检查订单是否存在', query: true })
  static async exists(id: string): Promise<boolean> {
    // 🎯 使用 ORM DSL exists 方法
    return query(PurchaseOrderEntity)
      .where({ id })
      .exists();
  }
  
  /**
   * 获取订单数量
   */
  @Method({ description: '获取订单数量', query: true })
  static async count(status?: PurchaseOrderStatusType): Promise<number> {
    // 🎯 使用 ORM DSL count 方法
    let queryBuilder = query(PurchaseOrderEntity);
    
    if (status) {
      queryBuilder = queryBuilder.where({ status });
    }
    
    return queryBuilder.count();
  }
  
  // ==================== 聚合保存方法 ====================
  
  /**
   * 保存订单聚合（DDD 聚合保存模式）
   * 
   * 🎯 保存整个聚合，包括：
   * - 订单本身
   * - 供应商信息（嵌入式值对象）
   * - 所有明细项（子实体集合）
   * 
   * @example
   * ```typescript
   * // 创建新订单聚合
   * const order = new PurchaseOrder();
   * order.title = '新订单';
   * order.supplier = { code: 'SUP001', name: '供应商A' };
   * order.items = [
   *   { materialCode: 'MAT001', quantity: 10, unitPrice: 100 },
   * ];
   * 
   * const savedOrder = await PurchaseOrderRepository.saveAggregate(order);
   * 
   * // 更新订单聚合
   * savedOrder.status = 'APPROVED';
   * savedOrder.items.push({ materialCode: 'MAT002', quantity: 5, unitPrice: 200 });
   * await PurchaseOrderRepository.saveAggregate(savedOrder);
   * ```
   */
  @Method({ description: '保存订单聚合', command: true })
  static async saveAggregate(order: PurchaseOrder): Promise<PurchaseOrder> {
    // 🎯 使用 ORM DSL 聚合保存
    // 自动处理：新建 vs 更新、子实体 ID 生成、时间戳
    return save(order).execute() as Promise<PurchaseOrder>;
  }
  
  /**
   * 根据 ID 加载订单聚合
   * 
   * @example
   * ```typescript
   * const order = await PurchaseOrderRepository.loadAggregate('order-123');
   * if (order) {
   *   order.status = 'APPROVED';
   *   await PurchaseOrderRepository.saveAggregate(order);
   * }
   * ```
   */
  @Method({ description: '加载订单聚合', query: true })
  static async loadAggregate(id: string): Promise<PurchaseOrder | null> {
    // 🎯 使用 ORM DSL 根据 ID 查找
    return findById(PurchaseOrderEntity, id) as Promise<PurchaseOrder | null>;
  }
}

// ==================== ORM DSL 使用说明 ====================

/**
 * 🎯 ORM DSL 语法参考
 * 
 * === 查询 ===
 * 
 * query(Entity).where({ field: value }).execute()
 * query(Entity).where('amount', 'gte', 1000).execute()
 * query(Entity).where({ id }).first()
 * query(Entity).where({ status }).count()
 * query(Entity).where({ orderNo }).exists()
 * 
 * === 创建 ===
 * 
 * create(Entity, { field: value }).execute()
 * 
 * === 更新 ===
 * 
 * update(Entity).where({ id }).set({ field: newValue }).execute()
 * 
 * === 删除 ===
 * 
 * remove(Entity).where({ id }).execute()
 * 
 * === 🆕 聚合保存（DDD 模式） ===
 * 
 * // 保存整个聚合（自动处理新建/更新、子实体、时间戳）
 * const order = new PurchaseOrder();
 * order.title = '新订单';
 * order.supplier = { code: 'SUP001', name: '供应商A' };
 * order.items = [
 *   { materialCode: 'MAT001', quantity: 10, unitPrice: 100 },
 *   { materialCode: 'MAT002', quantity: 5, unitPrice: 200 },
 * ];
 * 
 * const savedOrder = await save(order).execute();
 * 
 * // 更新聚合
 * savedOrder.status = 'APPROVED';
 * savedOrder.items.push({ materialCode: 'MAT003', quantity: 3, unitPrice: 300 });
 * await save(savedOrder).execute();
 * 
 * // 根据 ID 查找
 * const order = await findById(PurchaseOrder, 'order-123');
 * 
 * === 事务 ===
 * 
 * await transaction(async () => {
 *   await save(order).execute();
 *   await update(Inventory).where({...}).set({...}).execute();
 * });
 * 
 * === 切换适配器 ===
 * 
 * // 内存适配器（默认）
 * setORMAdapter(new InMemoryORMAdapter());
 * 
 * // SQLite 浏览器适配器（持久化到 IndexedDB）
 * const adapter = await createSQLiteBrowserAdapter({ persistKey: 'my-db' });
 * setORMAdapter(adapter);
 * 
 * // MikroORM 适配器（服务端）
 * const adapter = await initMikroORM({ type: 'postgresql', dbName: 'mydb' });
 * setORMAdapter(adapter);
 */
