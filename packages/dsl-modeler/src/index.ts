/**
 * @qwe8652591/dsl-modeler
 * 
 * DSL Modeler - 元数据建模工作台
 * 
 * 提供元数据浏览、查看、编辑（未来）和设计（未来）能力
 * 
 * 支持：
 * - 内置元数据类型（entity, enum, dto, page, component, service, extension）
 * - 自定义元数据类型（通过 registerDSLType 注册）
 * - 派生元数据类型（如 entityRelation, serviceDependency, pageRoute）
 */

// 类型导出
export * from './types';

// 组件导出
export {
  // Explorer
  MetadataTree,
  
  // Viewers
  EntityViewer,
  DTOViewer,
  EnumViewer,
  PageViewer,
  ComponentViewer,
  ServiceViewer,
  ExtensionViewer,
  GenericViewer,
  
  // Panel
  PropertyPanel,
  
  // Workbench
  ModelerWorkbench,
} from './components';

// 分析器导出
export {
  analyzeProject,
  analyzeFile,
  toRuntimeMetadata,
  analyzeProjectMetadata,
  getDynamicTypeConfigs,
  getExtendedMetadata,
  getFullMetadata,
} from './analyzer';
export type { AnalyzerResult } from './analyzer';

// 默认导出 Workbench
export { ModelerWorkbench as default } from './components';

