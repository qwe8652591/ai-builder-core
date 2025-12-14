import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: no-expose-in-service
 * 
 * @Service 和 @Repository 不应该使用 @Expose 装饰器
 * 只有 @AppService 可以暴露 API
 */
export const noExposeInService = createRule({
  name: 'no-expose-in-service',
  meta: {
    type: 'problem',
    docs: {
      description: '@Service 和 @Repository 不应该使用 @Expose 装饰器',
      recommended: 'recommended',
    },
    messages: {
      noExposeInService: '🛑 @Service 不应该使用 @Expose，只有 @AppService 可以暴露 API',
      noExposeInRepository: '🛑 @Repository 不应该使用 @Expose，仓储层不应该暴露 API',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 检查 .service.ts 或 .repository.ts 文件
    const isServiceFile = filename.endsWith('.service.ts');
    const isRepositoryFile = filename.endsWith('.repository.ts');
    
    if (!isServiceFile && !isRepositoryFile) {
      return {};
    }

    let classHasServiceDecorator = false;
    let classHasRepositoryDecorator = false;

    return {
      // 检查类装饰器
      'ClassDeclaration > Decorator'(node: TSESTree.Decorator) {
        if (node.expression.type === AST_NODE_TYPES.CallExpression) {
          const callee = node.expression.callee;
          if (callee.type === AST_NODE_TYPES.Identifier) {
            if (callee.name === 'Service') {
              classHasServiceDecorator = true;
            }
            if (callee.name === 'Repository') {
              classHasRepositoryDecorator = true;
            }
          }
        }
      },

      // 检查方法装饰器
      'MethodDefinition > Decorator'(node: TSESTree.Decorator) {
        if (!classHasServiceDecorator && !classHasRepositoryDecorator) {
          return;
        }

        // 检查是否使用了 @Expose
        let isExposeDecorator = false;
        
        if (node.expression.type === AST_NODE_TYPES.CallExpression) {
          const callee = node.expression.callee;
          if (callee.type === AST_NODE_TYPES.Identifier && callee.name === 'Expose') {
            isExposeDecorator = true;
          }
        } else if (node.expression.type === AST_NODE_TYPES.Identifier) {
          if (node.expression.name === 'Expose') {
            isExposeDecorator = true;
          }
        }

        if (isExposeDecorator) {
          if (classHasServiceDecorator) {
            context.report({
              node,
              messageId: 'noExposeInService',
            });
          } else if (classHasRepositoryDecorator) {
            context.report({
              node,
              messageId: 'noExposeInRepository',
            });
          }
        }
      },
    };
  },
});

