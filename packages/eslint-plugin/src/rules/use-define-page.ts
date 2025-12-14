import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: use-define-page
 * 
 * .view.tsx 文件必须使用 definePage 或 defineComponent 定义页面/组件
 */
export const useDefinePage = createRule({
  name: 'use-define-page',
  meta: {
    type: 'problem',
    docs: {
      description: '.view.tsx 文件必须使用 definePage 或 defineComponent',
      recommended: 'recommended',
    },
    messages: {
      missingDefinePage: '🛑 View 层必须使用 definePage 或 defineComponent 定义页面/组件',
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

    let hasDefinePageImport = false;
    let hasDefineComponentImport = false;
    let hasDefinePageUsage = false;
    let hasDefineComponentUsage = false;

    return {
      // 检查是否导入了 definePage/defineComponent
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (node.source.value.includes('@ai-builder/dsl') || node.source.value.includes('@ai-builder/runtime-renderer')) {
          node.specifiers.forEach((specifier) => {
            if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
              const importedName = specifier.imported.name;
              if (importedName === 'definePage') {
                hasDefinePageImport = true;
              }
              if (importedName === 'defineComponent') {
                hasDefineComponentImport = true;
              }
            }
          });
        }
      },
      
      // 检查是否使用了 definePage/defineComponent
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (node.callee.name === 'definePage') {
            hasDefinePageUsage = true;
          }
          if (node.callee.name === 'defineComponent') {
            hasDefineComponentUsage = true;
          }
        }
      },
      
      // 文件结束时检查
      'Program:exit'(node: TSESTree.Program) {
        // 如果导入了但没使用，或者既没导入也没使用
        if ((hasDefinePageImport || hasDefineComponentImport) && 
            !hasDefinePageUsage && !hasDefineComponentUsage) {
          context.report({
            node,
            messageId: 'missingDefinePage',
          });
        } else if (!hasDefinePageImport && !hasDefineComponentImport) {
          // 没有导入 definePage/defineComponent，可能是问题
          const hasExportDefault = node.body.some(
            (statement) =>
              statement.type === AST_NODE_TYPES.ExportDefaultDeclaration
          );
          
          if (hasExportDefault) {
            // 有默认导出但没用 definePage，报警
            context.report({
              node,
              messageId: 'missingDefinePage',
            });
          }
        }
      },
    };
  },
});

