import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: use-inject-decorator
 * 
 * 在服务层文件中，依赖注入必须使用 @Inject 装饰器
 * 适用于: .app.ts, .service.ts, .repository.ts
 */
export const useInjectDecorator = createRule({
  name: 'use-inject-decorator',
  meta: {
    type: 'suggestion',
    docs: {
      description: '在服务层文件中，依赖注入必须使用 @Inject 装饰器',
    },
    messages: {
      missingInject: '⚠️ 服务依赖应该使用 @Inject 装饰器标注，以支持依赖注入',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 检查 .app.ts, .service.ts, .repository.ts 文件
    const isServiceLayerFile = 
      filename.endsWith('.app.ts') || 
      filename.endsWith('.service.ts') || 
      filename.endsWith('.repository.ts');
    
    if (!isServiceLayerFile) {
      return {};
    }

    return {
      // 检查类属性定义
      'ClassBody > PropertyDefinition'(node: TSESTree.PropertyDefinition) {
        // 跳过静态属性
        if (node.static) {
          return;
        }

        // 检查是否有 @Inject 装饰器
        const hasInject = node.decorators?.some(
          (decorator) =>
            decorator.expression.type === 'CallExpression' &&
            decorator.expression.callee.type === 'Identifier' &&
            decorator.expression.callee.name === 'Inject'
        ) || node.decorators?.some(
          (decorator) =>
            decorator.expression.type === 'Identifier' &&
            decorator.expression.name === 'Inject'
        );

        // 如果属性类型看起来像是服务或仓储，但没有 @Inject
        if (!hasInject && node.typeAnnotation) {
          const typeNode = node.typeAnnotation.typeAnnotation;
          if (typeNode.type === 'TSTypeReference' && typeNode.typeName.type === 'Identifier') {
            const typeName = typeNode.typeName.name;
            
            // 检查常见的服务类型名称
            const isServiceType = 
              typeName.endsWith('Service') || 
              typeName.endsWith('AppService') ||
              typeName.endsWith('Logic') || 
              typeName.endsWith('DomainLogic') ||
              typeName.endsWith('Repository') || 
              typeName.endsWith('API') ||
              typeName.endsWith('Client');
            
            if (isServiceType) {
              context.report({
                node,
                messageId: 'missingInject',
              });
            }
          }
        }
      },
    };
  },
});

