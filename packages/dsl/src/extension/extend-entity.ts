/**
 * 实体扩展工具
 * 
 * 用于在不修改原始实体代码的情况下，向实体添加新字段
 * 
 * @example
 * ```typescript
 * // 扩展来自 NPM 包的实体
 * import { PurchaseOrder } from '@your-org/base-models';
 * import { extendEntity } from '@ai-builder/dsl/extension';
 * 
 * // 1. TypeScript 类型扩展
 * declare module '@your-org/base-models' {
 *   interface PurchaseOrder {
 *     customField: string;
 *   }
 * }
 * 
 * // 2. 运行时元数据注册
 * extendEntity(PurchaseOrder, {
 *   fields: {
 *     customField: {
 *       type: 'string',
 *       label: '自定义字段',
 *       dbField: { type: 'VARCHAR', length: 100 }
 *     }
 *   }
 * });
 * ```
 */

import { metadataStore } from '../utils/metadata';

/**
 * 字段扩展选项
 */
export interface ExtendFieldOptions {
  /** TypeScript 类型 */
  type: string;
  
  /** 字段标签 */
  label?: string;
  
  /** 是否可为空 */
  nullable?: boolean;
  
  /** 数据库字段配置 */
  dbField?: {
    /** 数据库类型 */
    type?: string;
    /** 字段长度 */
    length?: number;
    /** 精度（DECIMAL） */
    precision?: number;
    /** 小数位数（DECIMAL） */
    scale?: number;
    /** 默认值 */
    default?: any;
    /** 是否可为空 */
    nullable?: boolean;
    /** 是否唯一 */
    unique?: boolean;
    /** 是否索引 */
    index?: boolean;
    /** 注释 */
    comment?: string;
  };
  
  /** 校验规则 */
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string | RegExp;
    email?: boolean;
    url?: boolean;
  };
}

/**
 * 实体扩展选项
 */
export interface ExtendEntityOptions {
  /** 扩展字段 */
  fields?: Record<string, ExtendFieldOptions>;
  
  /** NPM 包名（用于追踪来源） */
  fromPackage?: string;
  
  // 未来可扩展：
  // relations?: Record<string, RelationOptions>;
  // methods?: Record<string, Function>;
  // hooks?: Record<string, Function>;
}

/**
 * 扩展实体
 * 
 * @param entityClass - 要扩展的实体类
 * @param options - 扩展选项
 * 
 * @example
 * ```typescript
 * extendEntity(PurchaseOrder, {
 *   fromPackage: '@your-org/base-models',
 *   fields: {
 *     customField: {
 *       type: 'string',
 *       label: '自定义字段',
 *       dbField: { type: 'VARCHAR', length: 100 }
 *     }
 *   }
 * });
 * ```
 */
export function extendEntity<T>(
  entityClass: new (...args: any[]) => T,
  options: ExtendEntityOptions
): void {
  const entityName = entityClass.name;
  
  console.log(`[extendEntity] 扩展实体: ${entityName}`);
  
  // 确保实体存在于 metadataStore 中
  if (!metadataStore.entities.has(entityName)) {
    console.warn(`  ⚠️  实体 ${entityName} 不在 metadataStore 中，创建占位符`);
    metadataStore.entities.set(entityName, {
      name: entityName,
      table: entityName.toLowerCase(),
      comment: '',
      fields: [],
      fromPackage: options.fromPackage,
    });
  }
  
  const entityMetadata = metadataStore.entities.get(entityName)!;
  
  // 记录扩展来源
  if (options.fromPackage) {
    entityMetadata.fromPackage = options.fromPackage;
  }
  
  // 合并字段定义
  if (options.fields) {
    for (const [fieldName, fieldOptions] of Object.entries(options.fields)) {
      // 检查字段是否已存在
      const existingFieldIndex = entityMetadata.fields.findIndex(f => f.name === fieldName);
      
      if (existingFieldIndex >= 0) {
        // 更新现有字段
        const existingField = entityMetadata.fields[existingFieldIndex];
        entityMetadata.fields[existingFieldIndex] = {
          ...existingField,
          ...fieldOptions,
          isExtension: true,  // 标记为扩展字段
        };
        console.log(`  ✅ 更新字段: ${entityName}.${fieldName}`);
      } else {
        // 添加新字段
        entityMetadata.fields.push({
          name: fieldName,
          type: fieldOptions.type,
          label: fieldOptions.label || fieldName,
          nullable: fieldOptions.nullable ?? fieldOptions.dbField?.nullable ?? true,
          dbField: fieldOptions.dbField,
          validation: fieldOptions.validation,
          isExtension: true,  // ⭐ 标记为扩展字段
        });
        console.log(`  ✅ 添加字段: ${entityName}.${fieldName}`);
      }
    }
  }
  
  console.log(`  📊 当前字段总数: ${entityMetadata.fields.length}`);
}

/**
 * 获取实体的扩展字段
 * 
 * @param entityClass - 实体类
 * @returns 扩展字段列表
 */
export function getExtensionFields<T>(
  entityClass: new (...args: any[]) => T
): Array<{ name: string; type: string; label?: string }> {
  const entityName = entityClass.name;
  const entityMetadata = metadataStore.entities.get(entityName);
  
  if (!entityMetadata) {
    return [];
  }
  
  return entityMetadata.fields.filter(f => f.isExtension === true);
}

/**
 * 检查实体是否有扩展字段
 * 
 * @param entityClass - 实体类
 * @returns 是否有扩展字段
 */
export function hasExtensions<T>(
  entityClass: new (...args: any[]) => T
): boolean {
  return getExtensionFields(entityClass).length > 0;
}

