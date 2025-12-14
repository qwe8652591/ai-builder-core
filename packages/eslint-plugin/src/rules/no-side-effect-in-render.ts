import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: no-side-effect-in-render
 * 
 * 禁止在 render 函数中产生副作用
 * render 函数应该是纯函数，不应该修改状态或调用 API
 */
export const noSideEffectInRender = createRule({
  name: 'no-side-effect-in-render',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在 render 函数中产生副作用',
      recommended: 'recommended',
    },
    messages: {
      noSideEffect: '🛑 render 函数中禁止副作用，请将副作用移到 useEffect 或事件处理函数中',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 只检查 .view.tsx 文件
    if (!filename.endsWith('.view.tsx')) {
      return {};
    }

    let inRenderFunction = false;

    return {
      // 检测 render 函数开始
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        // 查找 return () => ( ... ) 这种模式
        const parent = node.parent;
        if (parent && parent.type === AST_NODE_TYPES.ReturnStatement) {
          inRenderFunction = true;
        }
      },
      
      // 检测 render 函数结束
      'ArrowFunctionExpression:exit'(node: TSESTree.ArrowFunctionExpression) {
        const parent = node.parent;
        if (parent && parent.type === AST_NODE_TYPES.ReturnStatement) {
          inRenderFunction = false;
        }
      },

      // 在 render 函数中检查副作用
      CallExpression(node: TSESTree.CallExpression) {
        if (!inRenderFunction) return;

        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const objectName = node.callee.object.type === AST_NODE_TYPES.Identifier 
            ? node.callee.object.name 
            : '';
          const propertyName = node.callee.property.type === AST_NODE_TYPES.Identifier 
            ? node.callee.property.name 
            : '';

          // 检查是否在调用状态修改方法（.value = xxx 会被 AssignmentExpression 捕获）
          // 检查是否在调用 API
          if (
            propertyName === 'save' ||
            propertyName === 'delete' ||
            propertyName === 'update' ||
            propertyName === 'create' ||
            propertyName === 'fetch' ||
            propertyName === 'post' ||
            propertyName === 'get' ||
            propertyName === 'put' ||
            propertyName === 'patch' ||
            objectName === 'localStorage' ||
            objectName === 'sessionStorage'
          ) {
            context.report({
              node,
              messageId: 'noSideEffect',
            });
          }
        }
      },

      // 检查状态赋值
      AssignmentExpression(node: TSESTree.AssignmentExpression) {
        if (!inRenderFunction) return;

        // 检查是否在修改 .value（响应式状态）
        if (
          node.left.type === AST_NODE_TYPES.MemberExpression &&
          node.left.property.type === AST_NODE_TYPES.Identifier &&
          node.left.property.name === 'value'
        ) {
          context.report({
            node,
            messageId: 'noSideEffect',
          });
        }
      },
    };
  },
});

