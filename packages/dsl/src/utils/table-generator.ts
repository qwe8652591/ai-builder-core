/**
 * Entity 到 Table 元数据转换器
 * 
 * 负责将领域模型的 Entity 元数据转换为数据库表的 Table 元数据
 */

import { metadataStore, type TableMetadata, type TableColumnMetadata } from './metadata';

/**
 * 字段名转换：驼峰 -> 蛇形
 * 避免在字符串开头添加下划线
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/[A-Z]/g, (letter, index) => 
      index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`
    );
}

/**
 * 映射 DSL 类型到 TypeScript/Kysely 类型
 */
function mapFieldType(field: any, entityName: string): string {
  const fieldType = field.type || 'string';
  const isNullable = field.nullable || !field.required;
  
  let tsType: string;
  
  // 基础类型映射
  if (fieldType === 'Decimal' || fieldType.includes('amount') || fieldType.includes('price') || fieldType.includes('quantity')) {
    tsType = 'ColumnType<number, string | number, string | number>';
  } else if (fieldType === 'Date') {
    tsType = 'Date';
  } else if (fieldType === 'number') {
    tsType = 'number';
  } else if (fieldType === 'boolean') {
    tsType = 'boolean';
  } else if (field.name === 'status') {
    tsType = `${entityName}Status`;
  } else if (field.name === 'priority') {
    tsType = `${entityName}Priority`;
  } else {
    tsType = 'string';
  }
  
  // 处理自动生成字段（id, created_at, updated_at）
  if (field.name === 'id' || field.autoIncrement) {
    return `Generated<${tsType}>`;
  }
  if (field.name === 'createdAt' || field.name === 'updatedAt') {
    return `Generated<Date>`;
  }
  
  // 添加 null 类型
  if (isNullable && !tsType.includes('null')) {
    return `${tsType} | null`;
  }
  
  return tsType;
}

/**
 * 将 Entity 元数据转换为 Table 元数据
 * 
 * 这个函数处理所有的关系字段、扁平化、外键生成等逻辑
 * 
 * 列名优先级：
 * 1. field.column（@Field 中自定义的列名）
 * 2. toSnakeCase(field.name)（字段名转蛇形命名）
 * 
 * 表名优先级：
 * 1. entityMetadata.table（@Entity 中自定义的表名）
 * 2. toSnakeCase(entityName) + 's'（实体名转蛇形命名 + 复数）
 */
export function convertEntityToTable(entityName: string, entityMetadata: any): TableMetadata {
  const tableName = entityMetadata.table || (toSnakeCase(entityName).replace(/^_/, '') + 's');
  const columns: TableColumnMetadata[] = [];
  const enums: Array<{ name: string; values: string[] }> = [];
  
  // 处理所有字段
  const fields = entityMetadata.fields || [];
  
  fields.forEach((field: any) => {
    // 处理关系字段
    if (field.isRelation && field.relationConfig) {
      const { type: relationType, embedded, joinColumn } = field.relationConfig;
      
      if (field.relationType === 'Composition') {
        if (relationType === 'OneToOne') {
          if (embedded !== false) {
            // 嵌入式 OneToOne：扁平化值对象字段
            const targetTypeName = field.relationConfig.targetType;
            
            if (targetTypeName) {
              const targetMetadata = metadataStore.getEntity(targetTypeName) as any;
              
              if (targetMetadata && targetMetadata.fields) {
                targetMetadata.fields.forEach((subField: any) => {
                  // 跳过关系字段和 id 字段
                  if (subField.isRelation || subField.name === 'id') return;
                  
                  // 扁平化字段命名：优先使用子字段自定义列名，否则使用 prefix_field_name
                  const prefix = field.column || toSnakeCase(field.name);
                  const subFieldColumnName = subField.column || toSnakeCase(subField.name);
                  const flatFieldName = `${prefix}_${subFieldColumnName}`;
                  const fieldType = mapFieldType(subField, entityName);
                  
                  columns.push({
                    name: flatFieldName,
                    type: fieldType,
                    comment: subField.label,
                    sourceField: `${field.name}.${subField.name}`,
                  });
                });
              }
            }
          } else {
            // 独立式 OneToOne：生成外键字段
            const fkColumn = joinColumn || `${toSnakeCase(field.name)}_id`;
            columns.push({
              name: fkColumn,
              type: 'string',
              comment: field.label ? `${field.label} (外键)` : undefined,
              isForeignKey: true,
              sourceField: field.name,
            });
          }
        } else if (relationType === 'OneToMany') {
          // OneToMany：不在父表生成字段
          // 子表会自动添加外键
        }
      } else if (field.relationType === 'Association') {
        if (relationType === 'ManyToOne') {
          // ManyToOne：生成外键字段
          const fkColumn = joinColumn || `${toSnakeCase(field.name)}_id`;
          columns.push({
            name: fkColumn,
            type: 'string',
            comment: field.label ? `${field.label} (外键)` : undefined,
            isForeignKey: true,
            sourceField: field.name,
          });
        } else if (relationType === 'ManyToMany') {
          // ManyToMany：通过中间表维护，不在主表生成字段
        }
      }
    } else {
      // 普通字段
      // 优先使用自定义列名，否则转换为蛇形命名
      const fieldName = field.column || toSnakeCase(field.name);
      const fieldType = mapFieldType(field, entityName);
      
      columns.push({
        name: fieldName,
        type: fieldType,
        comment: field.label,
        isGenerated: field.name === 'id' || field.autoIncrement || 
                     field.name === 'createdAt' || field.name === 'updatedAt',
        sourceField: field.name,
      });
    }
  });
  
  // 对于子实体表，自动添加父实体外键（如果是 OneToMany 关系）
  if (entityName.includes('Item') && entityName !== 'Item') {
    const parentName = entityName.replace('Item', '');
    const hasForeignKey = columns.some(c => c.name === `${toSnakeCase(parentName)}_id` || c.name === 'order_id');
    
    if (!hasForeignKey) {
      const fkColumn = `${toSnakeCase(parentName)}_id`;
      columns.push({
        name: fkColumn,
        type: 'string',
        comment: `外键，指向 ${toSnakeCase(parentName).replace(/^_/, '')}s.id`,
        isForeignKey: true,
        sourceField: `${parentName.toLowerCase()}Id`,
      });
    }
  }
  
  // 添加审计字段（如果不存在）
  const hasCreatedAt = columns.some(c => c.name === 'created_at');
  const hasUpdatedAt = columns.some(c => c.name === 'updated_at');
  
  if (!hasCreatedAt) {
    columns.push({
      name: 'created_at',
      type: 'Generated<Date>',
      comment: '创建时间',
      isGenerated: true,
    });
  }
  if (!hasUpdatedAt) {
    columns.push({
      name: 'updated_at',
      type: 'Generated<Date>',
      comment: '更新时间',
      isGenerated: true,
    });
  }
  
  // 从 metadataStore 中提取枚举类型（从源文件解析的真实枚举值）
  const storeEnums = (metadataStore as any).enums as Map<string, string[]> | undefined;
  
  if (storeEnums) {
    // 查找与当前实体字段类型匹配的枚举
    fields.forEach((field: any) => {
      const fieldType = field.type;
      
      // 跳过没有类型或关系字段
      if (!fieldType || field.isRelation) {
        return;
      }
      
      // 检查字段类型是否匹配某个枚举名
      storeEnums.forEach((values, enumName) => {
        // 匹配规则：
        // 1. 字段类型直接等于枚举名（如 ProductStatus）
        // 2. 或者字段类型以枚举名结尾（处理完整路径）
        if (fieldType === enumName || fieldType.endsWith(`.${enumName}`) || fieldType.includes(enumName)) {
          // 检查是否已经添加过这个枚举
          const existingEnum = enums.find(e => e.name === enumName);
          if (!existingEnum) {
            enums.push({
              name: enumName,
              values,
            });
          }
        }
      });
    });
  }
  
  return {
    name: tableName,
    entityName,
    comment: entityMetadata.comment,
    columns,
    enums,
  };
}

/**
 * 为所有实体生成表元数据
 */
export function generateAllTableMetadata(): void {
  // 获取所有实体
  const entities = Array.from((metadataStore as any).entities.entries()) as Array<[string, any]>;
  
  // 转换为表元数据并注册
  entities.forEach(([entityName, metadata]) => {
    if (metadata.type === 'Entity') {
      const tableMetadata = convertEntityToTable(entityName, metadata);
      metadataStore.registerTable(tableMetadata.name, tableMetadata);
    }
  });
}

