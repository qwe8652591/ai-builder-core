import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: no-this-in-logic
 * 
 * 禁止在 .logic.ts 文件中使用 this
 * 确保所有方法都是静态方法，可以直接调用
 */
export const noThisInLogic = createRule({
  name: 'no-this-in-logic',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在 .logic.ts 文件中使用 this',
      recommended: 'recommended',
    },
    messages: {
      noThis: '🛑 Logic 层不能使用 this，所有方法应该是静态方法',
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
      ThisExpression(node: TSESTree.ThisExpression) {
        context.report({
          node,
          messageId: 'noThis',
        });
      },
    };
  },
});
