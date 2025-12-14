# @ai-builder/orm-mikro 包规范

## 概述

`@ai-builder/orm-mikro` 是 AI Builder 的 MikroORM 适配器包，提供：

1. **MikroORM 适配器工厂** - 实现 `IRepositoryAdapterFactory` 接口
2. **Entity 转换器** - 将 DSL Entity 定义转换为 MikroORM Entity
3. **事务管理** - 提供声明式事务支持

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    DSL Layer (声明式)                        │
│  @Entity + @Repository 装饰器定义数据模型和访问意图            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               @qwe8652591/dsl-core                        │
│  Repository 适配器管理器 + 元数据存储                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               @ai-builder/orm-mikro                          │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ MikroORMAdapterFactory│  │ EntitySchemaGenerator│          │
│  └─────────────────────┘  └─────────────────────┘           │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   MikroORM                           │    │
│  │  EntityManager | QueryBuilder | Migrations           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 核心文件结构

```
packages/orm-mikro/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # 主入口
│   ├── adapter/
│   │   ├── mikro-orm-adapter.ts    # MikroORM Repository 适配器
│   │   └── adapter-factory.ts      # 适配器工厂
│   ├── schema/
│   │   ├── entity-generator.ts     # 从 DSL 生成 MikroORM Entity
│   │   └── migration-generator.ts  # 迁移生成器
│   ├── transaction/
│   │   └── transactional.ts        # 声明式事务装饰器
│   └── types.ts                    # 类型定义
└── tests/
    └── ...
```

## API 设计

### 1. 适配器配置

```typescript
import { configureRepositoryAdapter } from '@qwe8652591/dsl-core';
import { MikroORMAdapterFactory } from '@ai-builder/orm-mikro';

// 创建 MikroORM 适配器工厂
const mikroFactory = new MikroORMAdapterFactory();

// 初始化连接
await mikroFactory.initialize({
  type: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'secret',
    dbName: 'erp_db',
  },
  autoSync: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
});

// 注册到运行时
await configureRepositoryAdapter({
  type: 'custom',
  factory: mikroFactory,
});
```

### 2. MikroORM 适配器实现

```typescript
// src/adapter/mikro-orm-adapter.ts

import { EntityManager, EntityRepository, EntitySchema } from '@mikro-orm/core';
import type { 
  IRepositoryAdapter, 
  BaseEntity, 
  PageOptions, 
  PageResult,
  RepositoryMetadata 
} from '@qwe8652591/dsl-core';

export class MikroORMRepositoryAdapter<T extends BaseEntity> 
  implements IRepositoryAdapter<T> {
  
  readonly name = 'mikro-orm';
  private repo: EntityRepository<T>;
  
  constructor(
    private em: EntityManager,
    private entityClass: new (...args: unknown[]) => T,
    private metadata: RepositoryMetadata
  ) {
    this.repo = em.getRepository(entityClass);
  }
  
  async create(data: Partial<T>): Promise<T> {
    const entity = this.em.create(this.entityClass, data);
    await this.em.persistAndFlush(entity);
    return entity;
  }
  
  async findById(id: string | number): Promise<T | null> {
    return this.em.findOne(this.entityClass, { id } as any);
  }
  
  async findByIdOrThrow(id: string | number): Promise<T> {
    return this.em.findOneOrFail(this.entityClass, { id } as any);
  }
  
  async findOne(query: Partial<T>): Promise<T | null> {
    return this.em.findOne(this.entityClass, query as any);
  }
  
  async find(
    query: Partial<T>, 
    options?: { sort?: Record<string, 'asc' | 'desc'> }
  ): Promise<T[]> {
    return this.em.find(this.entityClass, query as any, {
      orderBy: options?.sort as any,
    });
  }
  
  async findPage(query: Partial<T>, options: PageOptions): Promise<PageResult<T>> {
    const offset = options.offset ?? ((options.pageNo || 1) - 1) * (options.pageSize || 20);
    const limit = options.limit ?? options.pageSize ?? 20;
    
    const [data, total] = await this.em.findAndCount(
      this.entityClass, 
      query as any,
      {
        offset,
        limit,
        orderBy: options.sort as any,
      }
    );
    
    const pageSize = options.pageSize || limit;
    const pageNo = options.pageNo || Math.floor(offset / pageSize) + 1;
    
    return {
      data,
      total,
      pageNo,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  
  async update(id: string | number, data: Partial<T>): Promise<T> {
    const entity = await this.findByIdOrThrow(id);
    this.em.assign(entity, data);
    await this.em.persistAndFlush(entity);
    return entity;
  }
  
  async save(entity: T): Promise<T> {
    await this.em.persistAndFlush(entity);
    return entity;
  }
  
  async saveAll(entities: T[]): Promise<T[]> {
    await this.em.persistAndFlush(entities);
    return entities;
  }
  
  async deleteById(id: string | number): Promise<boolean> {
    const entity = await this.findById(id);
    if (!entity) return false;
    await this.em.removeAndFlush(entity);
    return true;
  }
  
  async delete(entity: T): Promise<boolean> {
    await this.em.removeAndFlush(entity);
    return true;
  }
  
  async count(query?: Partial<T>): Promise<number> {
    return this.em.count(this.entityClass, query as any || {});
  }
  
  async nativeQuery<R = unknown>(sql: string, params?: unknown[]): Promise<R[]> {
    return this.em.execute(sql, params) as Promise<R[]>;
  }
}
```

### 3. Entity Schema 生成器

```typescript
// src/schema/entity-generator.ts

import { EntitySchema, Type } from '@mikro-orm/core';
import { getMetadataByType, FieldTypes } from '@qwe8652591/dsl-core';

/**
 * 从 DSL Entity 定义生成 MikroORM EntitySchema
 */
export function generateEntitySchema(entityName: string): EntitySchema {
  // 从 Metadata Store 获取 Entity 定义
  const entities = getMetadataByType('entity');
  const entityDef = entities.find(e => e.name === entityName);
  
  if (!entityDef) {
    throw new Error(`Entity definition not found: ${entityName}`);
  }
  
  // 转换字段类型
  const properties: Record<string, any> = {};
  
  for (const [fieldName, fieldDef] of Object.entries(entityDef.fields)) {
    properties[fieldName] = convertFieldToMikroORM(fieldName, fieldDef);
  }
  
  return new EntitySchema({
    name: entityDef.name,
    tableName: entityDef.table,
    properties,
  });
}

function convertFieldToMikroORM(name: string, fieldDef: any): any {
  const baseProps: any = {
    nullable: !fieldDef.required,
  };
  
  if (fieldDef.primaryKey) {
    baseProps.primary = true;
  }
  
  switch (fieldDef.type) {
    case FieldTypes.STRING:
      return { ...baseProps, type: 'string' };
    case FieldTypes.NUMBER:
      return { ...baseProps, type: 'number' };
    case FieldTypes.BOOLEAN:
      return { ...baseProps, type: 'boolean' };
    case FieldTypes.DATE:
    case FieldTypes.DATETIME:
      return { ...baseProps, type: 'Date' };
    case FieldTypes.COMPOSITION:
      // 嵌入式对象或关系
      if (fieldDef.embedded) {
        return { ...baseProps, type: 'json' };
      }
      return convertRelationToMikroORM(fieldDef);
    default:
      return { ...baseProps, type: 'string' };
  }
}

function convertRelationToMikroORM(fieldDef: any): any {
  switch (fieldDef.relation) {
    case 'oneToMany':
      return {
        kind: '1:m',
        entity: fieldDef.target?.name || fieldDef.targetEntity,
        mappedBy: fieldDef.mappedBy,
      };
    case 'manyToOne':
      return {
        kind: 'm:1',
        entity: fieldDef.target?.name || fieldDef.targetEntity,
      };
    case 'oneToOne':
      return {
        kind: '1:1',
        entity: fieldDef.target?.name || fieldDef.targetEntity,
        owner: true,
      };
    default:
      return { type: 'json' };
  }
}
```

### 4. 声明式事务

```typescript
// src/transaction/transactional.ts

import { MikroORMAdapterFactory } from '../adapter/adapter-factory';

/**
 * 声明式事务装饰器
 * 
 * @example
 * ```typescript
 * @AppService({ description: '订单服务' })
 * class OrderAppService {
 *   @Transactional()
 *   static async createOrderWithItems(data: CreateOrderDTO): Promise<Result<string>> {
 *     // 所有数据库操作在同一事务中执行
 *     const orderId = await OrderRepository.create(data.order);
 *     await OrderItemRepository.createMany(data.items);
 *     return success(orderId);
 *   }
 * }
 * ```
 */
export function Transactional(): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value as Function;
    
    descriptor.value = async function (...args: unknown[]) {
      const factory = MikroORMAdapterFactory.getInstance();
      
      if (!factory) {
        // 没有配置 MikroORM，直接执行原方法
        return originalMethod.apply(this, args);
      }
      
      // 在事务中执行
      return factory.transactional(async () => {
        return originalMethod.apply(this, args);
      });
    };
    
    return descriptor;
  };
}
```

## 使用流程

### 1. 安装依赖

```bash
pnpm add @ai-builder/orm-mikro @mikro-orm/core @mikro-orm/postgresql
```

### 2. 配置数据库连接

```typescript
// src/infrastructure/database.ts

import { configureRepositoryAdapter } from '@qwe8652591/dsl-core';
import { MikroORMAdapterFactory } from '@ai-builder/orm-mikro';

export async function initDatabase() {
  const factory = new MikroORMAdapterFactory();
  
  await factory.initialize({
    type: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      dbName: process.env.DB_NAME || 'erp',
    },
    autoSync: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development',
  });
  
  await configureRepositoryAdapter({
    type: 'custom',
    factory,
  });
  
  console.log('[Database] MikroORM initialized');
}
```

### 3. 定义 DSL Entity 和 Repository

```typescript
// src/domain/models/PurchaseOrder.model.ts

@Entity({ table: 'purchase_orders' })
class PurchaseOrder {
  @PrimaryKey()
  @Column({ type: FieldTypes.STRING, label: 'ID' })
  id!: string;
  
  @Column({ type: FieldTypes.STRING, label: '订单号', required: true })
  orderNo!: string;
  
  @OneToMany(() => PurchaseOrderItem, { cascade: [CascadeTypes.ALL] })
  items!: PurchaseOrderItem[];
}

// src/repositories/PurchaseOrder.repository.dsl.ts

@Repository({ entity: 'PurchaseOrder', table: 'purchase_orders' })
abstract class PurchaseOrderRepository {
  @Method({ description: '根据ID查询', query: true })
  static findById(id: string): Promise<PurchaseOrder | null>;
  
  @Method({ description: '创建订单', command: true })
  static create(data: CreateOrderDTO): Promise<string>;
}
```

### 4. 运行时自动绑定

```typescript
// src/main.ts

import { initDatabase } from './infrastructure/database';
import './dsl'; // 导入 DSL 定义，触发元数据注册

async function bootstrap() {
  // 1. 初始化数据库（自动绑定 Repository 实现）
  await initDatabase();
  
  // 2. 现在可以直接使用 Repository
  const order = await PurchaseOrderRepository.findById('123');
  console.log('Order:', order);
}

bootstrap();
```

## MikroORM 的 DDD 优势

### 1. Unit of Work 模式

```typescript
// 自动追踪实体变更，批量提交
const order = await em.findOne(PurchaseOrder, { id });
order.status = 'APPROVED';
order.items.push(newItem);
// 所有变更在 flush 时一次性提交
await em.flush();
```

### 2. Identity Map

```typescript
// 同一 EntityManager 内，相同 ID 的实体只有一个实例
const order1 = await em.findOne(PurchaseOrder, { id: '123' });
const order2 = await em.findOne(PurchaseOrder, { id: '123' });
console.log(order1 === order2); // true
```

### 3. Embeddables（嵌入式值对象）

```typescript
// DSL 定义
@ValueObject({ comment: '供应商信息' })
class SupplierInfo {
  @Column({ type: FieldTypes.STRING, label: '编码' })
  code!: string;
  
  @Column({ type: FieldTypes.STRING, label: '名称' })
  name!: string;
}

// 自动转换为 MikroORM Embeddable
@Embeddable()
class SupplierInfoEmbeddable {
  @Property()
  code!: string;
  
  @Property()
  name!: string;
}
```

### 4. 延迟加载 & 预加载

```typescript
// 预加载关联
const order = await em.findOne(PurchaseOrder, { id }, {
  populate: ['items', 'supplier'],
});

// 延迟加载
const order = await em.findOne(PurchaseOrder, { id });
await order.items.loadItems(); // 需要时才加载
```

## 迁移策略

从当前的内存 Repository 迁移到 MikroORM：

1. **保持 DSL 定义不变** - Entity 和 Repository 装饰器定义保持原样
2. **安装 MikroORM 包** - `@ai-builder/orm-mikro`
3. **配置数据库连接** - 在应用启动时初始化
4. **自动 Schema 同步** - 开发环境自动创建表结构
5. **逐步迁移** - 可以混合使用内存和 MikroORM 适配器

## 总结

这个设计实现了：

✅ **DSL 层保持声明式** - 只定义意图，不写实现  
✅ **运行时自动绑定** - 根据配置选择 ORM 实现  
✅ **DDD 最佳实践** - 支持聚合、值对象、事务  
✅ **渐进式迁移** - 可从内存平滑迁移到数据库  
✅ **可扩展** - 支持自定义适配器  

