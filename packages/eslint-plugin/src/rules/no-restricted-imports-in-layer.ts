import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: no-restricted-imports-in-layer
 * 
 * 根据文件类型限制跨层引用
 * 
 * 分层引用约束矩阵：
 * - .model.ts: 只能引用同层 .model.ts，禁止引用 domain/app/view
 * - .domain.ts: 可引用 .model.ts，禁止引用 app/view
 * - .app.ts: 可引用 model/domain，禁止引用 view
 * - .view.tsx: 可引用所有层
 */
export const noRestrictedImportsInLayer = createRule({
  name: 'no-restricted-imports-in-layer',
  meta: {
    type: 'problem',
    docs: {
      description: '强制执行分层架构的引用约束',
      recommended: 'recommended',
    },
    messages: {
      modelCantImportDomain: '🛑 Model 层不能引用 Domain 层 ({{importPath}})',
      modelCantImportApp: '🛑 Model 层不能引用 App 层 ({{importPath}})',
      modelCantImportView: '🛑 Model 层不能引用 View 层 ({{importPath}})',
      domainCantImportApp: '🛑 Domain 层不能引用 App 层 ({{importPath}})',
      domainCantImportView: '🛑 Domain 层不能引用 View 层 ({{importPath}})',
      domainCantImportRepo: '🛑 Domain 层不能引用数据访问层 ({{importPath}})',
      domainCantImportHttp: '🛑 Domain 层禁止进行 HTTP 请求 ({{importPath}})',
      domainCantImportIO: '🛑 Domain 层禁止进行文件/系统操作 ({{importPath}})',
      appCantImportView: '🛑 App 层不能引用 View 层 ({{importPath}})',
      appCantImportFrontend: '🛑 App 层不能引用前端框架 ({{importPath}})',
      viewCantImportDAL: '🛑 View 层不能直接访问数据库 ({{importPath}})',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 判断文件类型
    const isModelFile = filename.endsWith('.model.ts');
    const isDomainFile = filename.endsWith('.domain.ts');
    const isAppFile = filename.endsWith('.app.ts') || filename.endsWith('.service.ts') || filename.endsWith('.repository.ts');
    const isViewFile = filename.endsWith('.view.tsx') || filename.endsWith('.view.ts');

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const importPath = node.source.value;

        // ==================== .model.ts 约束 ====================
        if (isModelFile) {
          // 禁止引用 domain 层
          if (importPath.includes('.domain')) {
            context.report({
              node,
              messageId: 'modelCantImportDomain',
              data: { importPath },
            });
          }
          // 禁止引用 app 层
          if (importPath.includes('.app') || importPath.includes('.service') || importPath.includes('.repository')) {
            context.report({
              node,
              messageId: 'modelCantImportApp',
              data: { importPath },
            });
          }
          // 禁止引用 view 层
          if (importPath.includes('.view')) {
            context.report({
              node,
              messageId: 'modelCantImportView',
              data: { importPath },
            });
          }
        }

        // ==================== .domain.ts 约束 ====================
        if (isDomainFile) {
          // 禁止引用 app 层
          if (importPath.includes('.app') || importPath.includes('.service') || importPath.includes('.repository')) {
            context.report({
              node,
              messageId: 'domainCantImportApp',
              data: { importPath },
            });
          }
          // 禁止引用 view 层
          if (importPath.includes('.view')) {
            context.report({
              node,
              messageId: 'domainCantImportView',
              data: { importPath },
            });
          }
          // 禁止引用数据访问层
          if (importPath.includes('/dal/') || importPath.includes('/repo/') || importPath.includes('/mapper/')) {
            context.report({
              node,
              messageId: 'domainCantImportRepo',
              data: { importPath },
            });
          }
          // 禁止 HTTP 请求
          if (importPath === 'axios' || importPath === 'node-fetch' || importPath === 'got') {
            context.report({
              node,
              messageId: 'domainCantImportHttp',
              data: { importPath },
            });
          }
          // 禁止文件/系统操作
          if (importPath === 'fs' || importPath === 'path' || importPath === 'child_process') {
            context.report({
              node,
              messageId: 'domainCantImportIO',
              data: { importPath },
            });
          }
        }

        // ==================== .app.ts / .service.ts 约束 ====================
        if (isAppFile) {
          // 禁止引用 view 层
          if (importPath.includes('.view')) {
            context.report({
              node,
              messageId: 'appCantImportView',
              data: { importPath },
            });
          }
          // 禁止引用前端框架
          if (importPath === 'vue' || importPath === 'react' || importPath === 'react-dom' || importPath.startsWith('@vue/')) {
            context.report({
              node,
              messageId: 'appCantImportFrontend',
              data: { importPath },
            });
          }
        }

        // ==================== .view.tsx 约束 ====================
        if (isViewFile) {
          // 禁止直接访问数据库
          if (importPath.includes('/dal/') || importPath.includes('/repo/') || importPath.includes('/mapper/')) {
            context.report({
              node,
              messageId: 'viewCantImportDAL',
              data: { importPath },
            });
          }
        }
      },
    };
  },
});

