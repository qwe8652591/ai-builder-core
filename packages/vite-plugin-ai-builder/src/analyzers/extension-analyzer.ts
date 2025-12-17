/**
 * Extension 分析器
 * 
 * 分析 defineExtension 和 registerExtension 定义的扩展
 */

import * as ts from 'typescript';
import type { ExtensionMetadata, ExtensionMember } from './types';
import { 
  parseFile, 
  parseObjectLiteral,
  isCallExpression,
  visitNode,
} from './utils';

/**
 * 分析 Extension 文件
 */
export function analyzeExtensionFile(filePath: string, content: string): ExtensionMetadata[] {
  const sourceFile = parseFile(filePath, content);
  const extensions: ExtensionMetadata[] = [];
  
  // 遍历查找 defineExtension 和 registerExtension 调用
  visitNode(sourceFile, (node) => {
    // 支持 defineExtension（方法扩展）
    if (isCallExpression(node, 'defineExtension')) {
      const extension = parseDefineExtensionCall(node, sourceFile, filePath);
      if (extension) {
        extensions.push(extension);
      }
    }
    
    // 支持 registerExtension（元数据扩展）
    if (isCallExpression(node, 'registerExtension')) {
      const extension = parseRegisterExtensionCall(node, sourceFile, filePath);
      if (extension) {
        extensions.push(extension);
      }
    }
  });
  
  return extensions;
}

/**
 * 解析 defineExtension 调用
 */
function parseDefineExtensionCall(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  filePath: string
): ExtensionMetadata | null {
  const args = node.arguments;
  if (args.length === 0) return null;
  
  // 配置对象
  const configArg = args[0];
  if (!ts.isObjectLiteralExpression(configArg)) return null;
  
  let name = '';
  let description: string | undefined;
  let target = '';
  const members: ExtensionMember[] = [];
  
  for (const prop of configArg.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    
    const propName = prop.name.text;
    
    // name 属性
    if (propName === 'name' && ts.isStringLiteral(prop.initializer)) {
      name = prop.initializer.text;
    }
    
    // description 属性
    if (propName === 'description' && ts.isStringLiteral(prop.initializer)) {
      description = prop.initializer.text;
    }
    
    // target 属性（目标类）
    if (propName === 'target' && ts.isIdentifier(prop.initializer)) {
      target = prop.initializer.text;
    }
    
    // methods 属性
    if (propName === 'methods' && ts.isObjectLiteralExpression(prop.initializer)) {
      for (const methodProp of prop.initializer.properties) {
        if (ts.isPropertyAssignment(methodProp) && ts.isIdentifier(methodProp.name)) {
          const methodName = methodProp.name.text;
          const member = parseMethodConfig(methodProp.initializer, methodName, sourceFile);
          members.push(member);
        }
      }
    }
  }
  
  if (!name || !target) return null;
  
  return {
    __type: 'extension',
    name,
    description,
    target,
    type: 'method',
    members,
    sourceFile: filePath,
  };
}

/**
 * 解析方法配置
 */
function parseMethodConfig(
  node: ts.Expression,
  methodName: string,
  sourceFile: ts.SourceFile
): ExtensionMember {
  const member: ExtensionMember = {
    name: methodName,
  };
  
  if (ts.isObjectLiteralExpression(node)) {
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
      
      const propName = prop.name.text;
      
      if (propName === 'description' && ts.isStringLiteral(prop.initializer)) {
        member.description = prop.initializer.text;
      }
      
      if (propName === 'returnType' && ts.isStringLiteral(prop.initializer)) {
        member.returnType = prop.initializer.text;
      }
    }
  }
  
  return member;
}

/**
 * 解析 registerExtension 调用（元数据扩展）
 * 
 * 支持两种形式：
 * 1. registerExtension({ name, description, target, members: [...] })
 * 2. registerExtension(variableName) - 引用变量
 */
function parseRegisterExtensionCall(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  filePath: string
): ExtensionMetadata | null {
  const args = node.arguments;
  if (args.length === 0) return null;
  
  const configArg = args[0];
  
  // 如果是标识符（引用变量），尝试查找变量定义
  if (ts.isIdentifier(configArg)) {
    const varName = configArg.text;
    const varDef = findVariableDefinition(sourceFile, varName);
    if (varDef && ts.isObjectLiteralExpression(varDef)) {
      return parseExtensionConfig(varDef, filePath);
    }
    return null;
  }
  
  // 直接是对象字面量
  if (ts.isObjectLiteralExpression(configArg)) {
    return parseExtensionConfig(configArg, filePath);
  }
  
  return null;
}

/**
 * 查找变量定义
 */
function findVariableDefinition(sourceFile: ts.SourceFile, varName: string): ts.Expression | null {
  let result: ts.Expression | null = null;
  
  visitNode(sourceFile, (node) => {
    if (ts.isVariableDeclaration(node) && 
        ts.isIdentifier(node.name) && 
        node.name.text === varName &&
        node.initializer) {
      result = node.initializer;
    }
  });
  
  return result;
}

/**
 * 解析扩展配置对象
 */
function parseExtensionConfig(
  configObj: ts.ObjectLiteralExpression,
  filePath: string
): ExtensionMetadata | null {
  let name = '';
  let description: string | undefined;
  let target = '';
  let type: string = 'metadata';
  const members: ExtensionMember[] = [];
  
  for (const prop of configObj.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    
    const propName = prop.name.text;
    
    // name 属性
    if (propName === 'name' && ts.isStringLiteral(prop.initializer)) {
      name = prop.initializer.text;
    }
    
    // description 属性
    if (propName === 'description' && ts.isStringLiteral(prop.initializer)) {
      description = prop.initializer.text;
    }
    
    // target 属性
    if (propName === 'target') {
      if (ts.isStringLiteral(prop.initializer)) {
        target = prop.initializer.text;
      } else if (ts.isIdentifier(prop.initializer)) {
        target = prop.initializer.text;
      }
    }
    
    // type 属性
    if (propName === 'type') {
      if (ts.isStringLiteral(prop.initializer)) {
        type = prop.initializer.text;
      } else if (ts.isAsExpression(prop.initializer) && ts.isStringLiteral(prop.initializer.expression)) {
        type = prop.initializer.expression.text;
      }
    }
    
    // members 属性（数组形式）
    if (propName === 'members' && ts.isArrayLiteralExpression(prop.initializer)) {
      for (const element of prop.initializer.elements) {
        if (ts.isObjectLiteralExpression(element)) {
          const member = parseMemberObject(element);
          if (member) members.push(member);
        }
      }
    }
  }
  
  if (!name) return null;
  
  return {
    __type: 'extension',
    name,
    description,
    target,
    type,
    members,
    sourceFile: filePath,
  };
}

/**
 * 解析 member 对象
 */
function parseMemberObject(obj: ts.ObjectLiteralExpression): ExtensionMember | null {
  let name = '';
  let description: string | undefined;
  let returnType: string | undefined;
  
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    
    const propName = prop.name.text;
    
    if (propName === 'name' && ts.isStringLiteral(prop.initializer)) {
      name = prop.initializer.text;
    }
    if (propName === 'description' && ts.isStringLiteral(prop.initializer)) {
      description = prop.initializer.text;
    }
    if (propName === 'returnType' && ts.isStringLiteral(prop.initializer)) {
      returnType = prop.initializer.text;
    }
  }
  
  if (!name) return null;
  
  return { name, description, returnType };
}

