# NPM 包扩展完整指南

## 📦 概述

本指南介绍如何在 AI Builder 项目中扩展来自 NPM 包的领域模型，支持在不修改原始代码的情况下添加新字段。

## 🎯 核心机制

### 为什么需要两步扩展？

由于 TypeScript 的 Module Augmentation 是**纯编译时特性**，运行时不存在扩展字段。因此需要：

1. **TypeScript 类型扩展**（编译时）→ 给编译器看，提供类型检查和智能提示
2. **运行时元数据注册**（Schema 生成时）→ 给 Schema 生成器看，生成正确的数据库 Schema

## 📝 使用步骤

### 步骤 1: 安装基础模型包

```bash
npm install @your-org/base-models
```

### 步骤 2: 创建扩展文件

在你的项目中创建 `src/domain/extensions/XXX.ext.ts`：

```typescript
// src/domain/extensions/PurchaseOrder.ext.ts

import { PurchaseOrder } from '@your-org/base-models';
import { extendEntity } from '@ai-builder/dsl';

// ========== 1. TypeScript 类型扩展（编译时） ==========
declare module '@your-org/base-models' {
  interface PurchaseOrder {
    // 新增字段
    internalApprovalStatus?: string;
    customRemark?: string;
  }
}

// ========== 2. 运行时元数据注册（Schema 生成时） ==========
extendEntity(PurchaseOrder, {
  fromPackage: '@your-org/base-models',
  fields: {
    internalApprovalStatus: {
      type: 'string',
      label: '内部审批状态',
      nullable: true,
      dbField: {
        type: 'VARCHAR',
        length: 50,
        comment: '审批状态',
      },
    },
    customRemark: {
      type: 'string',
      label: '自定义备注',
      nullable: true,
      dbField: {
        type: 'TEXT',
        comment: '备注',
      },
    },
  },
});
```

### 步骤 3: 生成 Schema

```bash
pnpm gen:kysely:model
```

生成器会自动：

1. 发现 `*.ext.ts` 扩展文件
2. 加载扩展定义（执行 `extendEntity`）
3. 生成扩展 Schema 文件：`src/domain/extensions/XXX.schema.ext.ts`
4. 更新 `database.schema.ts` 使用扩展后的类型

## 📁 生成的文件结构

```
your-project/
├── node_modules/
│   └── @your-org/base-models/     ← NPM 包（基础模型）
│       ├── PurchaseOrder.model.js
│       └── PurchaseOrder.schema.js
│
├── src/domain/
│   ├── extensions/
│   │   ├── PurchaseOrder.ext.ts           ← 手写：扩展定义
│   │   └── PurchaseOrder.schema.ext.ts    ← 🤖 生成：扩展 Schema
│   │
│   ├── CustomOrder.model.ts               ← 手写：新模型
│   └── CustomOrder.schema.ts              ← 🤖 生成：新模型 Schema
│
└── src/infrastructure/database/
    └── database.schema.ts                 ← 🤖 生成：统一 Schema
```

## 🔍 生成的扩展 Schema

`src/domain/extensions/PurchaseOrder.schema.ext.ts`：

```typescript
// ⚠️ AUTO-GENERATED

import type { PurchaseOrderTable as BasePurchaseOrderTable } from '@your-org/base-models';

/**
 * PurchaseOrder 扩展字段
 */
export interface PurchaseOrderExtensions {
  internal_approval_status: string | null;
  custom_remark: string | null;
}

/**
 * 扩展后的 PurchaseOrder Table Schema
 * 
 * 包含：
 * - 基础字段（来自 @your-org/base-models）
 * - 扩展字段（本项目新增）
 */
export interface PurchaseOrderTable extends BasePurchaseOrderTable, PurchaseOrderExtensions {}
```

## ✅ 使用扩展后的模型

### 在 Repository 中使用

```typescript
import { db } from '../database/kysely';

const order = await db
  .selectFrom('purchase_orders')
  .select([
    'id',
    'order_no',
    'total_amount',
    'internal_approval_status',  // ✅ 扩展字段，有类型提示
    'custom_remark',             // ✅ 扩展字段，有类型提示
  ])
  .where('id', '=', 1)
  .executeTakeFirst();

// TypeScript 类型检查通过 ✅
// order.internal_approval_status 有正确的类型
```

### 在业务代码中使用

```typescript
import { PurchaseOrder } from '@your-org/base-models';

function processOrder(order: PurchaseOrder) {
  // ✅ 可以访问扩展字段，有智能提示
  if (order.internalApprovalStatus === 'APPROVED') {
    console.log('订单已批准');
  }
  
  if (order.customRemark) {
    console.log('备注:', order.customRemark);
  }
}
```

## 🌟 多级扩展

支持级联扩展：标准产品 → 集团定制 → 分公司定制

```typescript
// L0: 标准产品 NPM 包
@Entity()
export class PurchaseOrder {
  id: number;
  orderNo: string;
}

// L1: 集团扩展 NPM 包
declare module '@std/models' {
  interface PurchaseOrder {
    regionCode: string;  // 集团字段
  }
}
extendEntity(PurchaseOrder, { fields: { regionCode: {...} } });

// L2: 分公司扩展（最终项目）
declare module '@group/models' {
  interface PurchaseOrder {
    localDiscount: number;  // 分公司字段
  }
}
extendEntity(PurchaseOrder, { fields: { localDiscount: {...} } });

// 最终结果
// PurchaseOrder 拥有：id, orderNo, regionCode, localDiscount
```

## 🛠️ 命令速查

```bash
# 生成 Schema（包括扩展）
pnpm gen:kysely:model

# 监听模式（自动生成）
pnpm watch:kysely

# 检查 Schema 同步状态
pnpm check:schema
```

## ⚠️ 注意事项

### 1. 字段名必须一致

TypeScript 声明和 `extendEntity` 中的字段名必须完全一致：

```typescript
// ✅ 正确
declare module '...' {
  interface PurchaseOrder {
    customField: string;  // ← 字段名
  }
}
extendEntity(PurchaseOrder, {
  fields: {
    customField: {...}      // ← 必须一致
  }
});

// ❌ 错误
declare module '...' {
  interface PurchaseOrder {
    customField: string;
  }
}
extendEntity(PurchaseOrder, {
  fields: {
    custom_field: {...}     // ❌ 不一致会导致类型不匹配
  }
});
```

### 2. fromPackage 必须正确

```typescript
extendEntity(PurchaseOrder, {
  fromPackage: '@your-org/base-models',  // ← 必须是正确的包名
  fields: {...}
});
```

这个包名会用于生成导入语句：

```typescript
import type { PurchaseOrderTable as BasePurchaseOrderTable } from '@your-org/base-models';
```

### 3. 扩展文件命名规范

- 文件名：`XXX.ext.ts`（XXX 为实体名）
- 位置：`src/domain/extensions/` 目录下
- 生成的 Schema：`XXX.schema.ext.ts`

## 🎉 优势

1. ✅ **TypeScript 类型安全**：扩展字段有完整的类型检查和智能提示
2. ✅ **Schema 自动生成**：无需手写数据库 Schema
3. ✅ **多级扩展支持**：支持 N 级级联扩展
4. ✅ **零侵入**：不修改原始 NPM 包代码
5. ✅ **版本独立**：NPM 包升级不影响扩展字段

## 📚 相关文档

- [TypeScript Module Augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [AI Builder 架构白皮书](../TS_Based_MDA_Architecture.md) - 第 4.4 节混合开发与扩展策略
- [Kysely 文档](https://kysely.dev/)

