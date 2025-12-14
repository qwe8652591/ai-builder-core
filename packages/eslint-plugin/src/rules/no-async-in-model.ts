import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: no-async-in-model
 * 
 * 禁止在 .model.ts 文件中使用 async/await
 * Model 文件只能包含数据定义，不能有异步操作
 */
export const noAsyncInModel = createRule({
  name: 'no-async-in-model',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在 .model.ts 文件中使用 async/await',
      recommended: 'recommended',
    },
    messages: {
      noAsync: '🛑 Model 层不能使用 async/await，Model 只能是纯数据定义',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 只检查 .model.ts 文件
    if (!filename.endsWith('.model.ts')) {
      return {};
    }

    return {
      'FunctionDeclaration[async=true]'(node: TSESTree.FunctionDeclaration) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
      'FunctionExpression[async=true]'(node: TSESTree.FunctionExpression) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
      'ArrowFunctionExpression[async=true]'(node: TSESTree.ArrowFunctionExpression) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
      'MethodDefinition[value.async=true]'(node: TSESTree.MethodDefinition) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
      AwaitExpression(node: TSESTree.AwaitExpression) {
        context.report({
          node,
          messageId: 'noAsync',
        });
      },
    };
  },
});

