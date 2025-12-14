/**
 * Schema 生成器
 * 
 * 🎯 从 Entity 元数据自动生成数据库表结构
 */

import { 
  FieldTypes, 
  getEntityDefinition, 
  getMetadataByType,
  type EntityClass 
} from '@ai-builder/jsx-runtime';

// ==================== 类型定义 ====================

export interface TableColumn {
  name: string;
  sqlType: string;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isJson: boolean;
  isDate: boolean;
}

export interface TableSchema {
  tableName: string;
  columns: TableColumn[];
  createTableSQL: string;
  /** 列定义（用于 SQLite 适配器） */
  columnDefs: Record<string, string>;
  /** JSON 类型的列名 */
  jsonColumns: string[];
  /** 日期类型的列名 */
  dateColumns: string[];
}

// ==================== 类型映射 ====================

/**
 * DSL FieldType -> SQLite 类型映射
 */
const fieldTypeToSQLite: Record<string, string> = {
  [FieldTypes.STRING]: 'TEXT',
  [FieldTypes.NUMBER]: 'REAL',
  [FieldTypes.DECIMAL]: 'REAL',
  [FieldTypes.BOOLEAN]: 'INTEGER',  // SQLite 没有布尔类型，用 0/1
  [FieldTypes.DATE]: 'TEXT',        // ISO 日期字符串
  [FieldTypes.DATETIME]: 'TEXT',    // ISO 日期时间字符串
  [FieldTypes.ENUM]: 'TEXT',        // 枚举值存储为字符串
  [FieldTypes.COMPOSITION]: 'TEXT', // 嵌套对象序列化为 JSON
};

// ==================== 生成函数 ====================

/**
 * 从 Entity 类生成表结构
 * 
 * @example
 * ```typescript
 * import { PurchaseOrder } from './models/PurchaseOrder.model';
 * 
 * const schema = generateTableSchema(PurchaseOrder);
 * console.log(schema.createTableSQL);
 * // CREATE TABLE IF NOT EXISTS purchase_orders (
 * //   id TEXT PRIMARY KEY,
 * //   orderNo TEXT NOT NULL,
 * //   ...
 * // );
 * ```
 */
export function generateTableSchema(entityClass: EntityClass<unknown>): TableSchema {
  const metadata = getEntityDefinition(entityClass) as {
    name: string;
    table: string;
    fields: Record<string, {
      type: string;
      label?: string;
      required?: boolean;
      primaryKey?: boolean;
      relation?: string;
      target?: () => EntityClass<unknown>;
      embedded?: boolean;
    }>;
  };
  
  if (!metadata) {
    throw new Error(`Entity metadata not found for ${entityClass.name}. Ensure @Entity decorator is applied.`);
  }
  
  const tableName = metadata.table || entityClass.name.toLowerCase() + 's';
  const columns: TableColumn[] = [];
  const columnDefs: Record<string, string> = {};
  const jsonColumns: string[] = [];
  const dateColumns: string[] = [];
  
  // 遍历所有字段
  for (const [fieldName, fieldDef] of Object.entries(metadata.fields)) {
    const sqlType = getSQLiteType(fieldDef);
    const isPrimaryKey = fieldDef.primaryKey === true;
    const isRequired = fieldDef.required === true || isPrimaryKey;
    const isJson = fieldDef.type === FieldTypes.COMPOSITION;
    const isDate = fieldDef.type === FieldTypes.DATE || fieldDef.type === FieldTypes.DATETIME;
    
    columns.push({
      name: fieldName,
      sqlType,
      isPrimaryKey,
      isRequired,
      isJson,
      isDate,
    });
    
    // 构建列定义字符串
    let colDef = sqlType;
    if (isPrimaryKey) {
      colDef += ' PRIMARY KEY';
    } else if (isRequired) {
      colDef += ' NOT NULL';
    }
    columnDefs[fieldName] = colDef;
    
    if (isJson) {
      jsonColumns.push(fieldName);
    }
    if (isDate) {
      dateColumns.push(fieldName);
    }
  }
  
  // 生成 CREATE TABLE SQL
  const createTableSQL = generateCreateTableSQL(tableName, columns);
  
  return {
    tableName,
    columns,
    createTableSQL,
    columnDefs,
    jsonColumns,
    dateColumns,
  };
}

/**
 * 获取 SQLite 类型
 */
function getSQLiteType(fieldDef: { type: string; relation?: string }): string {
  // 组合类型（嵌套对象/数组）存储为 JSON
  if (fieldDef.type === FieldTypes.COMPOSITION) {
    return 'TEXT'; // JSON 字符串
  }
  
  return fieldTypeToSQLite[fieldDef.type] || 'TEXT';
}

/**
 * 生成 CREATE TABLE SQL
 */
function generateCreateTableSQL(tableName: string, columns: TableColumn[]): string {
  const columnDefs = columns.map(col => {
    let def = `${col.name} ${col.sqlType}`;
    if (col.isPrimaryKey) {
      def += ' PRIMARY KEY';
    } else if (col.isRequired) {
      def += ' NOT NULL';
    }
    return def;
  });
  
  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columnDefs.join(',\n  ')}\n);`;
}

/**
 * 从多个 Entity 类生成所有表结构
 * 
 * @example
 * ```typescript
 * const schemas = generateAllTableSchemas([
 *   PurchaseOrder,
 *   Product,
 *   Supplier,
 * ]);
 * ```
 */
export function generateAllTableSchemas(entityClasses: EntityClass<unknown>[]): TableSchema[] {
  return entityClasses.map(cls => generateTableSchema(cls));
}

/**
 * 生成完整的数据库初始化 SQL
 */
export function generateInitSQL(entityClasses: EntityClass<unknown>[]): string {
  const schemas = generateAllTableSchemas(entityClasses);
  return schemas.map(s => s.createTableSQL).join('\n\n');
}

/**
 * 获取 Entity 表配置（用于 SQLite 适配器）
 * 
 * @example
 * ```typescript
 * const config = getEntityTableConfig(PurchaseOrder);
 * adapter.registerEntity(PurchaseOrder, config);
 * ```
 */
export function getEntityTableConfig(entityClass: EntityClass<unknown>): {
  tableName: string;
  columns: Record<string, string>;
  jsonColumns: string[];
  dateColumns: string[];
} {
  const schema = generateTableSchema(entityClass);
  return {
    tableName: schema.tableName,
    columns: schema.columnDefs,
    jsonColumns: schema.jsonColumns,
    dateColumns: schema.dateColumns,
  };
}

/**
 * 🎯 获取所有已注册的 Entity 类
 * 
 * 从 Metadata Store 动态获取，无需手动导入
 * 
 * @example
 * ```typescript
 * const entityClasses = getAllEntityClasses();
 * for (const cls of entityClasses) {
 *   const config = getEntityTableConfig(cls);
 *   adapter.registerEntity(cls, config);
 * }
 * ```
 */
export function getAllEntityClasses(): EntityClass<unknown>[] {
  const entityMetadata = getMetadataByType('entity');
  const classes: EntityClass<unknown>[] = [];
  
  for (const [, metadata] of entityMetadata) {
    const def = metadata.definition as { __class?: EntityClass<unknown> };
    if (def.__class) {
      classes.push(def.__class);
    }
  }
  
  return classes;
}

/**
 * 🎯 获取所有 Entity 的表配置
 * 
 * @example
 * ```typescript
 * const configs = getAllEntityTableConfigs();
 * for (const { entityClass, config } of configs) {
 *   adapter.registerEntity(entityClass, config);
 * }
 * ```
 */
export function getAllEntityTableConfigs(): Array<{
  entityClass: EntityClass<unknown>;
  config: {
    tableName: string;
    columns: Record<string, string>;
    jsonColumns: string[];
    dateColumns: string[];
  };
}> {
  const classes = getAllEntityClasses();
  return classes.map(cls => ({
    entityClass: cls,
    config: getEntityTableConfig(cls),
  }));
}

