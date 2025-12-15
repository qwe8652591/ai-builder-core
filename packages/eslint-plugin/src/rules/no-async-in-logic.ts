import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: no-async-in-logic
 * 
 * 禁止在 .logic.ts 文件中使用 async/await
 * 确保业务逻辑是纯同步的，可以同构执行
 */
export const noAsyncInLogic = createRule({
  name: 'no-async-in-logic',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在 .logic.ts 文件中使用 async/await',
      recommended: 'recommended',
    },
    messages: {
      noAsync: '🛑 Logic 层不能使用 async/await，业务逻辑必须是纯同步的以支持前后端同构执行',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 只检查 .logic.ts 文件
    if (!filename.endsWith('.logic.ts')) {
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
