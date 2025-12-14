/**
 * Kysely Schema 生成器
 * 
 * 从 @Entity 装饰的领域模型自动生成 Kysely Schema 类型
 */

import { metadataStore } from './metadata';

/**
 * 字段类型映射配置
 */
interface FieldTypeMapping {
  tsType: string;      // TypeScript 类型
  dbType: string;      // 数据库类型（用于 Kysely）
  isGenerated?: boolean; // 是否自动生成
}

/**
 * 默认类型映射
 */
const DEFAULT_TYPE_MAPPINGS: Record<string, FieldTypeMapping> = {
  'string': { tsType: 'string', dbType: 'string' },
  'number': { tsType: 'number', dbType: 'number' },
  'boolean': { tsType: 'boolean', dbType: 'boolean' },
  'Date': { tsType: 'Date', dbType: 'Date' },
  'Decimal': { 
    tsType: 'number', 
    dbType: 'ColumnType<number, string | number, string | number>' 
  },
};

/**
 * 字段名转换：驼峰 -> 蛇形
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 从实体元数据生成 Kysely 表类型定义
 */
export function generateKyselyTableType(entityName: string): string {
  const metadata = metadataStore.getEntity(entityName);
  if (!metadata) {
    throw new Error(`Entity ${entityName} not found`);
  }

  const fields = metadata.fields || [];
  const tableName = metadata.table || toSnakeCase(entityName);

  let typeDefinition = `/**\n * ${metadata.comment || entityName}\n */\n`;
  typeDefinition += `export interface ${entityName}Table {\n`;

  fields.forEach((field: any) => {
    const fieldName = toSnakeCase(field.name);
    const comment = field.label || field.name;
    
    // 确定字段类型
    let dbType = field.type || 'string';
    
    // 处理特殊类型
    if (field.type === 'Decimal') {
      dbType = 'ColumnType<number, string | number, string | number>';
    }
    
    // 处理自动生成字段（id, createdAt, updatedAt）
    if (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt') {
      dbType = `Generated<${dbType}>`;
    }
    
    // 处理可选字段
    const nullable = field.required === false || field.nullable === true ? ' | null' : '';
    
    typeDefinition += `  ${fieldName}: ${dbType}${nullable};  // ${comment}\n`;
  });

  typeDefinition += `}\n`;
  
  return typeDefinition;
}

/**
 * 生成完整的 Kysely Schema 文件内容
 */
export function generateKyselySchema(entityNames: string[]): string {
  let content = `/**
 * Kysely 数据库 Schema 定义
 * 
 * ⚠️ 此文件由领域模型自动生成，请勿手动编辑
 * 如需修改，请修改对应的 .model.ts 文件，然后重新生成
 */

import { Generated, ColumnType } from 'kysely';

`;

  // 生成各个表的类型定义
  entityNames.forEach(entityName => {
    content += generateKyselyTableType(entityName);
    content += '\n';
  });

  // 生成 Database 接口
  content += `/**\n * 数据库 Schema\n */\n`;
  content += `export interface Database {\n`;
  entityNames.forEach(entityName => {
    const metadata = metadataStore.getEntity(entityName);
    const tableName = metadata?.table || toSnakeCase(entityName);
    content += `  ${tableName}: ${entityName}Table;\n`;
  });
  content += `}\n`;

  return content;
}

