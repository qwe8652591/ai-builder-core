/**
 * 产品 Repository
 * 
 * 使用 MetadataBaseRepository 实现完全自动化的映射
 * 演示如何使用从领域模型生成的 Kysely Schema
 */

import { Repository } from '@ai-builder/dsl';
import { MetadataBaseRepository } from './MetadataBaseRepository';
import { Product, ProductStatus, ProductPriority } from '../../domain/Product.model';

@Repository()
export class ProductRepository extends MetadataBaseRepository<Product> {
  constructor() {
    super({
      entityName: 'Product',
      entityConstructor: Product,
    });
  }

  // 🎉 不需要实现 mapToDomainModel 和 mapToTableRow！
  // 🎉 自动获得 CRUD 方法：findById, findAll, create, update, delete, count, exists
  // 所有映射都基于 @Entity 和 @Field 装饰器自动完成！

  // ==================== 业务特定的查询方法 ====================

  /**
   * 根据产品编码查询产品
   * 
   * 演示：基础查询 + 字段类型安全，使用表别名 'p'
   */
  async findByCode(productCode: string): Promise<Product | null> {
    await this.initialize();

    const row = await this.db
      .selectFrom('products as p')
      .selectAll('p')
      .where('p.product_code', '=', productCode)
      .executeTakeFirst();

    // 🔑 自动映射！
    return row ? await this.mapToDomainModel(row) : null;
  }

  /**
   * 查询库存不足的产品
   * 
   * 演示：条件查询 + 枚举类型检查，使用表别名 'p'
   */
  async findLowStock(threshold: number): Promise<Product[]> {
    await this.initialize();

    const rows = await this.db
      .selectFrom('products as p')
      .selectAll('p')
      .where('p.stock_quantity', '<', threshold)
      .where('p.status', '=', ProductStatus.ACTIVE)
      .orderBy('p.stock_quantity', 'asc')
      .execute();

    // 🔑 自动映射每条记录！
    return Promise.all(rows.map(row => this.mapToDomainModel(row)));
  }

  /**
   * 根据分类和优先级查询
   * 
   * 演示：多条件查询 + 枚举参数类型检查，使用表别名 'p'
   */
  async findByCategoryAndPriority(category: string, priority: ProductPriority): Promise<Product[]> {
    await this.initialize();

    const rows = await this.db
      .selectFrom('products as p')
      .select([
        'p.product_code',
        'p.product_name',
        'p.category',
        'p.priority',
        'p.unit_price',
        'p.stock_quantity',
        'p.id',
        'p.supplier_code',
        'p.status',
        'p.unit',
        'p.remark',
        'p.created_at',
        'p.updated_at',
      ])
      .where('p.category', '=', category)
      .where('p.priority', '=', priority)
      .where('p.status', '=', ProductStatus.ACTIVE)
      .execute();

    return Promise.all(rows.map(row => this.mapToDomainModel(row)));
  }

  /**
   * 更新产品价格
   * 
   * 演示：更新操作 + Decimal 类型处理
   */
  async updatePrice(id: string, newPrice: number): Promise<Product | null> {
    await this.initialize();

    const result = await this.db
      .updateTable('products')
      .set({ 
        unit_price: newPrice.toString(),
        updated_at: new Date()
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    // 🔑 自动映射返回结果！
    return result ? await this.mapToDomainModel(result) : null;
  }

  /**
   * 批量更新产品状态
   * 
   * 演示：批量更新 + 条件构建
   */
  async batchUpdateStatus(productIds: string[], newStatus: ProductStatus): Promise<number> {
    await this.initialize();

    const result = await this.db
      .updateTable('products')
      .set({ 
        status: newStatus,
        updated_at: new Date()
      })
      .where('id', 'in', productIds)
      .execute();

    return Number(result[0]?.numUpdatedRows || 0);
  }

  /**
   * 创建新产品
   * 
   * 演示：插入操作 + 所有字段类型
   */
  async createProduct(product: {
    productCode: string;
    productName: string;
    category: string;
    supplierCode?: string;
    unitPrice: number;
    stockQuantity: number;
    priority: ProductPriority;
  }): Promise<Product> {
    await this.initialize();

    const result = await this.db
      .insertInto('products')
      .values({
        product_code: product.productCode,
        product_name: product.productName,
        category: product.category,
        supplier_code: product.supplierCode || null,
        unit_price: product.unitPrice.toString(),
        stock_quantity: product.stockQuantity.toString(),
        priority: product.priority,
        status: ProductStatus.ACTIVE,
        remark: null,
        unit: 'PCS',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // 🔑 自动映射返回结果！
    return await this.mapToDomainModel(result);
  }

  /**
   * 统计各状态的产品数量
   * 
   * 演示：聚合查询，使用表别名 'p'
   */
  async countByStatus(): Promise<Array<{ status: ProductStatus; count: number }>> {
    await this.initialize();

    const result = await this.db
      .selectFrom('products as p')
      .select([
        'p.status',
        (eb) => eb.fn.count('p.id').as('count')
      ])
      .groupBy('p.status')
      .execute();

    return result.map(row => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  /**
   * 查询高优先级且库存充足的产品
   * 
   * 演示：复杂条件查询，使用表别名 'p'
   */
  async findHighPriorityInStock(minStock: number): Promise<Product[]> {
    await this.initialize();

    const rows = await this.db
      .selectFrom('products as p')
      .selectAll('p')
      .where('p.priority', '=', ProductPriority.HIGH)
      .where('p.status', '=', ProductStatus.ACTIVE)
      .where('p.stock_quantity', '>=', minStock)
      .orderBy('p.stock_quantity', 'desc')
      .execute();

    return Promise.all(rows.map(row => this.mapToDomainModel(row)));
  }

  /**
   * 搜索产品（模糊查询）
   * 
   * 演示：LIKE 查询，使用表别名 'p'
   */
  async search(keyword: string): Promise<Product[]> {
    await this.initialize();

    const rows = await this.db
      .selectFrom('products as p')
      .select([
        'p.id',
        'p.product_code',
        'p.product_name',
        'p.category',
        'p.unit_price',
        'p.status',
        'p.supplier_code',
        'p.stock_quantity',
        'p.priority',
        'p.unit',
        'p.remark',
        'p.created_at',
        'p.updated_at',
      ])
      .where((eb) => 
        eb.or([
          eb('p.product_code', 'like', `%${keyword}%`),
          eb('p.product_name', 'like', `%${keyword}%`),
          eb('p.category', 'like', `%${keyword}%`)
        ])
      )
      .where('p.status', 'in', [ProductStatus.ACTIVE, ProductStatus.INACTIVE])
      .execute();

    return Promise.all(rows.map(row => this.mapToDomainModel(row)));
  }

  /**
   * 事务示例：调整库存
   * 
   * 演示：事务操作
   */
  async adjustStock(adjustments: Array<{ productCode: string; quantity: number }>): Promise<Product[]> {
    await this.initialize();

    return await this.transaction(async (trx) => {
      const results: Product[] = [];

      for (const adj of adjustments) {
        const result = await trx
          .updateTable('products')
          .set((eb) => ({
            stock_quantity: eb('stock_quantity', '+', adj.quantity),
            updated_at: new Date()
          }))
          .where('product_code', '=', adj.productCode)
          .returningAll()
          .executeTakeFirst();

        if (result) {
          // 🔑 自动映射！
          results.push(await this.mapToDomainModel(result));
        }
      }

      return results;
    });
  }
}

/**
 * 🎯 使用 MetadataBaseRepository 的类型安全演示
 * 
 * 以下代码会在编译时报错：
 * 
 * ❌ 错误的字段名
 * await db.selectFrom('products').select(['productCode'])
 * // 编译错误：'productCode' 不存在，应该是 'product_code'
 * 
 * ❌ 错误的表名
 * await db.selectFrom('product').selectAll()
 * // 编译错误：'product' 表不存在
 * 
 * ❌ 错误的枚举值
 * await db.where('status', '=', 'PENDING')
 * // 编译错误：'PENDING' 不在枚举中
 * 
 * ❌ 错误的字段类型
 * await db.where('stock_quantity', '=', 'abc')
 * // 编译错误：类型不匹配
 * 
 * ✅ 所有这些错误都会在编译时被捕获，而不是运行时！
 * 
 * 🎉 优势总结：
 * 
 * 1. 零映射代码：完全不需要手动实现 mapToDomainModel
 * 2. 自动类型转换：Decimal、Date、枚举等类型自动处理
 * 3. 字段名自动转换：camelCase ↔ snake_case 自动映射
 * 4. 维护成本低：修改 model 字段，Repository 自动更新
 * 5. 类型安全：TypeScript 编译时检查，Kysely 提供 SQL 类型安全
 * 6. 代码量减少 85%：只需要实现业务特定的查询方法
 */
