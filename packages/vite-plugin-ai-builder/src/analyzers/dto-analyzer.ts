/**
 * DTO 分析器
 * 
 * 分析 @DTO 装饰器定义的数据传输对象
 */

import * as ts from 'typescript';
import type { DTOMetadata, FieldDefinition } from './types';
import { 
  parseFile, 
  hasDecorator, 
  getDecoratorArgs, 
  parseObjectLiteral,
  getClassProperties,
  visitNode,
} from './utils';

/**
 * 分析 DTO 文件
 */
export function analyzeDTOFile(filePath: string, content: string): DTOMetadata[] {
  const sourceFile = parseFile(filePath, content);
  const dtos: DTOMetadata[] = [];
  
  visitNode(sourceFile, (node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      // 检查 @DTO 装饰器
      if (hasDecorator(node, 'DTO')) {
        const dto = parseDTOClass(node, sourceFile, filePath);
        if (dto) {
          dtos.push(dto);
        }
      }
    }
  });
  
  return dtos;
}

/**
 * 解析 @DTO 装饰的类
 */
function parseDTOClass(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string
): DTOMetadata | null {
  const className = node.name?.text;
  if (!className) return null;
  
  // 获取 @DTO 装饰器参数
  const decoratorArgs = getDecoratorArgs(node, 'DTO');
  let comment: string | undefined;
  let pagination = false;
  
  if (decoratorArgs.length > 0 && ts.isObjectLiteralExpression(decoratorArgs[0])) {
    const options = parseObjectLiteral(decoratorArgs[0], sourceFile);
    comment = options.comment as string | undefined;
    pagination = (options.pagination as boolean) || false;
  }
  
  // 解析字段
  const fields = parseDTOFields(node, sourceFile);
  
  return {
    __type: 'dto',
    name: className,
    comment,
    pagination,
    fields,
    sourceFile: filePath,
  };
}

/**
 * 解析 DTO 的字段（@Field, @Computed 等）
 */
function parseDTOFields(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile
): Record<string, FieldDefinition> {
  const fields: Record<string, FieldDefinition> = {};
  const properties = getClassProperties(node);
  
  for (const prop of properties) {
    if (!ts.isIdentifier(prop.name)) continue;
    const fieldName = prop.name.text;
    
    // 检查 @Field 装饰器
    if (hasDecorator(prop, 'Field')) {
      const field = parseFieldDecorator(prop, fieldName, sourceFile);
      if (field) {
        fields[fieldName] = field;
      }
    }
    // 检查 @Computed 装饰器
    else if (hasDecorator(prop, 'Computed')) {
      const field = parseComputedField(prop, fieldName, sourceFile);
      if (field) {
        fields[fieldName] = field;
      }
    }
    // 检查 @Permission 装饰器（权限字段）
    else if (hasDecorator(prop, 'Permission')) {
      const field = parsePermissionField(prop, fieldName, sourceFile);
      if (field) {
        fields[fieldName] = field;
      }
    }
  }
  
  return fields;
}

/**
 * 解析 @Field 装饰的字段
 */
function parseFieldDecorator(
  prop: ts.PropertyDeclaration,
  fieldName: string,
  sourceFile: ts.SourceFile
): FieldDefinition | null {
  const decoratorArgs = getDecoratorArgs(prop, 'Field');
  if (decoratorArgs.length === 0) return null;
  
  const options = parseObjectLiteral(decoratorArgs[0], sourceFile);
  
  // 解析 type
  let type = 'STRING';
  if (options.type) {
    const typeStr = String(options.type);
    if (typeStr.includes('.')) {
      type = typeStr.split('.').pop() || 'STRING';
    } else {
      type = typeStr;
    }
  }
  
  return {
    name: fieldName,
    type,
    label: (options.label as string) || fieldName,
    required: options.required as boolean | undefined,
    default: options.default,
  };
}

/**
 * 解析 @Computed 装饰的字段（计算字段）
 */
function parseComputedField(
  prop: ts.PropertyDeclaration,
  fieldName: string,
  sourceFile: ts.SourceFile
): FieldDefinition | null {
  const decoratorArgs = getDecoratorArgs(prop, 'Computed');
  
  let label = fieldName;
  let description: string | undefined;
  
  if (decoratorArgs.length > 0 && ts.isObjectLiteralExpression(decoratorArgs[0])) {
    const options = parseObjectLiteral(decoratorArgs[0], sourceFile);
    label = (options.label as string) || fieldName;
    description = options.description as string | undefined;
  }
  
  return {
    name: fieldName,
    type: 'COMPUTED',
    label,
  };
}

/**
 * 解析 @Permission 装饰的字段（权限字段）
 */
function parsePermissionField(
  prop: ts.PropertyDeclaration,
  fieldName: string,
  sourceFile: ts.SourceFile
): FieldDefinition | null {
  const decoratorArgs = getDecoratorArgs(prop, 'Permission');
  
  let label = fieldName;
  
  if (decoratorArgs.length > 0 && ts.isObjectLiteralExpression(decoratorArgs[0])) {
    const options = parseObjectLiteral(decoratorArgs[0], sourceFile);
    label = (options.label as string) || fieldName;
  }
  
  return {
    name: fieldName,
    type: 'PERMISSION',
    label,
  };
}

