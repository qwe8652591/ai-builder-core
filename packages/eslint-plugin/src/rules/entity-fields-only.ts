import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils, ASTUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: entity-fields-only
 * 
 * 禁止在 .entity.ts 文件中定义方法
 * Entity 文件只能包含字段定义
 */
export const entityFieldsOnly = createRule({
  name: 'entity-fields-only',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在 .entity.ts 文件中定义方法',
      recommended: 'recommended',
    },
    messages: {
      noMethods: '🛑 Entity 层只能定义字段，不能包含方法。方法应该放在 .logic.ts 或 .service.ts 中',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 只检查 .entity.ts 文件
    if (!filename.endsWith('.entity.ts')) {
      return {};
    }

    return {
      // 检查类方法定义
      'ClassBody > MethodDefinition'(node: TSESTree.MethodDefinition) {
        // 允许构造函数
        if (node.kind === 'constructor') {
          return;
        }
        
        context.report({
          node,
          messageId: 'noMethods',
        });
      },
    };
  },
});
