/**
 * 实体和字段装饰器
 */

import { metadataStore } from '../utils/metadata';

interface EntityOptions {
  /** 数据库表名（不设置则使用实体名转蛇形命名） */
  table?: string;
  /** 表注释 */
  comment?: string;
}

interface FieldOptions {
  /** 字段标签（显示名称） */
  label?: string;
  /** 字段类型 */
  type?: string;
  /** 数据库列名（不设置则使用字段名转蛇形命名） */
  column?: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否可空 */
  nullable?: boolean;
  /** 是否主键 */
  primaryKey?: boolean;
  /** 是否自增 */
  autoIncrement?: boolean;
  /** 默认值 */
  default?: unknown;
}

type Constructor = new (...args: any[]) => any;

/**
 * @Entity 装饰器
 * 标记一个类为实体
 */
export function Entity(options: EntityOptions = {}) {
  return function (target: any, context?: ClassDecoratorContext) {
    // 兼容旧版和新版装饰器
    const entityName = context ? (context.name as string) : target.name;
    
    metadataStore.registerEntity(entityName, {
      type: 'Entity',
      table: options.table,
      comment: options.comment,
      fields: [],
    });

    return undefined;
  };
}

/**
 * @Field 装饰器
 * 标记实体的字段
 */
export function Field(options: FieldOptions = {}) {
  return function (target: any, propertyKeyOrContext: string | ClassFieldDecoratorContext) {
    let fieldName: string;

    // 兼容旧版实验性装饰器 (experimentalDecorators: true) 和新版标准装饰器 (Stage 3)
    if (typeof propertyKeyOrContext === 'string') {
      // 旧版装饰器: (target: any, propertyKey: string)
      fieldName = propertyKeyOrContext;
    } else {
      // 新版装饰器: (target: any, context: ClassFieldDecoratorContext)
      fieldName = propertyKeyOrContext.name as string;
    }

    // 推断字段类型
    const fieldType = inferFieldType(fieldName, options.type);

    // 注册逻辑...
    const registerMetadata = () => {
      const entityName = target.constructor.name;
      // 注意：旧版装饰器中 target 是原型对象（对于实例属性），其 constructor 是类本身
      // 新版装饰器中 target 可能是 undefined
      const actualEntityName = typeof target === 'function' ? target.name : target.constructor.name;

      const existingMetadata = metadataStore.getEntity(actualEntityName) || { fields: [] };
      const fields: any[] = existingMetadata.fields || [];
      
      // 检查字段是否已存在
      const existingFieldIndex = fields.findIndex((f: any) => f.name === fieldName);
      
      const fieldMetadata: any = {
        name: fieldName,
        label: options.label,
        type: fieldType,
        column: options.column,
        required: options.required,
        nullable: options.nullable,
        primaryKey: options.primaryKey,
        autoIncrement: options.autoIncrement,
        default: options.default,
      };

      if (existingFieldIndex >= 0) {
        fields[existingFieldIndex] = fieldMetadata;
      } else {
        fields.push(fieldMetadata);
      }

      metadataStore.registerEntity(actualEntityName, {
        ...existingMetadata,
        fields,
      } as any);
    };

    if (typeof propertyKeyOrContext !== 'string' && propertyKeyOrContext.addInitializer) {
       // 新版装饰器
       propertyKeyOrContext.addInitializer(registerMetadata);
    } else {
       // 旧版装饰器：直接执行
       // 但由于类可能还没定义完，最好也是延后，不过通常直接执行也没问题，只要 target.constructor 还是类
       registerMetadata();
    }
  };
}

/**
 * 推断字段类型
 */
function inferFieldType(fieldName: string, explicitType?: string): string {
  if (explicitType) {
    return explicitType;
  }
  
  // 根据字段名称启发式推断
  if (fieldName.endsWith('At')) return 'Date';
  if (fieldName.endsWith('Date')) return 'Date';
  if (fieldName === 'id') return 'string';
  if (fieldName.includes('amount') || fieldName.includes('price') || fieldName.includes('quantity')) {
    return 'Decimal';
  }
  
  return 'string'; // 默认类型
}
