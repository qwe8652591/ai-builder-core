/**
 * 检查 schema 文件是否与 model 文件同步
 * 用于 pre-commit hook 或 CI 检查
 */

import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

function checkSchemaSync() {
  const domainDir = path.join(__dirname, '../src/domain');
  const modelFiles = globSync('**/*.model.ts', { cwd: domainDir });
  
  let hasOutdated = false;
  
  modelFiles.forEach(modelFile => {
    const modelPath = path.join(domainDir, modelFile);
    const schemaFile = modelFile.replace('.model.ts', '.schema.ts');
    const schemaPath = path.join(domainDir, schemaFile);
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ 缺失 schema 文件: ${schemaFile}`);
      hasOutdated = true;
      return;
    }
    
    const modelStat = fs.statSync(modelPath);
    const schemaStat = fs.statSync(schemaPath);
    
    if (modelStat.mtime > schemaStat.mtime) {
      console.error(`❌ Schema 文件过期: ${schemaFile}`);
      console.error(`   Model 修改时间: ${modelStat.mtime.toISOString()}`);
      console.error(`   Schema 修改时间: ${schemaStat.mtime.toISOString()}`);
      hasOutdated = true;
    }
  });
  
  if (hasOutdated) {
    console.error('\n💡 请运行: pnpm gen:kysely:model\n');
    process.exit(1);
  } else {
    console.log('✅ 所有 schema 文件都是最新的');
  }
}

checkSchemaSync();

