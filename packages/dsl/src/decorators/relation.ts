import { metadataStore } from '../utils/metadata';

/**
 * 关系类型枚举
 */
export enum RelationType {
  OneToOne = 'OneToOne',
  OneToMany = 'OneToMany',
  ManyToOne = 'ManyToOne',
  ManyToMany = 'ManyToMany'
}

/**
 * 级联操作类型枚举
 */
export enum CascadeType {
  Insert = 'insert',
  Update = 'update',
  Remove = 'remove'
}

/**
 * 组合关系装饰器选项 (1:1, 1:N)
 * 组合关系表示强依赖，生命周期绑定
 */
export interface CompositionOptions {
  /** 关联类型 */
  type: RelationType.OneToOne | RelationType.OneToMany;
  /** 是否嵌入（仅OneToOne）：true=扁平化到主表（值对象），false=独立表 */
  embedded?: boolean;
  /** 外键列名（非嵌入式关系时使用） */
  joinColumn?: string;
  /** 是否级联操作（删除、更新等） */
  cascade?: boolean | CascadeType[];
}

/**
 * 关联关系装饰器选项 (N:1, M:N)
 * 关联关系表示弱依赖，引用关系
 */
export interface AssociationOptions {
  /** 关联类型 */
  type: RelationType.ManyToOne | RelationType.ManyToMany;
  /** 外键列名（ManyToOne 专用） */
  joinColumn?: string;
  /** 连接表名（ManyToMany 专用） */
  joinTable?: string;
  /** 是否级联操作 */
  cascade?: boolean | CascadeType[];
}

/**
 * 类型推断辅助函数
 * 从字段名推断可能的类型名
 */
function inferTypeNameFromField(fieldName: string, relationType: RelationType): string[] {
  const candidates: string[] = [];
  
  if (relationType === RelationType.OneToMany) {
    // OneToMany: items -> Item, PurchaseOrderItem, Items
    // 去掉 's'
    const singular = fieldName.endsWith('s') ? fieldName.slice(0, -1) : fieldName;
    // 首字母大写
    const capitalized = singular.charAt(0).toUpperCase() + singular.slice(1);
    candidates.push(capitalized);
    
    // 尝试添加常见后缀
    candidates.push(`${capitalized}Item`);
    candidates.push(fieldName.charAt(0).toUpperCase() + fieldName.slice(1)); // 原始复数形式大写
  } else {
    // OneToOne: supplier -> Supplier, SupplierInfo
    const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    candidates.push(capitalized);
    candidates.push(`${capitalized}Info`);
    candidates.push(`${capitalized}Detail`);
  }
  
  return candidates;
}

/**
 * 组合关系装饰器
 * 用于定义强依赖的组合关系（OneToOne, OneToMany）
 * 
 * @example
 * ```typescript
 * // OneToOne - 嵌入式值对象
 * @Composition({
 *   type: RelationType.OneToOne,
 *   embedded: true
 * })
 * supplier!: SupplierInfo;
 * 
 * // OneToMany - 聚合根与子实体
 * @Composition({
 *   type: RelationType.OneToMany,
 *   cascade: true
 * })
 * items!: PurchaseOrderItem[];
 * ```
 */
export function Composition(options: Omit<CompositionOptions, 'target'>) {
  return function (target: any, propertyKeyOrContext: string | ClassFieldDecoratorContext) {
    let fieldName: string;

    if (typeof propertyKeyOrContext === 'string') {
      fieldName = propertyKeyOrContext;
    } else {
      fieldName = propertyKeyOrContext.name as string;
    }

    const registerMetadata = () => {
      // 旧版装饰器中 target 是原型对象
      const entityName = typeof target === 'function' ? target.name : target.constructor.name;
      const existingMetadata = metadataStore.getEntity(entityName) || { fields: [] };
      const fields = (existingMetadata as any).fields || [];

      // 🔑 类型推断由 ts-morph 在 Schema 生成时完成
      // 不再依赖 Reflect.getMetadata
      const inferredTargetType = undefined;
      const targetName = undefined;

      // 注册关系字段到 metadataStore.entities[entityName].fields
      fields.push({
        name: fieldName,
        isRelation: true,
        relationType: 'Composition',
        relationConfig: {
          ...options,
          target: () => inferredTargetType,
        },
      });

      metadataStore.registerEntity(entityName, {
        ...existingMetadata,
        fields,
      });

      // 如果是 OneToMany，标记子实体
      if (options.type === RelationType.OneToMany && targetName) {
        const childMetadata = metadataStore.getEntity(targetName) || { fields: [] };
        metadataStore.registerEntity(targetName, {
          ...childMetadata,
          isChildEntity: true,
          parentEntityName: entityName,
        });
      }
    };

    if (typeof propertyKeyOrContext !== 'string' && propertyKeyOrContext.addInitializer) {
       propertyKeyOrContext.addInitializer(registerMetadata);
    } else {
       registerMetadata();
    }
  };
}

/**
 * 关联关系装饰器
 * 用于定义弱依赖的关联关系（ManyToOne, ManyToMany）
 * 
 * @example
 * ```typescript
 * // ManyToOne - 多对一引用
 * @Association({
 *   type: RelationType.ManyToOne,
 *   joinColumn: 'purchase_order_id'
 * })
 * purchaseOrder!: PurchaseOrder;
 * 
 * // ManyToMany - 多对多关系
 * @Association({
 *   type: RelationType.ManyToMany,
 *   joinTable: 'product_categories'
 * })
 * categories!: Category[];
 * ```
 */
export function Association(options: Omit<AssociationOptions, 'target'>) {
  return function (target: any, propertyKeyOrContext: string | ClassFieldDecoratorContext) {
    let fieldName: string;

    if (typeof propertyKeyOrContext === 'string') {
      fieldName = propertyKeyOrContext;
    } else {
      fieldName = propertyKeyOrContext.name as string;
    }

    const registerMetadata = () => {
      // 旧版装饰器中 target 是原型对象
      const entityName = typeof target === 'function' ? target.name : target.constructor.name;
      const existingMetadata = metadataStore.getEntity(entityName) || { fields: [] };
      const fields = (existingMetadata as any).fields || [];

      // 🔑 类型推断由 ts-morph 在 Schema 生成时完成
      // 不再依赖 Reflect.getMetadata
      const inferredTargetType = undefined;
      const targetName = undefined;

      // 注册关系字段到 metadataStore.entities[entityName].fields
      fields.push({
        name: fieldName,
        isRelation: true,
        relationConfig: {
          ...options,
          target: () => inferredTargetType,
        },
      });

      metadataStore.registerEntity(entityName, {
        ...existingMetadata,
        fields,
      });
    };

    if (typeof propertyKeyOrContext !== 'string' && propertyKeyOrContext.addInitializer) {
       propertyKeyOrContext.addInitializer(registerMetadata);
    } else {
       registerMetadata();
    }
  };
}

/**
 * 工具函数：检查是否为组合关系
 */
export function isComposition(relationConfig: any): boolean {
  return relationConfig.type === RelationType.OneToOne || relationConfig.type === RelationType.OneToMany;
}

/**
 * 工具函数：检查是否为关联关系
 */
export function isAssociation(relationConfig: any): boolean {
  return relationConfig.type === RelationType.ManyToOne || relationConfig.type === RelationType.ManyToMany;
}

/**
 * 工具函数：检查是否为嵌入式关系
 */
export function isEmbedded(relationConfig: any): boolean {
  return relationConfig.type === RelationType.OneToOne && relationConfig.embedded !== false;
}
