#!/usr/bin/env node
/**
 * Kysely Schema 生成 CLI 工具
 * 
 * 用法：
 * node generate-kysely-schema.js --entities PurchaseOrder,Supplier --output ./src/infrastructure/database/kysely-schema.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateKyselySchema } from '../utils/kysely-schema-generator';

function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  let entities: string[] = [];
  let outputPath = './kysely-schema.ts';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--entities' && i + 1 < args.length) {
      entities = args[i + 1].split(',').map(e => e.trim());
      i++;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[i + 1];
      i++;
    }
  }

  if (entities.length === 0) {
    console.error('错误：请指定要生成的实体，例如：--entities PurchaseOrder,Supplier');
    process.exit(1);
  }

  try {
    // 生成 Schema 内容
    const schemaContent = generateKyselySchema(entities);
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入文件
    fs.writeFileSync(outputPath, schemaContent, 'utf-8');
    
    console.log(`✅ Kysely Schema 已生成：${outputPath}`);
  } catch (error) {
    console.error('❌ 生成失败：', error);
    process.exit(1);
  }
}

main();

