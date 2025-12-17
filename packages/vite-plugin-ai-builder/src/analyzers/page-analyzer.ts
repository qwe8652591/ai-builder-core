/**
 * Page 分析器
 * 
 * 分析 definePage 定义的页面，提取组件、Hook、服务等信息
 */

import * as ts from 'typescript';
import type { PageMetadata } from './types';
import type { ServiceMethodCall } from './types';
import { 
  parseFile, 
  parseObjectLiteral,
  isCallExpression,
  visitNode,
  extractJSXComponents,
  extractJSXStructure,
  extractHookCalls,
  extractImports,
} from './utils';

/**
 * 分析 Page 文件
 */
export function analyzePageFile(filePath: string, content: string): PageMetadata[] {
  const sourceFile = parseFile(filePath, content);
  const pages: PageMetadata[] = [];
  
  // 提取 import 信息
  const imports = extractImports(sourceFile);
  
  // 找到服务导入（从 services 目录导入的）
  const services: string[] = [];
  const types: string[] = [];
  
  for (const imp of imports) {
    // 服务导入
    if (imp.from.includes('/services/') || imp.from.includes('.appservice')) {
      services.push(...imp.names.filter(n => !n.startsWith('type ')));
    }
    // 类型导入（DTO、Entity）
    if (imp.from.includes('/dto/') || imp.from.includes('/models/') || imp.from.includes('.entity') || imp.from.includes('.dto')) {
      types.push(...imp.names.filter(n => !n.startsWith('* as')));
    }
  }
  
  // 遍历查找 definePage 调用
  visitNode(sourceFile, (node) => {
    if (isCallExpression(node, 'definePage')) {
      const page = parseDefinePageCall(node, sourceFile, filePath, services, types);
      if (page) {
        pages.push(page);
      }
    }
  });
  
  return pages;
}

/**
 * 解析 definePage 调用
 */
function parseDefinePageCall(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  filePath: string,
  importedServices: string[],
  importedTypes: string[]
): PageMetadata | null {
  const args = node.arguments;
  if (args.length < 2) return null;
  
  // 第一个参数：meta 配置
  const metaArg = args[0];
  const meta = parseObjectLiteral(metaArg, sourceFile);
  
  // 第二个参数：setup 函数
  const setupArg = args[1];
  
  // 从 setup 函数中提取组件、Hook 和结构
  let components: string[] = [];
  let hooks: string[] = [];
  let serviceCalls: ServiceMethodCall[] = [];
  let structure: PageMetadata['structure'];
  
  if (ts.isArrowFunction(setupArg) || ts.isFunctionExpression(setupArg)) {
    components = extractJSXComponents(setupArg.body, sourceFile);
    hooks = extractHookCalls(setupArg.body, sourceFile);
    // 🆕 提取内容结构
    structure = extractJSXStructure(setupArg.body, sourceFile) || undefined;
    // 🆕 提取服务方法调用
    serviceCalls = extractServiceCalls(setupArg.body, sourceFile, importedServices);
  }
  
  // 解析 menu 配置
  let menu: PageMetadata['menu'];
  if (meta.menu && typeof meta.menu === 'object') {
    const menuConfig = meta.menu as Record<string, unknown>;
    menu = {
      parent: menuConfig.parent as string | undefined,
      order: menuConfig.order as number | undefined,
      icon: menuConfig.icon as string | undefined,
    };
  }
  
  return {
    __type: 'page',
    name: (meta.title as string) || 'AnonymousPage',
    route: meta.route as string | undefined,
    permission: meta.permission as string | undefined,
    description: meta.description as string | undefined,
    menu,
    components,
    hooks,
    services: importedServices,
    serviceCalls,
    types: importedTypes,
    structure,
    sourceFile: filePath,
  };
}

/**
 * 提取服务方法调用
 * 
 * 识别模式：
 * - ServiceName.methodName(...)
 * - await ServiceName.methodName(...)
 */
function extractServiceCalls(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  importedServices: string[]
): ServiceMethodCall[] {
  const calls: ServiceMethodCall[] = [];
  const seen = new Set<string>(); // 去重
  
  function visit(n: ts.Node) {
    // 查找调用表达式
    if (ts.isCallExpression(n)) {
      const expr = n.expression;
      
      // 检查是否为 Service.method() 形式
      if (ts.isPropertyAccessExpression(expr)) {
        const objectExpr = expr.expression;
        const methodName = expr.name.getText(sourceFile);
        
        // 获取对象名称
        let serviceName: string | null = null;
        
        if (ts.isIdentifier(objectExpr)) {
          serviceName = objectExpr.getText(sourceFile);
        }
        
        // 检查是否为已导入的服务
        if (serviceName && importedServices.includes(serviceName)) {
          const key = `${serviceName}.${methodName}`;
          if (!seen.has(key)) {
            seen.add(key);
            
            // 获取行号
            const { line } = sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile));
            
            calls.push({
              service: serviceName,
              method: methodName,
              line: line + 1, // 转为 1-based
            });
          }
        }
      }
    }
    
    ts.forEachChild(n, visit);
  }
  
  visit(node);
  return calls;
}

