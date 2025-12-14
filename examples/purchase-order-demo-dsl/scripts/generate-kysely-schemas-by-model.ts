/**
 * 按领域模型文件生成 Kysely Schema
 * 
 * ⚡ 完全基于 DSL 元数据生成，零配置
 * 
 * 流程：
 * 1. 加载扩展定义（extensions/*.ext.ts）
 * 2. 加载领域模型（*.model.ts）→ 使用 loadModelFile
 * 3. 生成表元数据 → 使用 generateAllTableMetadata
 * 4. 从 metadataStore 读取表信息并生成 Schema 文件
 */

import 'reflect-metadata';  // ← 必须在最前面导入！
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';
import { metadataStore, type TableMetadata } from '../../../packages/dsl/src/utils/metadata';
import { loadModelFile } from '../../../packages/dsl/src/utils/model-loader';
import { generateAllTableMetadata } from '../../../packages/dsl/src/utils/table-generator';

/**
 * 字段名转换：驼峰 -> 蛇形
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}


/**
 * 领域模型文件配置
 */
interface ModelFileConfig {
  name: string;           // 文件名（不含扩展名）如 'PurchaseOrder'
  entities: string[];     // 包含的实体列表
  mainEntity: string;     // 主实体（用于生成文件名）
  filePath: string;       // 文件完整路径
}

/**
 * 自动发现所有领域模型文件并加载元数据
 * 使用 DSL 提供的工具函数
 */
function discoverAndLoadModels(): ModelFileConfig[] {
  const domainDir = path.join(__dirname, '../src/domain');
  const tsconfigPath = path.join(__dirname, '../tsconfig.json');
  
  // 1. 使用 glob 查找所有 .model.ts 文件
  const modelFiles = globSync('**/*.model.ts', {
    cwd: domainDir,
    absolute: true
  });

  console.log('🔍 自动发现领域模型文件：');
  
  // 2. 使用 DSL 的 loadModelFile 加载每个模型文件
  modelFiles.forEach(file => {
    console.log(`   📄 ${path.basename(file)}`);
    loadModelFile(file, tsconfigPath);
  });
  
  console.log(`\n✅ 已加载 ${modelFiles.length} 个模型文件\n`);
  
  // 3. 使用 DSL 的 generateAllTableMetadata 生成表元数据
  console.log('🔄 生成 Table 元数据：');
  generateAllTableMetadata();
  const tables = metadataStore.getAllTables();
  tables.forEach(table => {
    console.log(`   ✅ ${table.name} (${table.entityName}, ${table.columns.length} 列)`);
  });
  console.log();
  
  // 4. 从 metadataStore 获取所有实体，按文件组织
  console.log('🔍 组织实体信息：');
  const allEntityNames = metadataStore.getAllEntityNames();
  const fileToEntities = new Map<string, string[]>();
  
  allEntityNames.forEach(entityName => {
    // 推断所属文件（基于实体名称的主词）
    let fileName = entityName;
    
    // 处理子实体（如 PurchaseOrderItem 归属于 PurchaseOrder）
    if (entityName.includes('Item') && !entityName.startsWith('Item')) {
      fileName = entityName.replace('Item', '');
    }
    
    if (!fileToEntities.has(fileName)) {
      fileToEntities.set(fileName, []);
    }
    fileToEntities.get(fileName)!.push(entityName);
    
    console.log(`   📦 ${entityName} → ${fileName}.model.ts`);
  });
  
  console.log(`\n✅ 发现 ${fileToEntities.size} 个模型文件，包含 ${allEntityNames.length} 个实体\n`);
  
  // 5. 构建配置
  const configs: ModelFileConfig[] = [];
  fileToEntities.forEach((entities, fileName) => {
    const fullPath = path.join(domainDir, `${fileName}.model.ts`);
    
    // 确认文件存在
    if (fs.existsSync(fullPath)) {
      configs.push({
        name: fileName,
        mainEntity: entities[0],
        entities: entities,
        filePath: fullPath
      });
    }
  });
  
  return configs;
}

/**
 * 为单个领域模型文件生成 Schema
 * 直接从 metadataStore 的表元数据生成
 */
function generateModelSchema(config: ModelFileConfig): string {
  // 收集需要导入的枚举类型
  const enumsToImport = new Set<string>();
  
  // 从 Table 元数据的枚举列表收集
  config.entities.forEach(entityName => {
    const tableMetadata = metadataStore.getTableByEntity(entityName);
    if (tableMetadata?.enums && tableMetadata.enums.length > 0) {
      tableMetadata.enums.forEach(enumDef => {
        enumsToImport.add(enumDef.name);
      });
    }
    
    // 从字段类型中收集可能的枚举/type 引用
    if (tableMetadata?.columns) {
      tableMetadata.columns.forEach(column => {
        const fieldType = column.type;
        // 检查是否是简单的类型引用（不包含 Generated、ColumnType 等）
        if (fieldType && 
            !fieldType.includes('Generated') && 
            !fieldType.includes('ColumnType') &&
            !fieldType.includes('string') &&
            !fieldType.includes('number') &&
            !fieldType.includes('boolean') &&
            !fieldType.includes('Date') &&
            !fieldType.includes('null') &&
            !fieldType.includes('|') &&
            !fieldType.includes('<') &&
            !fieldType.includes('>')) {
          // 可能是自定义类型，需要导入
          enumsToImport.add(fieldType);
        }
      });
    }
  });
  
  let content = `/**
 * ${config.name} 领域模型 Schema
 * 
 * ⚠️ 此文件由领域模型自动生成，请勿手动编辑
 * 生成时间：${new Date().toLocaleString('zh-CN')}
 * 源文件：${config.name}.model.ts
 * 
 * 包含的实体：${config.entities.join(', ')}
 */

import { Generated, ColumnType } from 'kysely';
`;

  // 导入枚举类型（从 model.ts）
  if (enumsToImport.size > 0) {
    content += `import type { ${Array.from(enumsToImport).join(', ')} } from './${config.name}.model';\n`;
  }

  content += `\n`;

  // 为每个实体生成对应的 Schema（从 Table 元数据）
  config.entities.forEach((entityName, index) => {
    if (index === 0) {
      content += `// ==================== ${config.name} 相关 ====================\n\n`;
    }
    
    // 🔑 从 metadataStore 获取 Table 元数据
    const tableMetadata = metadataStore.getTableByEntity(entityName);
    if (!tableMetadata) {
      console.warn(`⚠️  未找到实体 ${entityName} 的表元数据`);
      return;
    }
    
    // 不再生成枚举类型定义，直接从 model.ts 导入
    
    // 生成表接口
    content += `/**
 * ${tableMetadata.comment || entityName} 表
 */
export interface ${entityName}Table {\n`;
    
    // 🔑 从 Table 元数据生成字段
    tableMetadata.columns.forEach(column => {
      const comment = column.comment ? `  // ${column.comment}` : '';
      content += `  ${column.name}: ${column.type};${comment}\n`;
    });
    
    content += `}\n\n`;
  });

  return content;
}

/**
 * 生成统一的 Database 接口文件
 */
function generateDatabaseIndex(configs: ModelFileConfig[]): string {
  let content = `/**
 * Database Schema
 * 
 * ⚠️ 此文件由领域模型自动生成，请勿手动编辑
 * 生成时间：${new Date().toLocaleString('zh-CN')}
 * 
 * 统一导出所有领域模型的 Schema
 */

`;

  // 导入所有 Schema
  configs.forEach(config => {
    content += `// ${config.name} 领域模型\n`;
    content += `export * from '../../domain/${config.name}.schema';\n`;
  });

  content += `\n`;

  // 收集所有表类型
  const allTables: Array<{ tableName: string; tableType: string; source: string }> = [];
  configs.forEach(config => {
    config.entities.forEach(entityName => {
      const tableName = toSnakeCase(entityName).replace(/^_/, '') + 's';
      const tableType = `${entityName}Table`;
      allTables.push({ tableName, tableType, source: config.name });
    });
  });

  // 导入表类型（按源文件分组）
  const tablesBySource = new Map<string, Array<{ tableName: string; tableType: string }>>();
  allTables.forEach(({ tableName, tableType, source }) => {
    if (!tablesBySource.has(source)) {
      tablesBySource.set(source, []);
    }
    tablesBySource.get(source)!.push({ tableName, tableType });
  });

  tablesBySource.forEach((tables, source) => {
    const types = tables.map(t => t.tableType).join(',\n  ');
    content += `import type {\n  ${types}\n} from '../../domain/${source}.schema';\n`;
  });

  content += `\n`;

  // 生成 Database 接口
  content += `/**
 * 数据库 Schema
 * 
 * 包含所有表的类型定义
 */
export interface Database {\n`;

  allTables.forEach(table => {
    content += `  ${table.tableName}: ${table.tableType};\n`;
  });

  content += `}\n`;

  return content;
}

/**
 * 生成支持扩展的 Database 接口
 */
function generateDatabaseIndexWithExtensions(
  modelConfigs: ModelConfig[],
  extensions: Array<{ modelName: string; extFile: string; packageName?: string }>
): string {
  let content = `// ⚠️ AUTO-GENERATED
// 生成时间：${new Date().toISOString()}
// 
// 此文件统一导出所有 Schema（包括扩展）

`;

  // 创建扩展模型名称集合（只包含来自 NPM 包的模型）
  const extendedModelNames = new Set<string>();
  for (const { modelName } of extensions) {
    const entityMetadata = metadataStore.entities.get(modelName);
    const hasExtFields = entityMetadata?.fields.some(f => f.isExtension === true);
    const isFromPackage = !!entityMetadata?.fromPackage;
    
    // 只有来自 NPM 包的模型才生成扩展 Schema
    if (hasExtFields && isFromPackage) {
      extendedModelNames.add(modelName);
    }
  }

  // 导出所有本地 Schema
  content += `// 本地模型 Schema\n`;
  modelConfigs.forEach(config => {
    content += `export * from '../../domain/${config.name}.schema';\n`;
  });
  
  if (extendedModelNames.size > 0) {
    content += `\n// 扩展 Schema\n`;
    extendedModelNames.forEach(modelName => {
      content += `export * from '../../domain/extensions/${modelName}.schema.ext';\n`;
    });
  }

  content += `\n`;

  // 收集所有表类型
  const allTables: Array<{ tableName: string; tableType: string; source: string; isExtended: boolean }> = [];
  
  modelConfigs.forEach(config => {
    config.entities.forEach(entityName => {
      const entityMetadata = metadataStore.entities.get(entityName);
      const tableName = entityMetadata?.table || (toSnakeCase(entityName).replace(/^_/, '') + 's');
      const tableType = `${entityName}Table`;
      const isExtended = extendedModelNames.has(entityName);
      allTables.push({ tableName, tableType, source: config.name, isExtended });
    });
  });

  // 导入表类型
  const tablesBySource = new Map<string, Array<{ tableName: string; tableType: string; isExtended: boolean }>>();
  
  allTables.forEach(({ tableName, tableType, source, isExtended }) => {
    const key = isExtended ? `extensions/${source}.schema.ext` : source;
    if (!tablesBySource.has(key)) {
      tablesBySource.set(key, []);
    }
    tablesBySource.get(key)!.push({ tableName, tableType, isExtended });
  });

  tablesBySource.forEach((tables, source) => {
    const types = tables.map(t => t.tableType).join(',\n  ');
    const importPath = source.includes('extensions/') 
      ? `../../domain/${source}`  // extensions/XXX.ext → ../../domain/extensions/XXX.ext
      : `../../domain/${source}.schema`;  // XXX → ../../domain/XXX.schema
    content += `import type {\n  ${types}\n} from '${importPath}';\n`;
  });

  content += `\n`;

  // 生成 Database 接口
  content += `/**
 * 数据库 Schema
 * 
 * 包含所有表的类型定义（包括扩展字段）
 */
export interface Database {\n`;

  allTables.forEach(table => {
    const comment = table.isExtended ? ' // 已扩展' : '';
    content += `  ${table.tableName}: ${table.tableType};${comment}\n`;
  });

  content += `}\n`;

  return content;
}

/**
 * 发现扩展文件
 */
function discoverExtensionFiles(): Array<{ modelName: string; extFile: string; packageName?: string }> {
  const projectRoot = path.join(__dirname, '..');
  const extFiles = globSync('src/domain/extensions/**/*.ext.ts', {
    cwd: projectRoot,
    absolute: true,
  });
  
  const extensions: Array<{ modelName: string; extFile: string; packageName?: string }> = [];
  
  for (const extFile of extFiles) {
    // 命名规范：PurchaseOrder.ext.ts → PurchaseOrder
    const modelName = path.basename(extFile, '.ext.ts');
    
    // TODO: 从文件中解析 fromPackage 信息
    // 暂时先不解析，在 extendEntity 中会设置
    
    extensions.push({ modelName, extFile });
  }
  
  return extensions;
}

/**
 * 生成扩展 Schema 文件
 */
function generateExtensionSchema(
  modelName: string,
  packageName: string,
  extFields: Array<{ name: string; type: string; nullable: boolean; dbField?: any }>
): string {
  let content = '';
  
  // 文件头注释
  content += `// ⚠️ AUTO-GENERATED - 此文件由 generate-kysely-schemas-by-model.ts 自动生成\n`;
  content += `// 扩展来源：${packageName}\n`;
  content += `// 生成时间：${new Date().toISOString()}\n\n`;
  
  // 导入基础 Schema
  content += `import type { ${modelName}Table as Base${modelName}Table } from '${packageName}';\n\n`;
  
  // 定义扩展字段接口
  content += `/**\n`;
  content += ` * ${modelName} 扩展字段\n`;
  content += ` */\n`;
  content += `export interface ${modelName}Extensions {\n`;
  
  for (const field of extFields) {
    const fieldName = toSnakeCase(field.name);
    let tsType = mapFieldType(field);
    
    // mapFieldType 可能已经包含 | null，避免重复
    if (field.nullable && !tsType.includes('| null')) {
      tsType += ' | null';
    }
    
    content += `  /** ${field.dbField?.comment || field.name} */\n`;
    content += `  ${fieldName}: ${tsType};\n`;
  }
  
  content += `}\n\n`;
  
  // 合并基础 + 扩展
  content += `/**\n`;
  content += ` * 扩展后的 ${modelName} Table Schema\n`;
  content += ` * \n`;
  content += ` * 包含：\n`;
  content += ` * - 基础字段（来自 ${packageName}）\n`;
  content += ` * - 扩展字段（本项目新增）\n`;
  content += ` */\n`;
  content += `export interface ${modelName}Table extends Base${modelName}Table, ${modelName}Extensions {}\n`;
  
  return content;
}

async function main() {
  console.log('🚀 开始生成 Kysely Schema（支持 NPM 包扩展）...\n');

  const projectRoot = path.join(__dirname, '..');
  const domainDir = path.join(projectRoot, 'src/domain');
  const extensionsDir = path.join(domainDir, 'extensions');
  const dbDir = path.join(projectRoot, 'src/infrastructure/database');

  // ========== 步骤 1: 发现扩展文件 ==========
  const extensions = discoverExtensionFiles();
  console.log('📦 发现扩展文件：');
  if (extensions.length === 0) {
    console.log('   (无扩展文件)\n');
  } else {
    extensions.forEach(ext => {
      console.log(`   - ${path.relative(projectRoot, ext.extFile)}`);
    });
    console.log();
  }

  // ========== 步骤 2: 加载扩展文件（执行 extendEntity） ==========
  if (extensions.length > 0) {
    console.log('🔄 加载扩展定义...');
    for (const { extFile } of extensions) {
      try {
        require(extFile);  // 这会执行 extendEntity，更新 metadataStore
        console.log(`   ✅ 已加载 ${path.basename(extFile)}`);
      } catch (error) {
        console.error(`   ❌ 加载失败 ${path.basename(extFile)}: ${error}`);
      }
    }
    console.log();
  }

  // ========== 步骤 3: 发现并加载本地模型文件 ==========
  const modelConfigs = discoverAndLoadModels();
  
  // ========== 步骤 4: 生成本地模型的 Schema ==========
  console.log('📝 生成本地模型 Schema：\n');
  modelConfigs.forEach(config => {
    const schemaContent = generateModelSchema(config);
    const outputPath = path.join(domainDir, `${config.name}.schema.ts`);
    
    fs.writeFileSync(outputPath, schemaContent, 'utf-8');
    console.log(`   ✅ src/domain/${config.name}.schema.ts`);
    console.log(`      包含实体：${config.entities.join(', ')}\n`);
  });

  // ========== 步骤 5: 生成扩展 Schema ==========
  if (extensions.length > 0) {
    console.log('📝 检查扩展 Schema：\n');
    
    // 确保 extensions 目录存在
    if (!fs.existsSync(extensionsDir)) {
      fs.mkdirSync(extensionsDir, { recursive: true });
    }
    
    for (const { modelName } of extensions) {
      // 从 metadataStore 获取扩展后的元数据
      const entityMetadata = metadataStore.entities.get(modelName);
      
      if (!entityMetadata) {
        console.warn(`   ⚠️  未找到 ${modelName} 的元数据，跳过`);
        continue;
      }
      
      // 识别扩展字段（标记了 isExtension: true 的字段）
      const extFields = entityMetadata.fields.filter(f => f.isExtension === true);
      
      if (extFields.length === 0) {
        console.log(`   - ${modelName}: 无扩展字段`);
        continue;
      }
      
      // 检查是否来自外部包
      const packageName = entityMetadata.fromPackage;
      
      if (!packageName) {
        console.log(`   ⚠️  ${modelName} 是本地模型，无需生成扩展 Schema`);
        console.log(`      扩展字段将直接包含在 ${modelName}.schema.ts 中\n`);
        continue;
      }
      
      // 只为来自 NPM 包的模型生成扩展 Schema
      const schemaContent = generateExtensionSchema(
        modelName,
        packageName,
        extFields
      );
      
      const outputPath = path.join(extensionsDir, `${modelName}.schema.ext.ts`);
      fs.writeFileSync(outputPath, schemaContent, 'utf-8');
      
      console.log(`   ✅ src/domain/extensions/${modelName}.schema.ext.ts`);
      console.log(`      来源: ${packageName}`);
      console.log(`      扩展字段：${extFields.map(f => f.name).join(', ')}\n`);
    }
  }

  // ========== 步骤 6: 生成 database.schema.ts ==========
  console.log('📝 生成 Database 接口：\n');
  const databaseContent = generateDatabaseIndexWithExtensions(modelConfigs, extensions);
  const databasePath = path.join(dbDir, 'database.schema.ts');
  fs.writeFileSync(databasePath, databaseContent, 'utf-8');
  console.log(`   ✅ src/infrastructure/database/database.schema.ts\n`);

  // ========== 总结 ==========
  console.log('✅ Kysely Schema 已生成！\n');
  
  console.log('📁 文件结构：');
  console.log('   src/domain/');
  
  if (extensions.length > 0) {
    console.log('   ├── extensions/');
    extensions.forEach(ext => {
      const entityMetadata = metadataStore.entities.get(ext.modelName);
      const extFieldCount = entityMetadata?.fields.filter(f => f.isExtension).length || 0;
      if (extFieldCount > 0) {
        console.log(`   │   ├── ${ext.modelName}.ext.ts         (扩展定义)`);
        console.log(`   │   └── ${ext.modelName}.schema.ext.ts (扩展 Schema) ← 自动生成`);
      }
    });
  }
  
  modelConfigs.forEach(config => {
    console.log(`   ├── ${config.name}.model.ts`);
    console.log(`   └── ${config.name}.schema.ts  ← 自动生成`);
  });
  
  console.log('\n   src/infrastructure/database/');
  console.log('   └── database.schema.ts  ← Database 接口\n');
  
  console.log('🎉 功能特性：');
  console.log('   ✨ 从 @Entity 装饰器自动提取元数据');
  console.log('   ✨ 从 @Field 装饰器自动推断字段类型');
  console.log('   ✨ 支持 NPM 包模型扩展（extendEntity）');
  console.log('   ✨ 自动处理枚举、关系、审计字段');
  console.log('   ✨ 零配置，完全自动生成\n');
  
  if (extensions.length > 0) {
    console.log('📦 扩展信息：');
    extensions.forEach(ext => {
      const entityMetadata = metadataStore.entities.get(ext.modelName);
      const extFieldCount = entityMetadata?.fields.filter(f => f.isExtension).length || 0;
      if (extFieldCount > 0) {
        console.log(`   - ${ext.modelName}: 扩展了 ${extFieldCount} 个字段`);
      }
    });
    console.log();
  }
}

main();

