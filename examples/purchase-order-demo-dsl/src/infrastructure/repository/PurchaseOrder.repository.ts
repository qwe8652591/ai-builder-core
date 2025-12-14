/**
 * 采购订单仓储层
 * 
 * 使用 MetadataBaseRepository 实现完全自动化的映射
 * 基于 @Entity 和 @Field 装饰器的元数据自动完成所有映射
 */

import { Repository, Decimal } from '@ai-builder/dsl';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  SupplierInfo,
  type PurchaseOrderStatus 
} from '../../domain/PurchaseOrder.model';
import { MetadataBaseRepository } from './MetadataBaseRepository';

/**
 * 采购订单列表 DTO
 * 用于列表查询，不包含明细和审批信息
 */
export interface PurchaseOrderListDTO {
  id: string;
  orderNo: string;
  title: string;
  supplierName: string;
  totalAmount: Decimal;
  status: PurchaseOrderStatus;
  createdAt: Date;
  itemCount: number;
}

@Repository()
export class PurchaseOrderRepository extends MetadataBaseRepository<PurchaseOrder> {
  constructor() {
    super({
      entityName: 'PurchaseOrder',
      entityConstructor: PurchaseOrder,
    });
  }

  /**
   * 根据 ID 查询订单（包含明细）
   * 
   * 重写父类方法以加载关联的订单明细
   */
  override async findById(id: string): Promise<PurchaseOrder | null> {
    await this.initialize();

    // 查询订单主表
    const orderRow = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!orderRow) {
      return null;
    }

    // 查询订单明细
    const itemRows = await this.db
      .selectFrom('purchase_order_items')
      .selectAll()
      .where('purchase_order_id', '=', id)
      .execute();

    // 🔑 自动映射主实体
    const order = await this.mapToDomainModel(orderRow);

    // 手动处理关联的明细（因为这是复杂的一对多关系）
    order.items = await this.mapOrderItems(itemRows);

    return order;
  }

  /**
   * 根据订单号查询
   */
  async findByOrderNo(orderNo: string): Promise<PurchaseOrder | null> {
    await this.initialize();

    const orderRow = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('order_no', '=', orderNo)
      .executeTakeFirst();

    if (!orderRow) {
      return null;
    }

    // 查询订单明细
    const itemRows = await this.db
      .selectFrom('purchase_order_items')
      .selectAll()
      .where('purchase_order_id', '=', orderRow.id)
      .execute();

    // 自动映射
    const order = await this.mapToDomainModel(orderRow);
    order.items = await this.mapOrderItems(itemRows);

    return order;
  }

  /**
   * 查询订单列表（分页）
   * 
   * 演示：
   * 1. 复杂查询（JOIN + 聚合）
   * 2. 类型安全的别名
   * 3. 分页
   */
  async findList(options: {
    status?: PurchaseOrderStatus;
    supplierCode?: string;
    orderNo?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ data: PurchaseOrderListDTO[]; total: number }> {
    await this.initialize();

    // 构建查询
    let query = this.db
      .selectFrom('purchase_orders as po')
      .leftJoin('purchase_order_items as poi', 'po.id', 'poi.purchase_order_id')
      .select([
        'po.id',
        'po.order_no',
        'po.title',
        'po.supplier_name',
        'po.total_amount',
        'po.status',
        'po.created_at',
        (eb) => eb.fn.count('poi.id').as('item_count'),
      ])
      .groupBy(['po.id', 'po.order_no', 'po.title', 'po.supplier_name', 'po.total_amount', 'po.status', 'po.created_at']);

    // 条件查询
    if (options.status) {
      query = query.where('po.status', '=', options.status);
    }

    if (options.supplierCode) {
      query = query.where('po.supplier_code', '=', options.supplierCode);
    }

    if (options.orderNo) {
      query = query.where('po.order_no', 'like', `%${options.orderNo}%`);
    }

    // 查询总数
    const countQuery = this.db
      .selectFrom('purchase_orders as po');
    
    let countQueryWithFilters = countQuery;
    if (options.status) {
      countQueryWithFilters = countQueryWithFilters.where('po.status', '=', options.status);
    }
    if (options.supplierCode) {
      countQueryWithFilters = countQueryWithFilters.where('po.supplier_code', '=', options.supplierCode);
    }
    if (options.orderNo) {
      countQueryWithFilters = countQueryWithFilters.where('po.order_no', 'like', `%${options.orderNo}%`);
    }
    
    const countResult = await countQueryWithFilters
      .select((eb) => eb.fn.count('po.id').as('total'))
      .executeTakeFirst();
    const total = Number(countResult?.total || 0);

    // 查询数据（分页）
    const data = await query
      .orderBy('po.created_at', 'desc')
      .limit(options.limit || 10)
      .offset(options.offset || 0)
      .execute();

    return {
      data: data.map(row => ({
        id: row.id,
        orderNo: row.order_no,
        title: row.title,
        supplierName: row.supplier_name,
        totalAmount: new Decimal(row.total_amount),
        status: row.status,
        createdAt: row.created_at,
        itemCount: Number(row.item_count),
      })),
      total,
    };
  }

  /**
   * 创建订单（含明细）
   * 
   * 演示：事务操作
   */
  async createOrder(order: {
    orderNo: string;
    title: string;
    supplier: SupplierInfo;
    items: PurchaseOrderItem[];
    totalAmount: Decimal;
    status: PurchaseOrderStatus;
    remark?: string;
    createdBy: string;
  }): Promise<string> {
    await this.initialize();

    return await this.transaction(async (trx) => {
      // 插入订单主表
      const orderResult = await trx
        .insertInto('purchase_orders')
        .values({
          order_no: order.orderNo,
          title: order.title,
          supplier_code: order.supplier.code,
          supplier_name: order.supplier.name,
          supplier_contact_person: order.supplier.contactPerson || null,
          supplier_contact_phone: order.supplier.contactPhone || null,
          supplier_address: order.supplier.address || null,
          total_amount: order.totalAmount.toString(),
          status: order.status,
          remark: order.remark || null,
          created_by: order.createdBy,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      // 插入订单明细
      if (order.items.length > 0) {
        await trx
          .insertInto('purchase_order_items')
          .values(
            order.items.map(item => ({
              purchase_order_id: orderResult.id,
              material_code: item.materialCode,
              material_name: item.materialName,
              specification: item.specification || null,
              quantity: item.quantity.toString(),
              unit: item.unit,
              unit_price: item.unitPrice.toString(),
              required_date: item.requiredDate,
              remark: item.remark || null,
            }))
          )
          .execute();
      }

      return orderResult.id;
    });
  }

  /**
   * 更新订单状态
   */
  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<void> {
    await this.initialize();

    await this.db
      .updateTable(this.tableName)
      .set({ status })
      .where('id', '=', id)
      .execute();
  }

  /**
   * 删除订单（含明细）
   * 
   * 演示：事务中的删除操作
   */
  override async delete(id: string): Promise<boolean> {
    await this.initialize();

    await this.transaction(async (trx) => {
      // 先删除明细
      await trx
        .deleteFrom('purchase_order_items')
        .where('purchase_order_id', '=', id)
        .execute();

      // 再删除主表
      await trx
        .deleteFrom(this.tableName)
        .where('id', '=', id)
        .execute();
    });

    return true;
  }

  /**
   * 统计各状态订单数量
   */
  async getStatistics(): Promise<Array<{ status: PurchaseOrderStatus; count: number; total_amount: number }>> {
    await this.initialize();

    const result = await this.db
      .selectFrom(this.tableName)
      .select([
        'status',
        (eb) => eb.fn.count('id').as('count'),
        (eb) => eb.fn.sum('total_amount').as('total_amount'),
      ])
      .groupBy('status')
      .execute();

    return result.map(row => ({
      status: row.status,
      count: Number(row.count),
      total_amount: Number(row.total_amount),
    }));
  }

  /**
   * 复杂查询示例：查询金额超过平均值的订单
   */
  async findOrdersAboveAverage(): Promise<PurchaseOrderListDTO[]> {
    await this.initialize();

    // 先计算平均金额
    const avgResult = await this.db
      .selectFrom(this.tableName)
      .select((eb) => eb.fn.avg('total_amount').as('avg'))
      .executeTakeFirst();
    
    const avgAmount = Number(avgResult?.avg || 0);

    // 主查询
    const orders = await this.db
      .selectFrom('purchase_orders as po')
      .leftJoin('purchase_order_items as poi', 'po.id', 'poi.purchase_order_id')
      .select([
        'po.id',
        'po.order_no',
        'po.title',
        'po.supplier_name',
        'po.total_amount',
        'po.status',
        'po.created_at',
        (eb) => eb.fn.count('poi.id').as('item_count'),
      ])
      .where('po.total_amount', '>', avgAmount)
      .groupBy(['po.id', 'po.order_no', 'po.title', 'po.supplier_name', 'po.total_amount', 'po.status', 'po.created_at'])
      .orderBy('po.total_amount', 'desc')
      .execute();

    return orders.map(row => ({
      id: row.id,
      orderNo: row.order_no,
      title: row.title,
      supplierName: row.supplier_name,
      totalAmount: new Decimal(row.total_amount),
      status: row.status,
      createdAt: row.created_at,
      itemCount: Number(row.item_count),
    }));
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 映射订单明细列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async mapOrderItems(rows: any[]): Promise<PurchaseOrderItem[]> {
    return rows.map(row => {
      const item = new PurchaseOrderItem();
      item.id = row.id;
      item.materialCode = row.material_code;
      item.materialName = row.material_name;
      item.specification = row.specification || undefined;
      item.quantity = new Decimal(row.quantity);
      item.unit = row.unit;
      item.unitPrice = new Decimal(row.unit_price);
      item.requiredDate = row.required_date;
      item.remark = row.remark || undefined;
      return item;
    });
  }
}

/**
 * 🎯 使用 MetadataBaseRepository 的优势：
 * 
 * 1. ✅ 主实体自动映射
 *    - PurchaseOrder 的所有基础字段（id, orderNo, title, totalAmount 等）自动映射
 *    - 供应商信息（SupplierInfo）自动从扁平化字段映射
 *    - Decimal、Date 类型自动转换
 * 
 * 2. ✅ 减少 80% 的映射代码
 *    - 不需要手动写 mapToDomainModel
 *    - 不需要手动处理 snake_case ↔ camelCase 转换
 *    - 不需要手动处理类型转换
 * 
 * 3. ✅ 维护成本低
 *    - 在 model 中添加/修改字段，Repository 自动更新
 *    - 映射逻辑集中在 MetadataBaseRepository 中
 * 
 * 4. ✅ 只需处理特殊情况
 *    - 一对多关系（items）需要手动处理
 *    - 复杂查询需要手动实现
 *    - 其他标准操作都是自动的
 */
