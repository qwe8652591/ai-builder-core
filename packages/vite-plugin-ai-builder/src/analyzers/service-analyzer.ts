/**
 * Service 分析器
 * 
 * 分析 @AppService 装饰器定义的应用服务
 */

import * as ts from 'typescript';
import type { ServiceMetadata, ServiceMethod } from './types';
import { 
  parseFile, 
  hasDecorator, 
  getDecoratorArgs, 
  parseObjectLiteral,
  getClassMethods,
  visitNode,
} from './utils';

/**
 * 分析 Service 文件
 */
export function analyzeServiceFile(filePath: string, content: string): ServiceMetadata[] {
  const sourceFile = parseFile(filePath, content);
  const services: ServiceMetadata[] = [];
  
  visitNode(sourceFile, (node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      // 检查 @AppService 装饰器
      if (hasDecorator(node, 'AppService')) {
        const service = parseAppServiceClass(node, sourceFile, filePath);
        if (service) {
          services.push(service);
        }
      }
      // 检查 @Service 装饰器（领域服务）
      else if (hasDecorator(node, 'Service')) {
        const service = parseServiceClass(node, sourceFile, filePath);
        if (service) {
          services.push(service);
        }
      }
    }
  });
  
  return services;
}

/**
 * 解析 @AppService 装饰的类
 */
function parseAppServiceClass(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string
): ServiceMetadata | null {
  const className = node.name?.text;
  if (!className) return null;
  
  // 获取 @AppService 装饰器参数
  const decoratorArgs = getDecoratorArgs(node, 'AppService');
  let description: string | undefined;
  
  if (decoratorArgs.length > 0) {
    const firstArg = decoratorArgs[0];
    if (ts.isStringLiteral(firstArg)) {
      // @AppService('description') 格式
      description = firstArg.text;
    } else if (ts.isObjectLiteralExpression(firstArg)) {
      const options = parseObjectLiteral(firstArg, sourceFile);
      description = options.description as string | undefined;
    }
  }
  
  // 解析方法
  const methods = parseServiceMethods(node, sourceFile);
  
  return {
    __type: 'appService',
    name: className,
    description,
    methods,
    sourceFile: filePath,
  };
}

/**
 * 解析 @Service 装饰的类（领域服务）
 */
function parseServiceClass(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string
): ServiceMetadata | null {
  const className = node.name?.text;
  if (!className) return null;
  
  // 获取 @Service 装饰器参数
  const decoratorArgs = getDecoratorArgs(node, 'Service');
  let description: string | undefined;
  
  if (decoratorArgs.length > 0 && ts.isObjectLiteralExpression(decoratorArgs[0])) {
    const options = parseObjectLiteral(decoratorArgs[0], sourceFile);
    description = options.description as string | undefined;
  }
  
  // 解析方法
  const methods = parseServiceMethods(node, sourceFile);
  
  return {
    __type: 'service',
    name: className,
    description,
    methods,
    sourceFile: filePath,
  };
}

/**
 * 解析服务类的方法
 */
function parseServiceMethods(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile
): ServiceMethod[] {
  const methods: ServiceMethod[] = [];
  const classMethods = getClassMethods(node);
  
  for (const method of classMethods) {
    if (!ts.isIdentifier(method.name)) continue;
    
    // 跳过私有方法和构造函数
    const methodName = method.name.text;
    if (methodName.startsWith('_') || methodName === 'constructor') continue;
    
    // 检查是否有 @ServiceMethod 装饰器
    const hasMethodDecorator = hasDecorator(method, 'ServiceMethod') || 
                               hasDecorator(method, 'Method');
    
    // 只包含公开方法或有装饰器的方法
    const isPublic = !method.modifiers?.some(
      m => m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword
    );
    
    if (isPublic || hasMethodDecorator) {
      const serviceMethod = parseMethod(method, sourceFile);
      methods.push(serviceMethod);
    }
  }
  
  return methods;
}

/**
 * 解析单个方法
 */
function parseMethod(
  method: ts.MethodDeclaration,
  sourceFile: ts.SourceFile
): ServiceMethod {
  const methodName = (method.name as ts.Identifier).text;
  
  // 解析参数
  const parameters = method.parameters.map(param => {
    const paramName = ts.isIdentifier(param.name) ? param.name.text : 'unknown';
    const paramType = param.type ? param.type.getText(sourceFile) : 'unknown';
    return { name: paramName, type: paramType };
  });
  
  // 解析返回类型
  let returnType = 'void';
  if (method.type) {
    returnType = method.type.getText(sourceFile);
  }
  
  // 获取方法描述和类型标记（从装饰器）
  let description: string | undefined;
  let isQuery: boolean | undefined;
  let isCommand: boolean | undefined;
  
  if (hasDecorator(method, 'ServiceMethod') || hasDecorator(method, 'Method')) {
    const decoratorArgs = getDecoratorArgs(method, 'ServiceMethod') || 
                          getDecoratorArgs(method, 'Method');
    if (decoratorArgs.length > 0 && ts.isObjectLiteralExpression(decoratorArgs[0])) {
      const options = parseObjectLiteral(decoratorArgs[0], sourceFile);
      description = options.description as string | undefined;
      
      // 解析 query 和 command 属性
      if (options.query === true) {
        isQuery = true;
      }
      if (options.command === true) {
        isCommand = true;
      }
    }
  }
  
  return {
    name: methodName,
    description,
    parameters,
    returnType,
    isQuery,
    isCommand,
  };
}

