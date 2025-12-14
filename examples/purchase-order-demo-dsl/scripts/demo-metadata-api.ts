/**
 * 演示 metadataStore 导出的 API
 * 
 * ⚠️ 注意：在 monorepo 开发环境中，我们需要从源码导入以确保使用同一个 metadataStore 实例
 */

import { metadataStore } from '../../../packages/dsl/src/utils/metadata';
import { loadModelFile } from '../../../packages/dsl/src/utils/model-loader';
import { generateAllTableMetadata } from '../../../packages/dsl/src/utils/table-generator';
import path from 'path';
import { globSync } from 'glob';

console.log('📚 MetadataStore API 演示\n');
console.log('='.repeat(60));

// 1. 加载扩展定义
console.log('\n🔄 步骤1：加载扩展定义...');
const extensionsDir = path.join(__dirname, '../src/domain/extensions');
const extensionFiles = globSync('**/*.ext.ts', { cwd: extensionsDir });
for (const file of extensionFiles) {
  const fullPath = path.join(extensionsDir, file);
  require(fullPath);
}

// 2. 加载领域模型
console.log('🔄 步骤2：加载领域模型...');
const domainDir = path.join(__dirname, '../src/domain');
const modelFiles = globSync('**/*.model.ts', { cwd: domainDir, absolute: true });
const tsconfigPath = path.join(__dirname, '../tsconfig.json');

for (const modelFile of modelFiles) {
  console.log(`   📄 ${path.basename(modelFile)}`);
  // 🔑 使用 DSL 提供的 loadModelFile 工具函数
  loadModelFile(modelFile, tsconfigPath);
}

// 3. 生成表元数据
console.log('\n🔄 步骤3：生成表元数据...');
// 🔑 使用 DSL 提供的 generateAllTableMetadata 工具函数
generateAllTableMetadata();
const tables = metadataStore.getAllTables();
console.log(`   ✅ 生成了 ${tables.length} 个表`);
tables.forEach(table => {
  console.log(`      - ${table.name} (${table.entityName}, ${table.columns.length} 列)`);
});

console.log('✅ 加载完成\n');
console.log('='.repeat(60));

// ==================== API 演示 ====================

// API 1: getAllEntityNames()
console.log('\n【API 1】metadataStore.getAllEntityNames()');
console.log('说明：获取所有实体名称数组');
const entityNames = metadataStore.getAllEntityNames();
console.log(`返回: [${entityNames.join(', ')}]`);
console.log(`实体总数: ${entityNames.length}`);

// API 2: getAllEntities()
console.log('\n【API 2】metadataStore.getAllEntities()');
console.log('说明：获取所有实体的完整元数据');
const allEntities = metadataStore.getAllEntities();
console.log(`返回: EntityMetadata[] (${allEntities.length} 个实体)`);
allEntities.forEach(entity => {
  console.log(`  - ${entity.name}:`);
  console.log(`      表名: ${entity.table}`);
  console.log(`      注释: ${entity.comment || 'N/A'}`);
  console.log(`      字段数: ${entity.fields.length}`);
  console.log(`      来源包: ${entity.fromPackage || '本地'}`);
});

// API 3: getEntity(className)
console.log('\n【API 3】metadataStore.getEntity(className)');
console.log('说明：获取指定实体的元数据');
const poEntity = metadataStore.getEntity('PurchaseOrder');
if (poEntity) {
  console.log('示例: metadataStore.getEntity("PurchaseOrder")');
  console.log(`返回: EntityMetadata {`);
  console.log(`  name: "${poEntity.name}",`);
  console.log(`  table: "${poEntity.table}",`);
  console.log(`  comment: "${poEntity.comment}",`);
  console.log(`  fromPackage: ${poEntity.fromPackage || 'undefined'},`);
  console.log(`  fields: [...${poEntity.fields.length} 个字段]`);
  console.log(`}`);
}

// API 4: getEntityFields(className)
console.log('\n【API 4】metadataStore.getEntityFields(className)');
console.log('说明：获取指定实体的所有字段');
const poFields = metadataStore.getEntityFields('PurchaseOrder');
console.log(`示例: metadataStore.getEntityFields("PurchaseOrder")`);
console.log(`返回: FieldMetadata[] (${poFields.length} 个字段)`);
console.log('字段列表（前10个）:');
poFields.slice(0, 10).forEach((field, index) => {
  const tags = [];
  if (field.isExtension) tags.push('扩展');
  if ((field as any).isRelation) tags.push('关系');
  if (field.nullable) tags.push('可空');
  const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
  console.log(`  ${index + 1}. ${field.name}: ${field.type}${tagStr}`);
});
if (poFields.length > 10) {
  console.log(`  ... 还有 ${poFields.length - 10} 个字段`);
}

// API 5: clear()
console.log('\n【API 5】metadataStore.clear()');
console.log('说明：清空所有元数据（用于测试）');
console.log('当前实体数:', metadataStore.getAllEntityNames().length);
console.log('执行: metadataStore.clear()');
// 注意：这里不实际执行 clear()，以免影响后续演示

// API 6: getAllTables()
console.log('\n【API 6】metadataStore.getAllTables()');
console.log('说明：获取所有表元数据');
const allTables = metadataStore.getAllTables();
console.log(`返回: TableMetadata[] (${allTables.length} 个表)`);
allTables.forEach(table => {
  console.log(`  - ${table.name}:`);
  console.log(`      实体: ${table.entityName}`);
  console.log(`      注释: ${table.comment || 'N/A'}`);
  console.log(`      列数: ${table.columns.length}`);
  console.log(`      枚举: ${table.enums?.length || 0} 个`);
});

// API 7: getTable(tableName)
console.log('\n【API 7】metadataStore.getTable(tableName)');
console.log('说明：获取指定表的元数据');
const poTable = metadataStore.getTable('purchase_orders');
if (poTable) {
  console.log('示例: metadataStore.getTable("purchase_orders")');
  console.log(`返回: TableMetadata {`);
  console.log(`  name: "${poTable.name}",`);
  console.log(`  entityName: "${poTable.entityName}",`);
  console.log(`  comment: "${poTable.comment}",`);
  console.log(`  columns: [...${poTable.columns.length} 个列]`);
  console.log(`}`);
  
  console.log('\n  列详情（前5列）:');
  poTable.columns.slice(0, 5).forEach((col, index) => {
    const tags = [];
    if (col.isGenerated) tags.push('自动生成');
    if (col.isForeignKey) tags.push('外键');
    if (col.sourceField) tags.push(`来自:${col.sourceField}`);
    const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
    console.log(`    ${index + 1}. ${col.name}: ${col.type}${tagStr}`);
    if (col.comment) console.log(`       // ${col.comment}`);
  });
  if (poTable.columns.length > 5) {
    console.log(`    ... 还有 ${poTable.columns.length - 5} 列`);
  }
}

// API 8: getTableByEntity(entityName)
console.log('\n【API 8】metadataStore.getTableByEntity(entityName)');
console.log('说明：根据实体名获取表元数据');
const poTableByEntity = metadataStore.getTableByEntity('PurchaseOrder');
console.log(`示例: metadataStore.getTableByEntity("PurchaseOrder")`);
console.log(`返回: ${poTableByEntity?.name} (${poTableByEntity?.columns.length} 列)`);

// API 9: debug()
console.log('\n【API 9】metadataStore.debug()');
console.log('说明：打印所有元数据的详细信息（包括实体和表）');
console.log('执行: metadataStore.debug()');
console.log('='.repeat(60));
metadataStore.debug();

// ==================== 实用示例 ====================

console.log('\n' + '='.repeat(60));
console.log('💡 实用示例');
console.log('='.repeat(60));

// 示例1：筛选包含扩展字段的实体
console.log('\n【示例1】筛选包含扩展字段的实体');
const entitiesWithExtensions = metadataStore.getAllEntities().filter(entity => 
  entity.fields.some(f => f.isExtension)
);
console.log(`结果: ${entitiesWithExtensions.length} 个实体`);
entitiesWithExtensions.forEach(entity => {
  const extensionFields = entity.fields.filter(f => f.isExtension);
  console.log(`  - ${entity.name}: ${extensionFields.map(f => f.name).join(', ')}`);
});

// 示例2：统计所有字段总数
console.log('\n【示例2】统计所有字段总数');
const totalFields = metadataStore.getAllEntities().reduce(
  (sum, entity) => sum + entity.fields.length,
  0
);
console.log(`所有实体的字段总数: ${totalFields}`);

// 示例3：查找特定类型的字段
console.log('\n【示例3】查找所有 Date 类型的字段');
const dateFields: { entity: string; field: string }[] = [];
metadataStore.getAllEntities().forEach(entity => {
  entity.fields.forEach(field => {
    if (field.type === 'Date') {
      dateFields.push({ entity: entity.name, field: field.name });
    }
  });
});
console.log(`找到 ${dateFields.length} 个 Date 类型字段:`);
dateFields.forEach(({ entity, field }) => {
  console.log(`  - ${entity}.${field}`);
});

// 示例4：从表元数据生成 SQL DDL（概念演示）
console.log('\n【示例4】从表元数据生成 CREATE TABLE 语句（概念演示）');
const productTable = metadataStore.getTable('products');
if (productTable) {
  console.log(`\n-- 为 ${productTable.name} 表生成 DDL:`);
  console.log(`CREATE TABLE ${productTable.name} (`);
  productTable.columns.slice(0, 5).forEach((col, index) => {
    const isLast = index === Math.min(4, productTable.columns.length - 1);
    console.log(`  ${col.name} ${col.type}${col.comment ? ` -- ${col.comment}` : ''}${isLast ? '' : ','}`);
  });
  if (productTable.columns.length > 5) {
    console.log(`  ... (省略 ${productTable.columns.length - 5} 列)`);
  }
  console.log(`);`);
}

// 示例5：查找所有包含外键的表
console.log('\n【示例5】查找所有包含外键的表');
const tablesWithFK = metadataStore.getAllTables().filter(table => 
  table.columns.some(col => col.isForeignKey)
);
console.log(`找到 ${tablesWithFK.length} 个包含外键的表:`);
tablesWithFK.forEach(table => {
  const fkColumns = table.columns.filter(col => col.isForeignKey);
  console.log(`  - ${table.name}: ${fkColumns.map(col => col.name).join(', ')}`);
});

// 示例6：统计扁平化字段
console.log('\n【示例6】统计扁平化字段（来自嵌入式关系）');
let flattenedCount = 0;
metadataStore.getAllTables().forEach(table => {
  table.columns.forEach(col => {
    if (col.sourceField && col.sourceField.includes('.')) {
      flattenedCount++;
    }
  });
});
console.log(`所有表中扁平化字段总数: ${flattenedCount}`);

console.log('\n' + '='.repeat(60));
console.log('✅ 演示完成！');
console.log('='.repeat(60));

