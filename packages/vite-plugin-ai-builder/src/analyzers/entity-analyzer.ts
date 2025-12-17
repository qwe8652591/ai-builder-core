/**
 * Entity 分析器
 * 
 * 分析 @Entity、@Embeddable 装饰器定义的实体
 */

import * as ts from 'typescript';
import type { EntityMetadata, FieldDefinition } from './types';
import { 
  parseFile, 
  hasDecorator, 
  getDecoratorArgs, 
  parseObjectLiteral,
  parseExpression,
  getClassProperties,
  visitNode,
} from './utils';

/**
 * 分析 Entity 文件
 */
export function analyzeEntityFile(filePath: string, content: string): EntityMetadata[] {
  const sourceFile = parseFile(filePath, content);
  const entities: EntityMetadata[] = [];
  
  visitNode(sourceFile, (node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      // 检查 @Entity 装饰器
      if (hasDecorator(node, 'Entity')) {
        const entity = parseEntityClass(node, sourceFile, filePath);
        if (entity) {
          entities.push(entity);
        }
      }
      // 检查 @Embeddable 装饰器（嵌入对象）
      else if (hasDecorator(node, 'Embeddable')) {
        const entity = parseEmbeddableClass(node, sourceFile, filePath);
        if (entity) {
          entities.push(entity);
        }
      }
    }
  });
  
  return entities;
}

/**
 * 解析 @Entity 装饰的类
 */
function parseEntityClass(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string
): EntityMetadata | null {
  const className = node.name?.text;
  if (!className) return null;
  
  // 获取 @Entity 装饰器参数
  const decoratorArgs = getDecoratorArgs(node, 'Entity');
  let table = className.toLowerCase() + 's';
  let comment: string | undefined;
  
  if (decoratorArgs.length > 0) {
    const firstArg = decoratorArgs[0];
    if (ts.isStringLiteral(firstArg)) {
      table = firstArg.text;
    } else if (ts.isObjectLiteralExpression(firstArg)) {
      const options = parseObjectLiteral(firstArg, sourceFile);
      table = (options.table as string) || table;
      comment = options.comment as string | undefined;
    }
  }
  
  // 解析字段
  const fields = parseClassFields(node, sourceFile);
  
  return {
    __type: 'entity',
    name: className,
    table,
    comment,
    fields,
    extensions: [],
    sourceFile: filePath,
  };
}

/**
 * 解析 @Embeddable 装饰的类（嵌入对象/值对象）
 */
function parseEmbeddableClass(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string
): EntityMetadata | null {
  const className = node.name?.text;
  if (!className) return null;
  
  // 获取 @Embeddable 装饰器参数
  const decoratorArgs = getDecoratorArgs(node, 'Embeddable');
  let comment: string | undefined;
  
  if (decoratorArgs.length > 0 && ts.isObjectLiteralExpression(decoratorArgs[0])) {
    const options = parseObjectLiteral(decoratorArgs[0], sourceFile);
    comment = options.comment as string | undefined;
  }
  
  // 解析字段
  const fields = parseClassFields(node, sourceFile);
  
  return {
    __type: 'entity', // 嵌入对象也归类为 entity
    name: className,
    comment,
    fields,
    extensions: [],
    sourceFile: filePath,
  };
}

/**
 * 解析类的字段（@Column, @PrimaryKey, @OneToMany 等）
 */
function parseClassFields(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile
): Record<string, FieldDefinition> {
  const fields: Record<string, FieldDefinition> = {};
  const properties = getClassProperties(node);
  
  for (const prop of properties) {
    if (!ts.isIdentifier(prop.name)) continue;
    const fieldName = prop.name.text;
    
    // 检查 @Column 装饰器
    if (hasDecorator(prop, 'Column')) {
      const field = parseColumnField(prop, fieldName, sourceFile);
      if (field) {
        // 检查是否有 @PrimaryKey
        field.primaryKey = hasDecorator(prop, 'PrimaryKey');
        fields[fieldName] = field;
      }
    }
    // 检查 @Embedded 装饰器（嵌入对象引用）
    else if (hasDecorator(prop, 'Embedded')) {
      const field = parseEmbeddedField(prop, fieldName, sourceFile);
      if (field) {
        fields[fieldName] = field;
      }
    }
    // 检查 @OneToMany 装饰器
    else if (hasDecorator(prop, 'OneToMany')) {
      const field = parseRelationField(prop, fieldName, 'OneToMany', sourceFile);
      if (field) {
        fields[fieldName] = field;
      }
    }
    // 检查 @ManyToOne 装饰器
    else if (hasDecorator(prop, 'ManyToOne')) {
      const field = parseRelationField(prop, fieldName, 'ManyToOne', sourceFile);
      if (field) {
        fields[fieldName] = field;
      }
    }
  }
  
  return fields;
}

/**
 * 解析 @Column 装饰的字段
 */
function parseColumnField(
  prop: ts.PropertyDeclaration,
  fieldName: string,
  sourceFile: ts.SourceFile
): FieldDefinition | null {
  const decoratorArgs = getDecoratorArgs(prop, 'Column');
  if (decoratorArgs.length === 0) return null;
  
  const options = parseObjectLiteral(decoratorArgs[0], sourceFile);
  
  // 解析 type（如 FieldTypes.STRING -> STRING）
  let type = 'STRING';
  if (options.type) {
    const typeStr = String(options.type);
    // 处理 FieldTypes.STRING 格式
    if (typeStr.includes('.')) {
      type = typeStr.split('.').pop() || 'STRING';
    } else {
      type = typeStr;
    }
  }
  
  // 解析 validation
  let validation = options.validation as FieldDefinition['validation'];
  if (validation && typeof validation === 'object') {
    // 将 RegExp 对象转为字符串
    if (validation.pattern && typeof validation.pattern !== 'string') {
      validation.pattern = String(validation.pattern);
    }
  }
  
  return {
    name: fieldName,
    type,
    label: (options.label as string) || fieldName,
    required: options.required as boolean | undefined,
    default: options.default,
    validation,
  };
}

/**
 * 解析 @Embedded 装饰的字段
 */
function parseEmbeddedField(
  prop: ts.PropertyDeclaration,
  fieldName: string,
  sourceFile: ts.SourceFile
): FieldDefinition | null {
  // 获取属性类型
  let targetType = 'unknown';
  if (prop.type) {
    targetType = prop.type.getText(sourceFile);
    // 移除数组标记
    targetType = targetType.replace('[]', '').trim();
  }
  
  return {
    name: fieldName,
    type: 'EMBEDDED',
    label: fieldName,
    target: targetType,
    embedded: true,
  };
}

/**
 * 解析关系字段（@OneToMany, @ManyToOne）
 */
function parseRelationField(
  prop: ts.PropertyDeclaration,
  fieldName: string,
  relationType: string,
  sourceFile: ts.SourceFile
): FieldDefinition | null {
  const decoratorArgs = getDecoratorArgs(prop, relationType);
  
  let targetType = 'unknown';
  
  // 从装饰器参数获取目标类型
  if (decoratorArgs.length > 0) {
    const firstArg = decoratorArgs[0];
    // () => TargetClass 格式
    if (ts.isArrowFunction(firstArg) && firstArg.body) {
      targetType = firstArg.body.getText(sourceFile);
    }
  }
  
  // 从属性类型推断
  if (targetType === 'unknown' && prop.type) {
    targetType = prop.type.getText(sourceFile);
    // 移除数组标记
    targetType = targetType.replace('[]', '').trim();
  }
  
  return {
    name: fieldName,
    type: 'RELATION',
    label: fieldName,
    relation: relationType,
    target: targetType,
  };
}

