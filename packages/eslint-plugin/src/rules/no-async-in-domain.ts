import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: no-async-in-domain
 * 
 * 禁止在 .domain.ts 文件中使用 async/await
 * 确保领域逻辑是纯同步的，可以同构执行
 */
export const noAsyncInDomain = createRule({
  name: 'no-async-in-domain',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在 .domain.ts 文件中使用 async/await',
      recommended: 'recommended',
    },
    messages: {
      noAsync: '🛑 Domain 层不能使用 async/await，领域逻辑必须是纯同步的以支持前后端同构执行',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 只检查 .domain.ts 文件
    if (!filename.endsWith('.domain.ts')) {
      return {};
    }

    return {
      // 检查 async 函数声明
      'FunctionDeclaration[async=true]'(node: TSESTree.FunctionDeclaration) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
      // 检查 async 函数表达式
      'FunctionExpression[async=true]'(node: TSESTree.FunctionExpression) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
      // 检查 async 箭头函数
      'ArrowFunctionExpression[async=true]'(node: TSESTree.ArrowFunctionExpression) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
      // 检查 async 方法
      'MethodDefinition[value.async=true]'(node: TSESTree.MethodDefinition) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
      // 检查 await 表达式
      AwaitExpression(node: TSESTree.AwaitExpression) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
    };
  },
});

