/**
 * 方法调用链分析器
 * 
 * 分析服务/仓储方法之间的调用关系
 */

import * as ts from 'typescript';
import type { MethodCallChain } from './types';
import { 
  parseFile, 
  hasDecorator, 
  getClassMethods,
  visitNode,
} from './utils';

/**
 * 分析文件中的方法调用链
 */
export function analyzeCallChains(filePath: string, content: string): MethodCallChain[] {
  const sourceFile = parseFile(filePath, content);
  const callChains: MethodCallChain[] = [];
  
  visitNode(sourceFile, (node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      // 检查是否是服务类
      const isService = hasDecorator(node, 'AppService') || 
                        hasDecorator(node, 'Service') ||
                        hasDecorator(node, 'Repository');
      
      if (isService) {
        const className = node.name.text;
        const classType = getClassType(node);
        
        // 获取类的依赖（从构造函数参数）
        const dependencies = parseConstructorDependencies(node, sourceFile);
        
        // 分析每个方法的调用链
        const methods = getClassMethods(node);
        for (const method of methods) {
          if (!ts.isIdentifier(method.name)) continue;
          
          const methodName = method.name.text;
          if (methodName === 'constructor' || methodName.startsWith('_')) continue;
          
          // 分析方法体中的调用
          const calls = analyzeMethodCalls(method, sourceFile, dependencies);
          
          if (calls.length > 0) {
            callChains.push({
              __type: 'methodCallChain',
              sourceClass: className,
              sourceClassType: classType,
              sourceMethod: methodName,
              calls,
              sourceFile: filePath,
            });
          }
        }
      }
    }
  });
  
  return callChains;
}

/**
 * 获取类类型
 */
function getClassType(node: ts.ClassDeclaration): 'appService' | 'service' | 'repository' {
  if (hasDecorator(node, 'AppService')) return 'appService';
  if (hasDecorator(node, 'Service')) return 'service';
  return 'repository';
}

/**
 * 解析构造函数中的依赖注入
 */
function parseConstructorDependencies(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile
): Map<string, string> {
  const dependencies = new Map<string, string>();
  
  // 查找构造函数
  for (const member of node.members) {
    if (ts.isConstructorDeclaration(member)) {
      for (const param of member.parameters) {
        if (ts.isIdentifier(param.name) && param.type) {
          const paramName = param.name.text;
          const typeName = param.type.getText(sourceFile);
          dependencies.set(paramName, typeName);
        }
      }
    }
  }
  
  // 也检查类属性
  for (const member of node.members) {
    if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
      const propName = member.name.text;
      if (member.type) {
        const typeName = member.type.getText(sourceFile);
        dependencies.set(propName, typeName);
      }
    }
  }
  
  return dependencies;
}

/**
 * 分析方法体中的调用
 */
function analyzeMethodCalls(
  method: ts.MethodDeclaration,
  sourceFile: ts.SourceFile,
  dependencies: Map<string, string>
): Array<{ targetClass: string; targetMethod: string; callType: 'service' | 'repository' | 'internal' }> {
  const calls: Array<{ targetClass: string; targetMethod: string; callType: 'service' | 'repository' | 'internal' }> = [];
  
  if (!method.body) return calls;
  
  // 遍历方法体寻找调用表达式
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callInfo = parseCallExpression(node, sourceFile, dependencies);
      if (callInfo) {
        // 避免重复
        const exists = calls.some(
          c => c.targetClass === callInfo.targetClass && c.targetMethod === callInfo.targetMethod
        );
        if (!exists) {
          calls.push(callInfo);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  
  visit(method.body);
  return calls;
}

/**
 * 解析调用表达式
 */
function parseCallExpression(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  dependencies: Map<string, string>
): { targetClass: string; targetMethod: string; callType: 'service' | 'repository' | 'internal' } | null {
  const expr = node.expression;
  
  // this.xxx.method() 格式
  if (ts.isPropertyAccessExpression(expr)) {
    const methodName = expr.name.text;
    const obj = expr.expression;
    
    // this.dependency.method()
    if (ts.isPropertyAccessExpression(obj) && ts.isThisKeyword(obj.expression)) {
      const propName = (obj.name as ts.Identifier).text;
      const targetClass = dependencies.get(propName);
      
      if (targetClass) {
        const callType = getCallType(targetClass);
        return {
          targetClass,
          targetMethod: methodName,
          callType,
        };
      }
    }
    
    // this.method() - 内部调用
    if (ts.isThisKeyword(obj)) {
      return {
        targetClass: 'self',
        targetMethod: methodName,
        callType: 'internal',
      };
    }
    
    // await this.xxx.method() - 有 await 的情况
    if (ts.isAwaitExpression(obj)) {
      // 递归处理
      return null;
    }
  }
  
  return null;
}

/**
 * 根据类名推断调用类型
 */
function getCallType(className: string): 'service' | 'repository' | 'internal' {
  const lowerName = className.toLowerCase();
  if (lowerName.includes('repository') || lowerName.includes('repo')) {
    return 'repository';
  }
  if (lowerName.includes('service')) {
    return 'service';
  }
  return 'service'; // 默认为服务
}
