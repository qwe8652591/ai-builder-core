/**
 * 领域模型加载器
 * 
 * 负责加载领域模型文件，并使用 ts-morph 提取字段元数据
 */

import { Project } from 'ts-morph';
import { metadataStore } from './metadata';

/**
 * 字段元数据接口
 */
interface FieldMetadata {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  nullable?: boolean;
  isRelation?: boolean;
  relationInfo?: any;
}

/**
 * 从源文件中提取枚举定义
 */
export function extractEnumsFromSource(filePath: string, tsconfigPath?: string): Map<string, string[]> {
  const projectOptions: any = {};
  if (tsconfigPath) {
    projectOptions.tsConfigFilePath = tsconfigPath;
  }
  
  const project = new Project(projectOptions);
  const sourceFile = project.addSourceFileAtPath(filePath);
  const enums = new Map<string, string[]>();
  
  // 提取 enum 声明
  sourceFile.getEnums().forEach(enumDecl => {
    const enumName = enumDecl.getName();
    const values = enumDecl.getMembers().map(member => {
      const initializer = member.getInitializer();
      if (initializer) {
        // 移除引号，获取实际的字符串值
        return initializer.getText().replace(/['"]/g, '');
      }
      return member.getName();
    });
    enums.set(enumName, values);
  });
  
  // 提取 type 别名（如 type Priority = 'LOW' | 'MEDIUM' | 'HIGH'）
  sourceFile.getTypeAliases().forEach(typeAlias => {
    const typeName = typeAlias.getName();
    const typeNode = typeAlias.getTypeNode();
    
    if (typeNode && typeNode.getKind() === 198) {  // UnionType
      const unionType = typeNode as any;
      const types = unionType.getTypeNodes?.() || [];
      const values = types
        .filter((t: any) => t.getKind() === 200)  // LiteralType
        .map((t: any) => {
          const literal = t.getLiteral?.();
          return literal?.getText().replace(/['"]/g, '');
        })
        .filter(Boolean);
      
      if (values.length > 0) {
        enums.set(typeName, values);
      }
    }
  });
  
  return enums;
}

/**
 * 使用 ts-morph 从源文件中提取所有字段定义
 */
export function extractFieldsFromSource(filePath: string, tsconfigPath?: string): Map<string, FieldMetadata[]> {
  const projectOptions: any = {};
  if (tsconfigPath) {
    projectOptions.tsConfigFilePath = tsconfigPath;
  }
  
  const project = new Project(projectOptions);
  
  const sourceFile = project.addSourceFileAtPath(filePath);
  const classesFields = new Map<string, FieldMetadata[]>();
  
  // 遍历文件中的所有类
  sourceFile.getClasses().forEach(classDecl => {
    const className = classDecl.getName();
    if (!className) return;
    
    const fields: FieldMetadata[] = [];
    
    // 获取类的所有属性
    classDecl.getProperties().forEach(prop => {
      const fieldName = prop.getName();
      const typeNode = prop.getTypeNode();
      const typeText = typeNode ? typeNode.getText() : 'unknown';
      
      // 检查字段是否必填（有 ! 标记）
      const hasExclamationToken = prop.hasExclamationToken();
      const hasQuestionToken = prop.hasQuestionToken();
      
      // 检查是否有关系装饰器
      let isRelation = false;
      let label: string | undefined;
      let relationInfo: any = null;
      const decorators = prop.getDecorators();
      
      decorators.forEach(decorator => {
        const decoratorName = decorator.getName();
        
        // 检查是否为关系装饰器
        if (decoratorName === 'Composition' || decoratorName === 'Association') {
          isRelation = true;
          
          // 提取关系配置
          const args = decorator.getArguments();
          if (args.length > 0) {
            const arg = args[0];
            const text = arg.getText();
            
            // 提取关系配置
            const typeMatch = text.match(/type:\s*RelationType\.(\w+)/);
            const embeddedMatch = text.match(/embedded:\s*(true|false)/);
            const labelMatch = text.match(/label:\s*['"]([^'"]+)['"]/);
            
            relationInfo = {
              relationType: decoratorName,
              type: typeMatch ? typeMatch[1] : null,
              embedded: embeddedMatch ? embeddedMatch[1] === 'true' : undefined,
              targetType: typeText.replace(/\[\]$/, ''),  // 移除数组标记
            };
            
            if (labelMatch) {
              label = labelMatch[1];
            }
          }
        }
        
        // 从 @Field 获取 label
        if (decoratorName === 'Field') {
          const args = decorator.getArguments();
          if (args.length > 0) {
            const arg = args[0];
            const text = arg.getText();
            const match = text.match(/label:\s*['"]([^'"]+)['"]/);
            if (match) {
              label = match[1];
            }
          }
        }
      });
      
      // 所有字段都添加（包括关系字段）
      fields.push({ 
        name: fieldName, 
        type: typeText, 
        label,
        required: hasExclamationToken,  // 有 ! 标记表示必填
        nullable: hasQuestionToken,     // 有 ? 标记表示可空
        isRelation,
        relationInfo
      });
    });
    
    if (fields.length > 0) {
      classesFields.set(className, fields);
    }
  });
  
  return classesFields;
}

/**
 * 加载模型文件并合并字段元数据
 * 
 * @param modelFilePath 模型文件路径
 * @param tsconfigPath tsconfig.json 路径
 */
export function loadModelFile(modelFilePath: string, tsconfigPath?: string): void {
  try {
    // 1. 导入模块（装饰器会在这时执行）
    const module = require(modelFilePath);
    
    // 2. 实例化类（触发 addInitializer）
    Object.values(module).forEach((exportedValue: any) => {
      if (typeof exportedValue === 'function' && exportedValue.name) {
        try {
          new exportedValue();
        } catch (e) {
          // 忽略实例化失败
        }
      }
    });
    
    // 3. 使用 ts-morph 从源码中提取所有字段（包括关系字段）和枚举
    const sourceFields = extractFieldsFromSource(modelFilePath, tsconfigPath);
    const sourceEnums = extractEnumsFromSource(modelFilePath, tsconfigPath);
    
    // 保存枚举信息到 metadataStore（用于后续生成 Schema）
    sourceEnums.forEach((values, enumName) => {
      (metadataStore as any).enums = (metadataStore as any).enums || new Map();
      (metadataStore as any).enums.set(enumName, values);
    });
    
    sourceFields.forEach((fields, className) => {
      const existingMetadata = metadataStore.getEntity(className);
      if (existingMetadata && (existingMetadata as any).type === 'Entity') {
        const registeredFields = (existingMetadata as any).fields || [];
        
        // 🔑 保留 extendEntity 注册的扩展字段
        const extensionFields = registeredFields.filter((f: any) => f.isExtension);
        
        // 使用 ts-morph 提取的字段（包括关系信息）
        const mergedFields: any[] = [...extensionFields];  // 先加入扩展字段
        
        fields.forEach(field => {
          if (field.isRelation && field.relationInfo) {
            // 关系字段：从 ts-morph 提取的信息构建
            mergedFields.push({
              name: field.name,
              label: field.label,
              isRelation: true,
              relationType: field.relationInfo.relationType,
              relationConfig: {
                type: field.relationInfo.type,
                embedded: field.relationInfo.embedded,
                targetType: field.relationInfo.targetType,
              },
            });
          } else {
            // 普通字段
            const exists = mergedFields.find((f: any) => f.name === field.name);
            if (!exists) {
              mergedFields.push({
                name: field.name,
                label: field.label,
                type: field.type,
                required: field.required,   // 保留必填标记
                nullable: field.nullable,   // 保留可空标记
              });
            }
          }
        });
        
        // 更新元数据（保留扩展字段 + ts-morph 提取的字段）
        metadataStore.registerEntity(className, {
          ...existingMetadata,
          fields: mergedFields,
        });
      }
    });
  } catch (error) {
    console.error(`加载模型文件失败 ${modelFilePath}:`, error);
    throw error;
  }
}

