import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: action-return-type
 * 
 * @Action 装饰的方法必须声明返回类型
 */
export const actionReturnType = createRule({
  name: 'action-return-type',
  meta: {
    type: 'problem',
    docs: {
      description: '@Action 装饰的方法必须声明返回类型',
      recommended: 'recommended',
    },
    messages: {
      missingReturnType: '🛑 @Action 方法必须显式声明返回类型，以便生成正确的 API 接口',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      // 检查方法定义
      'MethodDefinition'(node: TSESTree.MethodDefinition) {
        // 检查是否有 @Action 装饰器
        const hasAction = node.decorators?.some(
          (decorator) =>
            (decorator.expression.type === 'CallExpression' &&
              decorator.expression.callee.type === 'Identifier' &&
              decorator.expression.callee.name === 'Action') ||
            (decorator.expression.type === 'Identifier' &&
              decorator.expression.name === 'Action')
        );

        if (!hasAction) {
          return;
        }

        // 检查是否有返回类型注解
        if (!node.value.returnType) {
          context.report({
            node,
            messageId: 'missingReturnType',
          });
        }
      },
    };
  },
});

