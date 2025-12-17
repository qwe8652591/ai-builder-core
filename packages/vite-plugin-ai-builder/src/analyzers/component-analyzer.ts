/**
 * 组件分析器
 * 
 * 分析 .component.tsx 文件，提取 defineComponent 定义的业务组件元数据
 */

import { Project, Node, type CallExpression, type ObjectLiteralExpression } from 'ts-morph';
import type { ComponentMetadata } from './types';

/**
 * 分析组件文件
 */
export function analyzeComponentFile(filePath: string, content: string): ComponentMetadata[] {
  const components: ComponentMetadata[] = [];
  
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('temp.tsx', content);
  
  // 查找所有 defineComponent 调用
  sourceFile.forEachDescendant((node: Node) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      if (Node.isIdentifier(expression) && expression.getText() === 'defineComponent') {
        const componentMeta = parseDefineComponentCall(node, filePath, content);
        if (componentMeta) {
          components.push(componentMeta);
        }
      }
    }
  });
  
  return components;
}

/**
 * 解析 defineComponent 调用
 */
function parseDefineComponentCall(
  node: CallExpression, 
  filePath: string,
  content: string
): ComponentMetadata | null {
  const args = node.getArguments();
  if (args.length < 2) return null;
  
  // 第一个参数是元数据对象
  const metaArg = args[0];
  if (!Node.isObjectLiteralExpression(metaArg)) return null;
  
  const meta = parseMetaObject(metaArg);
  if (!meta.name) return null;
  
  // 解析 Props 接口（从类型参数中获取）
  const props = parsePropsFromTypeArgument(node, content);
  
  // 第二个参数是渲染函数，解析其中使用的组件
  const renderFn = args[1];
  const usedComponents = extractComponentsFromRenderFn(renderFn, content);
  
  return {
    __type: 'component',
    name: meta.name,
    description: meta.description,
    category: meta.category,
    props,
    usedComponents,
    sourceFile: filePath,
  };
}

/**
 * 解析元数据对象
 */
function parseMetaObject(obj: ObjectLiteralExpression): {
  name?: string;
  description?: string;
  category?: string;
} {
  const result: { name?: string; description?: string; category?: string } = {};
  
  for (const prop of obj.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const name = prop.getName();
      const initializer = prop.getInitializer();
      
      if (initializer && Node.isStringLiteral(initializer)) {
        const value = initializer.getLiteralValue();
        if (name === 'name') result.name = value;
        else if (name === 'description') result.description = value;
        else if (name === 'category') result.category = value;
      }
    }
  }
  
  return result;
}

/**
 * 从类型参数解析 Props 接口
 */
function parsePropsFromTypeArgument(
  node: CallExpression, 
  content: string
): ComponentMetadata['props'] {
  const props: ComponentMetadata['props'] = [];
  
  // 获取类型参数 defineComponent<PropsType>(...)
  const typeArgs = node.getTypeArguments();
  if (typeArgs.length === 0) return props;
  
  const propsType = typeArgs[0];
  const propsTypeName = propsType.getText();
  
  // 在文件中查找对应的 interface 定义
  const sourceFile = node.getSourceFile();
  const interfaces = sourceFile.getInterfaces();
  
  for (const iface of interfaces) {
    if (iface.getName() === propsTypeName) {
      for (const member of iface.getMembers()) {
        if (Node.isPropertySignature(member)) {
          const propName = member.getName();
          const propType = member.getType().getText();
          const isRequired = !member.hasQuestionToken();
          
          // 尝试获取 JSDoc 注释
          const jsDocs = member.getJsDocs();
          const description = jsDocs.length > 0 
            ? jsDocs[0].getDescription().trim() 
            : undefined;
          
          props.push({
            name: propName,
            type: propType,
            required: isRequired,
            description,
          });
        }
      }
      break;
    }
  }
  
  return props;
}

/**
 * 从渲染函数中提取使用的组件
 */
function extractComponentsFromRenderFn(renderFn: Node, content: string): string[] {
  const components = new Set<string>();
  
  // 遍历渲染函数内的所有 JSX 元素
  renderFn.forEachDescendant((node: Node) => {
    if (Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)) {
      const tagName = node.getTagNameNode().getText();
      // 过滤掉小写开头的 HTML 元素
      if (tagName[0] === tagName[0].toUpperCase()) {
        components.add(tagName);
      }
    }
  });
  
  return Array.from(components).sort();
}

