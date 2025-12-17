/**
 * AST 分析工具函数
 */

import * as ts from 'typescript';

/**
 * 解析 TypeScript 文件
 */
export function parseFile(filePath: string, content: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

/**
 * 检查节点是否有指定名称的装饰器
 */
export function hasDecorator(node: ts.Node, decoratorName: string): boolean {
  const modifiers = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
  if (!modifiers) return false;
  
  return modifiers.some(decorator => {
    if (ts.isCallExpression(decorator.expression)) {
      const expr = decorator.expression.expression;
      return ts.isIdentifier(expr) && expr.text === decoratorName;
    }
    if (ts.isIdentifier(decorator.expression)) {
      return decorator.expression.text === decoratorName;
    }
    return false;
  });
}

/**
 * 获取装饰器的参数
 */
export function getDecoratorArgs(node: ts.Node, decoratorName: string): ts.Expression[] {
  const modifiers = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
  if (!modifiers) return [];
  
  for (const decorator of modifiers) {
    if (ts.isCallExpression(decorator.expression)) {
      const expr = decorator.expression.expression;
      if (ts.isIdentifier(expr) && expr.text === decoratorName) {
        return [...decorator.expression.arguments];
      }
    }
  }
  return [];
}

/**
 * 解析对象字面量表达式
 */
export function parseObjectLiteral(
  node: ts.Expression | undefined,
  sourceFile: ts.SourceFile
): Record<string, unknown> {
  if (!node || !ts.isObjectLiteralExpression(node)) {
    return {};
  }
  
  const result: Record<string, unknown> = {};
  
  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      const key = prop.name.text;
      result[key] = parseExpression(prop.initializer, sourceFile);
    }
    if (ts.isShorthandPropertyAssignment(prop)) {
      const key = prop.name.text;
      result[key] = key; // 简写属性
    }
  }
  
  return result;
}

/**
 * 解析表达式的值
 */
export function parseExpression(node: ts.Expression, sourceFile: ts.SourceFile): unknown {
  // 字符串字面量
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  
  // 数字字面量
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  
  // 布尔字面量
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  
  // null
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  
  // undefined
  if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
    return undefined;
  }
  
  // 标识符（变量引用）
  if (ts.isIdentifier(node)) {
    return node.text;
  }
  
  // 属性访问（如 FieldTypes.STRING）
  if (ts.isPropertyAccessExpression(node)) {
    const obj = node.expression.getText(sourceFile);
    const prop = node.name.text;
    return `${obj}.${prop}`;
  }
  
  // 对象字面量
  if (ts.isObjectLiteralExpression(node)) {
    return parseObjectLiteral(node, sourceFile);
  }
  
  // 数组字面量
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(el => parseExpression(el, sourceFile));
  }
  
  // 模板字符串
  if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.getText(sourceFile);
  }
  
  // 正则表达式
  if (ts.isRegularExpressionLiteral(node)) {
    return node.text;
  }
  
  // 箭头函数或函数表达式
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return '[Function]';
  }
  
  // 其他情况返回源码文本
  return node.getText(sourceFile);
}

/**
 * 检查是否是指定名称的函数调用
 */
export function isCallExpression(node: ts.Node, functionName: string): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false;
  
  const expr = node.expression;
  if (ts.isIdentifier(expr)) {
    return expr.text === functionName;
  }
  return false;
}

/**
 * 遍历 AST 节点
 */
export function visitNode(
  node: ts.Node,
  visitor: (node: ts.Node) => void
): void {
  visitor(node);
  ts.forEachChild(node, child => visitNode(child, visitor));
}

/**
 * 获取类的所有属性声明
 */
export function getClassProperties(node: ts.ClassDeclaration): ts.PropertyDeclaration[] {
  return node.members.filter(ts.isPropertyDeclaration);
}

/**
 * 获取类的所有方法声明
 */
export function getClassMethods(node: ts.ClassDeclaration): ts.MethodDeclaration[] {
  return node.members.filter(ts.isMethodDeclaration);
}

/**
 * 获取属性的类型字符串
 */
export function getPropertyType(prop: ts.PropertyDeclaration, sourceFile: ts.SourceFile): string {
  if (prop.type) {
    return prop.type.getText(sourceFile);
  }
  return 'unknown';
}

/**
 * 提取 JSX 中使用的组件名称
 */
export function extractJSXComponents(node: ts.Node, sourceFile: ts.SourceFile): string[] {
  const components = new Set<string>();
  
  function visit(n: ts.Node) {
    // JSX 开标签或自闭合标签
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tagName = n.tagName.getText(sourceFile);
      // 大写开头的是组件
      if (/^[A-Z]/.test(tagName)) {
        // 处理 Namespace.Component 格式，取第一部分
        const componentName = tagName.split('.')[0];
        components.add(componentName);
      }
    }
    ts.forEachChild(n, visit);
  }
  
  visit(node);
  return Array.from(components).sort();
}

/** 组件节点结构 */
export interface ComponentNode {
  component: string;
  props?: Record<string, unknown>;
  children?: ComponentNode[];
  text?: string;
}

/** Tab 项结构 */
export interface TabItem {
  key: string;
  tab: string;
  children?: ComponentNode;
}

/** 变量上下文（用于解析变量引用） */
interface VariableContext {
  variables: Map<string, ts.Node>;
  functions: Map<string, ts.Node>;
  sourceFile: ts.SourceFile;
}

/** 需要提取的关键属性名称 */
const KEY_PROPS = new Set([
  'label', 'name', 'title', 'prop', 'dataIndex', 'type', 'mode',
  'route', 'span', 'key', 'tab', 'value', 'placeholder', 'required',
  'columns', 'dataSource', 'size', 'variant', 'direction', 'align',
  'editing', 'options', 'field', 'render', 'width', 'style'
]);

/** 需要深入解析的 MasterDetailForm props */
const DEEP_PARSE_PROPS = new Set([
  'headerSummary', 'headerTabs', 'itemDetailTabs', 'footerContent',
  'renderHeader', 'renderFooter', 'extraActions'
]);

/**
 * 🆕 提取 JSX 的完整结构（树形）
 */
export function extractJSXStructure(node: ts.Node, sourceFile: ts.SourceFile): ComponentNode | null {
  // 收集变量上下文
  const context: VariableContext = {
    variables: new Map(),
    functions: new Map(),
    sourceFile,
  };
  
  // 遍历收集变量和函数定义
  function collectDefinitions(n: ts.Node) {
    // 变量声明 const xxx = ...
    if (ts.isVariableStatement(n)) {
      for (const decl of n.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          const name = decl.name.text;
          // 函数定义
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            context.functions.set(name, decl.initializer);
          } else {
            context.variables.set(name, decl.initializer);
          }
        }
      }
    }
    ts.forEachChild(n, collectDefinitions);
  }
  
  collectDefinitions(node);
  
  // 找到 return 语句
  let returnNode: ts.Node | null = null;
  
  function findReturn(n: ts.Node) {
    if (ts.isReturnStatement(n) && n.expression) {
      returnNode = n.expression;
      return;
    }
    ts.forEachChild(n, findReturn);
  }
  
  findReturn(node);
  
  if (!returnNode) return null;
  
  // 如果返回的是括号表达式，取其中的内容
  let jsxRoot = returnNode;
  while (ts.isParenthesizedExpression(jsxRoot)) {
    jsxRoot = jsxRoot.expression;
  }
  
  return parseJSXNodeWithContext(jsxRoot, context);
}

/**
 * 解析单个 JSX 节点（带上下文）
 */
function parseJSXNodeWithContext(node: ts.Node, context: VariableContext): ComponentNode | null {
  const sourceFile = context.sourceFile;
  
  // JSX 元素（有子元素）
  if (ts.isJsxElement(node)) {
    const tagName = node.openingElement.tagName.getText(sourceFile);
    const props = parseJSXAttributesWithContext(node.openingElement.attributes, context);
    const children = parseJSXChildrenWithContext(node.children, context);
    
    return {
      component: tagName,
      ...(Object.keys(props).length > 0 && { props }),
      ...(children.length > 0 && { children }),
    };
  }
  
  // 自闭合 JSX 元素
  if (ts.isJsxSelfClosingElement(node)) {
    const tagName = node.tagName.getText(sourceFile);
    const props = parseJSXAttributesWithContext(node.attributes, context);
    
    return {
      component: tagName,
      ...(Object.keys(props).length > 0 && { props }),
    };
  }
  
  // JSX Fragment (<>...</>)
  if (ts.isJsxFragment(node)) {
    const children = parseJSXChildrenWithContext(node.children, context);
    return {
      component: 'Fragment',
      ...(children.length > 0 && { children }),
    };
  }
  
  // JSX 表达式 ({...})
  if (ts.isJsxExpression(node) && node.expression) {
    // 条件表达式
    if (ts.isConditionalExpression(node.expression)) {
      const whenTrue = parseJSXNodeWithContext(node.expression.whenTrue, context);
      const whenFalse = parseJSXNodeWithContext(node.expression.whenFalse, context);
      
      const children: ComponentNode[] = [];
      if (whenTrue) children.push(whenTrue);
      if (whenFalse) children.push(whenFalse);
      
      if (children.length > 0) {
        return {
          component: 'Conditional',
          props: { condition: node.expression.condition.getText(sourceFile) },
          children,
        };
      }
    }
    
    // map 调用（循环渲染）
    if (ts.isCallExpression(node.expression) && 
        ts.isPropertyAccessExpression(node.expression.expression) &&
        node.expression.expression.name.text === 'map') {
      const arrayExpr = node.expression.expression.expression.getText(sourceFile);
      const callback = node.expression.arguments[0];
      
      if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
        const body = ts.isArrowFunction(callback) ? callback.body : callback.body;
        if (body) {
          const itemNode = parseJSXNodeWithContext(body, context);
          if (itemNode) {
            return {
              component: 'Loop',
              props: { source: arrayExpr },
              children: [itemNode],
            };
          }
        }
      }
    }
    
    const inner = parseJSXNodeWithContext(node.expression, context);
    if (inner) return inner;
  }
  
  // 括号表达式
  if (ts.isParenthesizedExpression(node)) {
    return parseJSXNodeWithContext(node.expression, context);
  }
  
  // 逻辑与表达式 (condition && <Component />)
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    const content = parseJSXNodeWithContext(node.right, context);
    if (content) {
      return {
        component: 'Conditional',
        props: { condition: node.left.getText(sourceFile) },
        children: [content],
      };
    }
  }
  
  return null;
}

/**
 * 解析单个 JSX 节点（无上下文，兼容旧代码）
 */
function parseJSXNode(node: ts.Node, sourceFile: ts.SourceFile): ComponentNode | null {
  // JSX 元素（有子元素）
  if (ts.isJsxElement(node)) {
    const tagName = node.openingElement.tagName.getText(sourceFile);
    const props = parseJSXAttributes(node.openingElement.attributes, sourceFile);
    const children = parseJSXChildren(node.children, sourceFile);
    
    return {
      component: tagName,
      ...(Object.keys(props).length > 0 && { props }),
      ...(children.length > 0 && { children }),
    };
  }
  
  // 自闭合 JSX 元素
  if (ts.isJsxSelfClosingElement(node)) {
    const tagName = node.tagName.getText(sourceFile);
    const props = parseJSXAttributes(node.attributes, sourceFile);
    
    return {
      component: tagName,
      ...(Object.keys(props).length > 0 && { props }),
    };
  }
  
  // JSX Fragment (<>...</>)
  if (ts.isJsxFragment(node)) {
    const children = parseJSXChildren(node.children, sourceFile);
    return {
      component: 'Fragment',
      ...(children.length > 0 && { children }),
    };
  }
  
  // JSX 表达式 ({...})
  if (ts.isJsxExpression(node) && node.expression) {
    // 条件表达式
    if (ts.isConditionalExpression(node.expression)) {
      const whenTrue = parseJSXNode(node.expression.whenTrue, sourceFile);
      const whenFalse = parseJSXNode(node.expression.whenFalse, sourceFile);
      
      // 返回 conditional 结构
      const children: ComponentNode[] = [];
      if (whenTrue) children.push(whenTrue);
      if (whenFalse) children.push(whenFalse);
      
      if (children.length > 0) {
        return {
          component: 'Conditional',
          props: { condition: node.expression.condition.getText(sourceFile) },
          children,
        };
      }
    }
    
    // map 调用（循环渲染）
    if (ts.isCallExpression(node.expression) && 
        ts.isPropertyAccessExpression(node.expression.expression) &&
        node.expression.expression.name.text === 'map') {
      const arrayExpr = node.expression.expression.expression.getText(sourceFile);
      const callback = node.expression.arguments[0];
      
      if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
        const body = ts.isArrowFunction(callback) ? callback.body : callback.body;
        if (body) {
          const itemNode = parseJSXNode(body, sourceFile);
          if (itemNode) {
            return {
              component: 'Loop',
              props: { source: arrayExpr },
              children: [itemNode],
            };
          }
        }
      }
    }
    
    // 其他表达式
    const inner = parseJSXNode(node.expression, sourceFile);
    if (inner) return inner;
  }
  
  // 括号表达式
  if (ts.isParenthesizedExpression(node)) {
    return parseJSXNode(node.expression, sourceFile);
  }
  
  // 逻辑与表达式 (condition && <Component />)
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    const content = parseJSXNode(node.right, sourceFile);
    if (content) {
      return {
        component: 'Conditional',
        props: { condition: node.left.getText(sourceFile) },
        children: [content],
      };
    }
  }
  
  return null;
}

/**
 * 解析 JSX 属性（带上下文，支持深度解析）
 */
function parseJSXAttributesWithContext(attributes: ts.JsxAttributes, context: VariableContext): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const sourceFile = context.sourceFile;
  
  for (const attr of attributes.properties) {
    if (ts.isJsxAttribute(attr) && attr.name) {
      const name = attr.name.getText(sourceFile);
      
      // 检查是否是需要深度解析的 prop
      const needDeepParse = DEEP_PARSE_PROPS.has(name);
      
      // 如果不是需要深度解析的，也不是关键属性，跳过
      if (!needDeepParse && !KEY_PROPS.has(name)) continue;
      
      if (!attr.initializer) {
        props[name] = true;
      } else if (ts.isStringLiteral(attr.initializer)) {
        props[name] = attr.initializer.text;
      } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        const expr = attr.initializer.expression;
        
        if (ts.isNumericLiteral(expr)) {
          props[name] = Number(expr.text);
        } else if (expr.kind === ts.SyntaxKind.TrueKeyword) {
          props[name] = true;
        } else if (expr.kind === ts.SyntaxKind.FalseKeyword) {
          props[name] = false;
        } else if (ts.isStringLiteral(expr)) {
          props[name] = expr.text;
        } else if (needDeepParse) {
          // 🆕 深度解析：变量引用或函数调用
          const resolved = resolveExpressionWithContext(expr, context);
          if (resolved) {
            props[name] = resolved;
          } else {
            const text = expr.getText(sourceFile);
            props[name] = text.length > 50 ? text.slice(0, 50) + '...' : text;
          }
        } else if (ts.isArrayLiteralExpression(expr)) {
          props[name] = parseArrayForStructure(expr, sourceFile);
        } else if (ts.isObjectLiteralExpression(expr)) {
          props[name] = '[Object]';
        } else if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
          props[name] = '[Function]';
        } else if (ts.isIdentifier(expr)) {
          // 变量引用
          props[name] = expr.text;
        } else {
          const text = expr.getText(sourceFile);
          props[name] = text.length > 50 ? text.slice(0, 50) + '...' : text;
        }
      }
    }
  }
  
  return props;
}

/**
 * 解析表达式（带上下文），尝试解析变量引用或函数调用
 */
function resolveExpressionWithContext(expr: ts.Expression, context: VariableContext): unknown {
  const sourceFile = context.sourceFile;
  
  // 函数调用: renderHeaderSummary()
  if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
    const funcName = expr.expression.text;
    const funcDef = context.functions.get(funcName);
    if (funcDef && (ts.isArrowFunction(funcDef) || ts.isFunctionExpression(funcDef))) {
      // 解析函数返回的 JSX
      const body = funcDef.body;
      if (ts.isParenthesizedExpression(body)) {
        const innerNode = parseJSXNodeWithContext(body.expression, context);
        if (innerNode) return innerNode;
      } else if (ts.isBlock(body)) {
        // 找 return 语句
        let returnNode: ComponentNode | null = null;
        body.statements.forEach(stmt => {
          if (ts.isReturnStatement(stmt) && stmt.expression) {
            returnNode = parseJSXNodeWithContext(stmt.expression, context);
          }
        });
        if (returnNode) return returnNode;
      } else {
        // 直接是表达式 () => <JSX />
        const innerNode = parseJSXNodeWithContext(body, context);
        if (innerNode) return innerNode;
      }
    }
  }
  
  // 变量引用: headerTabs
  if (ts.isIdentifier(expr)) {
    const varName = expr.text;
    const varDef = context.variables.get(varName);
    if (varDef) {
      // 如果是数组（如 tabs 配置）
      if (ts.isArrayLiteralExpression(varDef)) {
        return parseTabsArray(varDef, context);
      }
      // 如果是 JSX
      const jsxNode = parseJSXNodeWithContext(varDef, context);
      if (jsxNode) return jsxNode;
    }
  }
  
  return null;
}

/**
 * 解析 Tabs 数组配置
 */
function parseTabsArray(expr: ts.ArrayLiteralExpression, context: VariableContext): TabItem[] {
  const sourceFile = context.sourceFile;
  const tabs: TabItem[] = [];
  
  for (const element of expr.elements) {
    if (ts.isObjectLiteralExpression(element)) {
      const tab: Partial<TabItem> = {};
      
      for (const prop of element.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          const key = prop.name.text;
          
          if (key === 'key' && ts.isStringLiteral(prop.initializer)) {
            tab.key = prop.initializer.text;
          } else if (key === 'tab' && ts.isStringLiteral(prop.initializer)) {
            tab.tab = prop.initializer.text;
          } else if (key === 'children') {
            // 解析 children JSX
            let childrenNode: ComponentNode | null = null;
            
            // children 可能是直接 JSX, 也可能是条件表达式
            if (ts.isParenthesizedExpression(prop.initializer)) {
              childrenNode = parseJSXNodeWithContext(prop.initializer.expression, context);
            } else if (ts.isConditionalExpression(prop.initializer)) {
              // selectedItem ? <JSX> : emptySelection
              const whenTrue = parseJSXNodeWithContext(prop.initializer.whenTrue, context);
              if (whenTrue) {
                childrenNode = {
                  component: 'Conditional',
                  props: { condition: prop.initializer.condition.getText(sourceFile) },
                  children: [whenTrue],
                };
              }
            } else {
              childrenNode = parseJSXNodeWithContext(prop.initializer, context);
            }
            
            if (childrenNode) {
              tab.children = childrenNode;
            }
          }
        }
      }
      
      if (tab.key && tab.tab) {
        tabs.push(tab as TabItem);
      }
    }
  }
  
  return tabs;
}

/**
 * 解析 JSX 子元素（带上下文）
 */
function parseJSXChildrenWithContext(children: ts.NodeArray<ts.JsxChild>, context: VariableContext): ComponentNode[] {
  const result: ComponentNode[] = [];
  
  for (const child of children) {
    if (ts.isJsxText(child)) {
      const text = child.text.trim();
      if (text) {
        result.push({ component: 'Text', text });
      }
      continue;
    }
    
    const parsed = parseJSXNodeWithContext(child, context);
    if (parsed) {
      result.push(parsed);
    }
  }
  
  return result;
}

/**
 * 解析 JSX 属性（无上下文，兼容旧代码）
 */
function parseJSXAttributes(attributes: ts.JsxAttributes, sourceFile: ts.SourceFile): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  
  for (const attr of attributes.properties) {
    if (ts.isJsxAttribute(attr) && attr.name) {
      const name = attr.name.getText(sourceFile);
      
      // 只提取关键属性
      if (!KEY_PROPS.has(name)) continue;
      
      if (!attr.initializer) {
        // 布尔属性 <Component required />
        props[name] = true;
      } else if (ts.isStringLiteral(attr.initializer)) {
        // 字符串属性 <Component title="xxx" />
        props[name] = attr.initializer.text;
      } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        // 表达式属性 <Component value={...} />
        const expr = attr.initializer.expression;
        
        if (ts.isNumericLiteral(expr)) {
          props[name] = Number(expr.text);
        } else if (expr.kind === ts.SyntaxKind.TrueKeyword) {
          props[name] = true;
        } else if (expr.kind === ts.SyntaxKind.FalseKeyword) {
          props[name] = false;
        } else if (ts.isStringLiteral(expr)) {
          props[name] = expr.text;
        } else if (ts.isArrayLiteralExpression(expr)) {
          // 数组 - 尝试解析简单元素
          props[name] = parseArrayForStructure(expr, sourceFile);
        } else if (ts.isObjectLiteralExpression(expr)) {
          // 对象 - 标记为复杂对象
          props[name] = '[Object]';
        } else if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
          // 函数
          props[name] = '[Function]';
        } else {
          // 其他表达式 - 取变量名或简短表示
          const text = expr.getText(sourceFile);
          props[name] = text.length > 50 ? text.slice(0, 50) + '...' : text;
        }
      }
    }
  }
  
  return props;
}

/**
 * 解析数组表达式用于结构提取
 */
function parseArrayForStructure(expr: ts.ArrayLiteralExpression, sourceFile: ts.SourceFile): unknown {
  const items: unknown[] = [];
  
  for (const el of expr.elements) {
    if (ts.isObjectLiteralExpression(el)) {
      // 尝试提取对象的关键属性
      const obj: Record<string, unknown> = {};
      for (const prop of el.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          const key = prop.name.text;
          // 只提取简单的字符串/数字值
          if (ts.isStringLiteral(prop.initializer)) {
            obj[key] = prop.initializer.text;
          } else if (ts.isNumericLiteral(prop.initializer)) {
            obj[key] = Number(prop.initializer.text);
          }
        }
      }
      if (Object.keys(obj).length > 0) {
        items.push(obj);
      }
    } else if (ts.isStringLiteral(el)) {
      items.push(el.text);
    }
  }
  
  return items.length > 0 ? items : '[Array]';
}

/**
 * 解析 JSX 子元素
 */
function parseJSXChildren(children: ts.NodeArray<ts.JsxChild>, sourceFile: ts.SourceFile): ComponentNode[] {
  const result: ComponentNode[] = [];
  
  for (const child of children) {
    // 跳过纯空白文本
    if (ts.isJsxText(child)) {
      const text = child.text.trim();
      if (text) {
        result.push({ component: 'Text', text });
      }
      continue;
    }
    
    const parsed = parseJSXNode(child, sourceFile);
    if (parsed) {
      result.push(parsed);
    }
  }
  
  return result;
}

/**
 * 提取函数中的 Hook 调用
 */
export function extractHookCalls(node: ts.Node, sourceFile: ts.SourceFile): string[] {
  const hooks = new Set<string>();
  
  function visit(n: ts.Node) {
    if (ts.isCallExpression(n)) {
      const expr = n.expression;
      if (ts.isIdentifier(expr) && expr.text.startsWith('use')) {
        hooks.add(expr.text);
      }
    }
    ts.forEachChild(n, visit);
  }
  
  visit(node);
  return Array.from(hooks).sort();
}

/**
 * 提取 import 语句信息
 */
export interface ImportInfo {
  names: string[];
  from: string;
  isTypeOnly: boolean;
}

export function extractImports(sourceFile: ts.SourceFile): ImportInfo[] {
  const imports: ImportInfo[] = [];
  
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = (statement.moduleSpecifier as ts.StringLiteral).text;
      const isTypeOnly = statement.importClause?.isTypeOnly ?? false;
      const names: string[] = [];
      
      const importClause = statement.importClause;
      if (importClause) {
        // 默认导入
        if (importClause.name) {
          names.push(importClause.name.text);
        }
        // 命名导入
        const namedBindings = importClause.namedBindings;
        if (namedBindings) {
          if (ts.isNamedImports(namedBindings)) {
            for (const element of namedBindings.elements) {
              names.push(element.name.text);
            }
          } else if (ts.isNamespaceImport(namedBindings)) {
            names.push(`* as ${namedBindings.name.text}`);
          }
        }
      }
      
      imports.push({ names, from: moduleSpecifier, isTypeOnly });
    }
  }
  
  return imports;
}

