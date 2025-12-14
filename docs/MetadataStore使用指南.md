# MetadataStore 使用指南

`metadataStore` 是一个全局单例，用于收集和管理所有实体和字段的元数据信息。

## 📦 导入

```typescript
import { metadataStore } from '@ai-builder/dsl/utils/metadata';
```

## 🔍 可用方法

### 1. 获取所有实体名称

```typescript
const entityNames = metadataStore.getAllEntityNames();
// 返回: ['PurchaseOrder', 'Product', 'PurchaseOrderItem', ...]
```

### 2. 获取所有实体完整信息

```typescript
const allEntities = metadataStore.getAllEntities();
// 返回: EntityMetadata[]

allEntities.forEach(entity => {
  console.log(`实体: ${entity.name}`);
  console.log(`表名: ${entity.table}`);
  console.log(`注释: ${entity.comment}`);
  console.log(`来源包: ${entity.fromPackage || '本地'}`);
  console.log(`字段数: ${entity.fields.length}`);
});
```

### 3. 获取特定实体信息

```typescript
const poEntity = metadataStore.getEntity('PurchaseOrder');

if (poEntity) {
  console.log(`实体名: ${poEntity.name}`);
  console.log(`表名: ${poEntity.table}`);
  console.log(`总字段数: ${poEntity.fields.length}`);
  
  // 筛选字段类型
  const extensionFields = poEntity.fields.filter(f => f.isExtension);
  const relationFields = poEntity.fields.filter((f: any) => f.isRelation);
  const normalFields = poEntity.fields.filter((f: any) => !f.isExtension && !f.isRelation);
}
```

### 4. 获取实体的所有字段

```typescript
const fields = metadataStore.getEntityFields('PurchaseOrder');

fields.forEach(field => {
  console.log(`字段: ${field.name}`);
  console.log(`类型: ${field.type}`);
  console.log(`标签: ${field.label}`);
  console.log(`可空: ${field.nullable}`);
  console.log(`是否扩展: ${field.isExtension}`);
});
```

### 5. 调试打印完整元数据

```typescript
metadataStore.debug();
// 打印所有实体和字段的详细信息
```

### 6. 清空元数据（测试用）

```typescript
metadataStore.clear();
// 清空所有收集的元数据
```

## 📊 数据结构

### EntityMetadata

```typescript
interface EntityMetadata {
  name: string;          // 实体名称
  table?: string;        // 表名
  comment?: string;      // 注释
  fields: FieldMetadata[]; // 字段列表
  fromPackage?: string;  // 来源 NPM 包名（如果是扩展）
}
```

### FieldMetadata

```typescript
interface FieldMetadata {
  name: string;          // 字段名
  type: string;          // 字段类型
  label?: string;        // 字段标签
  nullable?: boolean;    // 是否可空
  isExtension?: boolean; // 是否为扩展字段
  dbField?: {            // 数据库字段配置
    type?: string;
    length?: number;
    nullable?: boolean;
    // ...
  };
  // ... 其他属性
}
```

## 💡 使用场景

### 场景1：在 Schema 生成器中使用

```typescript
// generate-kysely-schemas-by-model.ts

import { metadataStore } from '@ai-builder/dsl/utils/metadata';

// 1. 加载所有模型后
const allEntities = metadataStore.getAllEntities();

// 2. 遍历生成 Schema
allEntities.forEach(entity => {
  const schemaContent = generateSchemaForEntity(entity);
  fs.writeFileSync(`${entity.name}.schema.ts`, schemaContent);
});
```

### 场景2：筛选特定类型的实体

```typescript
// 筛选包含扩展字段的实体
const entitiesWithExtensions = metadataStore
  .getAllEntities()
  .filter(entity => entity.fields.some(f => f.isExtension));

// 筛选来自 NPM 包的实体
const npmEntities = metadataStore
  .getAllEntities()
  .filter(entity => entity.fromPackage);
```

### 场景3：统计分析

```typescript
// 统计所有字段总数
const totalFields = metadataStore
  .getAllEntities()
  .reduce((sum, entity) => sum + entity.fields.length, 0);

// 统计扩展字段数量
const extensionFieldCount = metadataStore
  .getAllEntities()
  .flatMap(entity => entity.fields)
  .filter(field => field.isExtension)
  .length;
```

### 场景4：生成文档

```typescript
// 自动生成实体文档
const entities = metadataStore.getAllEntities();

const markdown = entities.map(entity => `
## ${entity.name}

**表名**: \`${entity.table}\`
**描述**: ${entity.comment || 'N/A'}

### 字段列表

| 字段名 | 类型 | 说明 | 可空 |
|--------|------|------|------|
${entity.fields.map(f => 
  `| ${f.name} | ${f.type} | ${f.label || ''} | ${f.nullable ? '是' : '否'} |`
).join('\n')}
`).join('\n\n');

fs.writeFileSync('实体文档.md', markdown);
```

## ⚠️ 注意事项

### 1. 元数据收集时机

`metadataStore` 只有在以下情况后才会有数据：

1. **扩展文件已加载**（`extendEntity` 被调用）
2. **领域模型已导入**（装饰器被执行）
3. **类已实例化**（`addInitializer` 回调被触发）

示例：

```typescript
// ❌ 错误：此时 metadataStore 为空
console.log(metadataStore.getAllEntities()); // []

// ✅ 正确：先加载模型
import './domain/PurchaseOrder.model';
new PurchaseOrder(); // 触发装饰器

// 现在可以获取数据了
console.log(metadataStore.getAllEntities()); // [...]
```

### 2. 扩展字段需要先加载

```typescript
// 1. 先加载扩展定义
require('./domain/extensions/PurchaseOrder.ext'); // extendEntity() 会注册扩展字段

// 2. 再加载领域模型
require('./domain/PurchaseOrder.model');

// 3. 实例化类
new PurchaseOrder();

// 现在 metadataStore 包含完整信息（包括扩展字段）
const entity = metadataStore.getEntity('PurchaseOrder');
console.log(entity.fields.filter(f => f.isExtension)); // 扩展字段
```

### 3. 类型安全

`metadataStore` 返回的数据结构是松散类型的（使用了 `any`），在使用时建议：

```typescript
const entity = metadataStore.getEntity('PurchaseOrder');

// ✅ 类型守卫
if (entity && entity.fields) {
  entity.fields.forEach(field => {
    // 安全访问
  });
}

// ✅ 类型断言（如果确定）
const poEntity = metadataStore.getEntity('PurchaseOrder') as EntityMetadata;
```

## 🚀 实际示例

参考 `examples/purchase-order-demo/scripts/generate-kysely-schemas-by-model.ts` 查看完整使用示例。

关键代码片段：

```typescript
// 1. 加载扩展和模型
discoverExtensionFiles();
discoverModelFiles();

// 2. 获取所有实体
const allEntities = metadataStore.getAllEntities();

// 3. 生成 Schema
allEntities.forEach(entity => {
  const fields = entity.fields;
  // 根据字段生成 Kysely Schema...
});
```

