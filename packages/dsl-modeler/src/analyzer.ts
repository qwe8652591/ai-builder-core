/**
 * 项目分析器
 * 
 * 使用 vite-plugin-ai-builder 的 AST 分析能力获取元数据
 * 支持：
 * - 内置元数据类型（通过 AST 分析）
 * - 自定义元数据类型（通过 dsl-core metadataStore）
 * - 派生元数据类型（通过 dsl-core 派生计算）
 */

import type { ASTMetadata, DynamicTypeConfig, CustomMetadata } from './types.js';

// 重新导出 vite-plugin-ai-builder 的分析能力
export { analyzeProject, analyzeFile, toRuntimeMetadata } from '@qwe8652591/vite-plugin';
export type { AnalyzerResult } from '@qwe8652591/vite-plugin';

/**
 * 分析项目元数据（便捷包装函数）
 * 
 * @param projectPath 项目路径
 * @returns AST 元数据
 */
export async function analyzeProjectMetadata(projectPath: string): Promise<ASTMetadata> {
  const { analyzeProject } = await import('@qwe8652591/vite-plugin');
  const result = await analyzeProject(projectPath);
  return result as unknown as ASTMetadata;
}

/**
 * 从 dsl-core metadataStore 获取所有已注册的类型配置
 * 
 * @returns 动态类型配置列表
 */
export async function getDynamicTypeConfigs(): Promise<DynamicTypeConfig[]> {
  try {
    const { getAllDSLTypes, getDSLTypeConfig } = await import('@qwe8652591/dsl-core');
    const allTypes = getAllDSLTypes();
    
    // 过滤出自定义和派生类型（排除内置类型）
    const builtinTypes = [
      'entity', 'valueObject', 'aggregate', 'event', 'enum',
      'dto', 'appService', 'service', 'repository',
      'page', 'component', 'hook',
      'extension'
    ];
    
    const dynamicTypes: DynamicTypeConfig[] = [];
    
    for (const type of allTypes) {
      if (builtinTypes.includes(type)) continue;
      
      const config = getDSLTypeConfig(type);
      if (config) {
        dynamicTypes.push({
          type,
          layer: config.layer || 'custom',
          subLayer: config.subLayer,
          label: config.label || type,
          icon: config.icon || '📦',
          isDerived: !!config.derivedFrom && config.derivedFrom.length > 0,
          derivedFrom: config.derivedFrom,
        });
      }
    }
    
    return dynamicTypes;
  } catch (e) {
    console.warn('[dsl-modeler] Failed to get dynamic types from dsl-core:', e);
    return [];
  }
}

/**
 * 从 dsl-core metadataStore 获取所有自定义和派生元数据
 * 
 * @returns 扩展的 AST 元数据（包含自定义和派生类型）
 */
export async function getExtendedMetadata(): Promise<Record<string, CustomMetadata[]>> {
  try {
    const { metadataStore, getAllDSLTypes } = await import('@qwe8652591/dsl-core');
    
    const builtinTypes = [
      'entity', 'valueObject', 'aggregate', 'event', 'enum',
      'dto', 'appService', 'service', 'repository',
      'page', 'component', 'hook',
      'extension'
    ];
    
    const allTypes = getAllDSLTypes();
    const result: Record<string, CustomMetadata[]> = {};
    
    for (const type of allTypes) {
      if (builtinTypes.includes(type)) continue;
      
      const items = metadataStore.getByType(type);
      if (items.length > 0) {
        result[type] = items.map(item => ({
          ...item.definition as Record<string, unknown>,
          __type: type,
          name: item.name,
        })) as CustomMetadata[];
      }
    }
    
    return result;
  } catch (e) {
    console.warn('[dsl-modeler] Failed to get extended metadata from dsl-core:', e);
    return {};
  }
}

/**
 * 获取完整元数据（合并 AST 分析结果和运行时元数据）
 * 
 * @param projectPath 项目路径
 * @returns 完整的元数据（内置 + 自定义 + 派生）
 */
export async function getFullMetadata(projectPath: string): Promise<ASTMetadata> {
  // 获取 AST 分析的内置类型元数据
  const astMetadata = await analyzeProjectMetadata(projectPath);
  
  // 获取运行时的自定义和派生元数据
  const extendedMetadata = await getExtendedMetadata();
  
  // 合并
  return {
    ...astMetadata,
    ...extendedMetadata,
  };
}

