/**
 * Enum 分析器
 * 
 * 分析 defineTypedEnum 定义的枚举
 */

import * as ts from 'typescript';
import type { EnumMetadata, EnumValue } from './types';
import { 
  parseFile, 
  parseObjectLiteral,
  isCallExpression,
  visitNode,
} from './utils';

/**
 * 分析文件中的枚举定义
 */
export function analyzeEnumDefinitions(filePath: string, content: string): EnumMetadata[] {
  const sourceFile = parseFile(filePath, content);
  const enums: EnumMetadata[] = [];
  
  // 遍历查找 defineTypedEnum 调用
  visitNode(sourceFile, (node) => {
    if (isCallExpression(node, 'defineTypedEnum')) {
      const enumDef = parseDefineTypedEnumCall(node, sourceFile, filePath);
      if (enumDef) {
        enums.push(enumDef);
      }
    }
  });
  
  return enums;
}

/**
 * 解析 defineTypedEnum 调用
 */
function parseDefineTypedEnumCall(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  filePath: string
): EnumMetadata | null {
  const args = node.arguments;
  if (args.length === 0) return null;
  
  // 配置对象
  const configArg = args[0];
  if (!ts.isObjectLiteralExpression(configArg)) return null;
  
  const config = parseObjectLiteral(configArg, sourceFile);
  
  const name = config.name as string;
  if (!name) return null;
  
  // 解析 values
  const values: EnumValue[] = [];
  if (config.values && typeof config.values === 'object') {
    const valuesObj = config.values as Record<string, string>;
    for (const [key, label] of Object.entries(valuesObj)) {
      values.push({
        value: key,
        label: label as string,
      });
    }
  }
  
  return {
    __type: 'enum',
    name,
    comment: config.comment as string | undefined,
    values,
    sourceFile: filePath,
  };
}

