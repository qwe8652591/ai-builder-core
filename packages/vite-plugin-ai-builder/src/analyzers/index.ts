/**
 * AST 分析器入口
 * 
 * 统一分析项目中的所有 DSL 定义
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { AnalyzerResult, EntityMetadata, ExtensionRef } from './types';
import { analyzeEntityFile } from './entity-analyzer';
import { analyzeDTOFile } from './dto-analyzer';
import { analyzePageFile } from './page-analyzer';
import { analyzeComponentFile } from './component-analyzer';
import { analyzeServiceFile } from './service-analyzer';
import { analyzeExtensionFile } from './extension-analyzer';
import { analyzeEnumDefinitions } from './enum-analyzer';
import { analyzeCallChains } from './call-chain-analyzer';

// 导出类型
export * from './types';

/**
 * 分析整个项目
 */
export async function analyzeProject(projectRoot: string): Promise<AnalyzerResult> {
  const startTime = Date.now();
  let fileCount = 0;
  
  // 查找所有 DSL 相关文件
  const dslDir = path.join(projectRoot, 'src/dsl');
  
  // 如果 dsl 目录不存在，尝试 src 目录
  const searchDir = fs.existsSync(dslDir) ? dslDir : path.join(projectRoot, 'src');
  
  if (!fs.existsSync(searchDir)) {
    console.warn(`[AST Analyzer] 未找到源码目录: ${searchDir}`);
    return createEmptyResult();
  }
  
  // 使用 glob 查找文件
  const patterns = {
    entities: '**/*.entity.ts',
    dtos: '**/*.dto.ts',
    pages: '**/*.page.tsx',
    components: '**/*.component.tsx',
    services: '**/*.{appservice,service}.ts',  // 匹配 AppService 和 Service
    extensions: '**/*.ext.ts',
  };
  
  const result: AnalyzerResult = {
    entities: [],
    dtos: [],
    enums: [],
    pages: [],
    components: [],
    services: [],
    extensions: [],
    callChains: [],
    analyzedAt: new Date().toISOString(),
    fileCount: 0,
  };
  
  // 分析 Entity 文件
  const entityFiles = await glob(patterns.entities, { cwd: searchDir, absolute: true });
  for (const filePath of entityFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entities = analyzeEntityFile(filePath, content);
      result.entities.push(...entities);
      
      // 同时提取枚举定义
      const enums = analyzeEnumDefinitions(filePath, content);
      result.enums.push(...enums);
      
      fileCount++;
    } catch (e) {
      console.warn(`[AST Analyzer] 分析失败: ${filePath}`, e);
    }
  }
  
  // 分析 DTO 文件
  const dtoFiles = await glob(patterns.dtos, { cwd: searchDir, absolute: true });
  for (const filePath of dtoFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const dtos = analyzeDTOFile(filePath, content);
      result.dtos.push(...dtos);
      fileCount++;
    } catch (e) {
      console.warn(`[AST Analyzer] 分析失败: ${filePath}`, e);
    }
  }
  
  // 分析 Page 文件
  const pageFiles = await glob(patterns.pages, { cwd: searchDir, absolute: true });
  for (const filePath of pageFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const pages = analyzePageFile(filePath, content);
      result.pages.push(...pages);
      fileCount++;
    } catch (e) {
      console.warn(`[AST Analyzer] 分析失败: ${filePath}`, e);
    }
  }
  
  // 分析 Component 文件
  const componentFiles = await glob(patterns.components, { cwd: searchDir, absolute: true });
  for (const filePath of componentFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const components = analyzeComponentFile(filePath, content);
      result.components.push(...components);
      fileCount++;
    } catch (e) {
      console.warn(`[AST Analyzer] 分析失败: ${filePath}`, e);
    }
  }
  
  // 分析 Service 文件
  const serviceFiles = await glob(patterns.services, { cwd: searchDir, absolute: true });
  for (const filePath of serviceFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const services = analyzeServiceFile(filePath, content);
      result.services.push(...services);
      
      // 分析方法调用链
      const callChains = analyzeCallChains(filePath, content);
      result.callChains.push(...callChains);
      
      fileCount++;
    } catch (e) {
      console.warn(`[AST Analyzer] 分析失败: ${filePath}`, e);
    }
  }
  
  // 分析 Extension 文件
  const extensionFiles = await glob(patterns.extensions, { cwd: searchDir, absolute: true });
  for (const filePath of extensionFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const extensions = analyzeExtensionFile(filePath, content);
      result.extensions.push(...extensions);
      fileCount++;
    } catch (e) {
      console.warn(`[AST Analyzer] 分析失败: ${filePath}`, e);
    }
  }
  
  // 关联 Extension 到 Entity
  linkExtensionsToEntities(result);
  
  result.fileCount = fileCount;
  
  const elapsed = Date.now() - startTime;
  console.log(`[AST Analyzer] 分析完成: ${fileCount} 个文件, ${elapsed}ms`);
  console.log(`  - Entities: ${result.entities.length}`);
  console.log(`  - DTOs: ${result.dtos.length}`);
  console.log(`  - Enums: ${result.enums.length}`);
  console.log(`  - Pages: ${result.pages.length}`);
  console.log(`  - Components: ${result.components.length}`);
  console.log(`  - Services: ${result.services.length}`);
  console.log(`  - Extensions: ${result.extensions.length}`);
  console.log(`  - Call Chains: ${result.callChains.length}`);
  
  return result;
}

/**
 * 分析单个文件
 */
export function analyzeFile(filePath: string, content: string): Partial<AnalyzerResult> {
  const result: Partial<AnalyzerResult> = {};
  
  if (filePath.endsWith('.entity.ts')) {
    result.entities = analyzeEntityFile(filePath, content);
    result.enums = analyzeEnumDefinitions(filePath, content);
  } else if (filePath.endsWith('.dto.ts')) {
    result.dtos = analyzeDTOFile(filePath, content);
  } else if (filePath.endsWith('.page.tsx')) {
    result.pages = analyzePageFile(filePath, content);
  } else if (filePath.endsWith('.component.tsx')) {
    result.components = analyzeComponentFile(filePath, content);
  } else if (filePath.endsWith('.appservice.ts') || filePath.endsWith('.service.ts')) {
    result.services = analyzeServiceFile(filePath, content);
  } else if (filePath.endsWith('.ext.ts')) {
    result.extensions = analyzeExtensionFile(filePath, content);
  }
  
  return result;
}

/**
 * 将 Extension 关联到对应的 Entity
 */
function linkExtensionsToEntities(result: AnalyzerResult): void {
  for (const extension of result.extensions) {
    const entity = result.entities.find(e => e.name === extension.target);
    if (entity) {
      if (!entity.extensions) {
        entity.extensions = [];
      }
      const extRef: ExtensionRef = {
        name: extension.name,
        methods: extension.members.map(m => m.name),
      };
      entity.extensions.push(extRef);
    }
  }
}

/**
 * 创建空结果
 */
function createEmptyResult(): AnalyzerResult {
  return {
    entities: [],
    dtos: [],
    enums: [],
    pages: [],
    components: [],
    services: [],
    extensions: [],
    callChains: [],
    analyzedAt: new Date().toISOString(),
    fileCount: 0,
  };
}

/**
 * 将分析结果转换为运行时 Metadata Store 格式
 */
export function toRuntimeMetadata(result: AnalyzerResult): Record<string, unknown>[] {
  const metadata: Record<string, unknown>[] = [];
  
  // 转换 Entity
  for (const entity of result.entities) {
    metadata.push({
      __type: 'entity',
      name: entity.name,
      table: entity.table,
      comment: entity.comment,
      fields: entity.fields,
      extensions: entity.extensions,
    });
  }
  
  // 转换 DTO
  for (const dto of result.dtos) {
    metadata.push({
      __type: 'dto',
      name: dto.name,
      comment: dto.comment,
      pagination: dto.pagination,
      fields: dto.fields,
    });
  }
  
  // 转换 Enum
  for (const enumDef of result.enums) {
    metadata.push({
      __type: 'enum',
      name: enumDef.name,
      comment: enumDef.comment,
      values: enumDef.values,
    });
  }
  
  // 转换 Page
  for (const page of result.pages) {
    metadata.push({
      __type: 'page',
      name: page.name,
      route: page.route,
      permission: page.permission,
      description: page.description,
      menu: page.menu,
      components: page.components,
      hooks: page.hooks,
      services: page.services,
      types: page.types,
    });
  }
  
  // 转换 Component
  for (const component of result.components) {
    metadata.push({
      __type: 'component',
      name: component.name,
      description: component.description,
      category: component.category,
      props: component.props,
      usedComponents: component.usedComponents,
    });
  }
  
  // 转换 Service
  for (const service of result.services) {
    metadata.push({
      __type: service.__type,
      name: service.name,
      description: service.description,
      methods: service.methods,
    });
  }
  
  // 转换 Extension
  for (const extension of result.extensions) {
    metadata.push({
      __type: 'extension',
      name: extension.name,
      description: extension.description,
      target: extension.target,
      type: extension.type,
      members: extension.members,
    });
  }
  
  // 转换 Call Chain
  for (const callChain of result.callChains) {
    metadata.push({
      __type: 'methodCallChain',
      sourceClass: callChain.sourceClass,
      sourceClassType: callChain.sourceClassType,
      sourceMethod: callChain.sourceMethod,
      calls: callChain.calls,
    });
  }
  
  return metadata;
}

