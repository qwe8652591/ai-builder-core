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
 * - .entity.ts: 只能引用同层 .entity.ts，禁止引用 logic/app/view
 * - .logic.ts: 可引用 .entity.ts，禁止引用 app/view
 * - .service.ts / .repository.ts: 可引用 entity/logic/dto，禁止引用 view
 * - .appservice.ts: 可引用 entity/logic/dto/service/repository，禁止引用 view
 * - .page.tsx / .component.tsx / app.tsx: 可引用 entity/logic/dto/appservice，禁止引用 service/repository
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
      entityCantImportLogic: '🛑 Entity 层不能引用 Logic 层 ({{importPath}})',
      entityCantImportDto: '🛑 Entity 层不能引用 DTO 层 ({{importPath}})',
      entityCantImportApp: '🛑 Entity 层不能引用 App 层 ({{importPath}})',
      entityCantImportView: '🛑 Entity 层不能引用 View 层 ({{importPath}})',
      logicCantImportDto: '🛑 Logic 层不能引用 DTO 层 ({{importPath}})',
      logicCantImportApp: '🛑 Logic 层不能引用 App 层 ({{importPath}})',
      logicCantImportView: '🛑 Logic 层不能引用 View 层 ({{importPath}})',
      logicCantImportRepo: '🛑 Logic 层不能引用数据访问层 ({{importPath}})',
      logicCantImportHttp: '🛑 Logic 层禁止进行 HTTP 请求 ({{importPath}})',
      logicCantImportIO: '🛑 Logic 层禁止进行文件/系统操作 ({{importPath}})',
      appCantImportView: '🛑 App 层不能引用 View 层 ({{importPath}})',
      appCantImportFrontend: '🛑 App 层不能引用前端框架 ({{importPath}})',
      viewCantImportService: '🛑 View 层不能直接引用 Service 层，请使用 AppService ({{importPath}})',
      viewCantImportRepository: '🛑 View 层不能直接引用 Repository 层，请使用 AppService ({{importPath}})',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 判断文件类型
    const isEntityFile = filename.endsWith('.entity.ts');
    const isLogicFile = filename.endsWith('.logic.ts');
    // Service/Repository 层（不包括 appservice）
    const isServiceFile = filename.endsWith('.service.ts') && !filename.endsWith('.appservice.ts');
    const isRepositoryFile = filename.endsWith('.repository.ts');
    const isAppServiceFile = filename.endsWith('.appservice.ts');
    // View 层：page.tsx, component.tsx, app.tsx
    const isViewFile = filename.endsWith('.page.tsx') || 
                       filename.endsWith('.component.tsx') || 
                       (filename.endsWith('app.tsx') && !filename.includes('node_modules'));

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const importPath = node.source.value;

        // ==================== .entity.ts 约束 ====================
        if (isEntityFile) {
          // 禁止引用 logic 层
          if (importPath.includes('.logic')) {
            context.report({
              node,
              messageId: 'entityCantImportLogic',
              data: { importPath },
            });
          }
          // 禁止引用 dto 层
          if (importPath.includes('.dto')) {
            context.report({
              node,
              messageId: 'entityCantImportDto',
              data: { importPath },
            });
          }
          // 禁止引用 app 层
          if (importPath.includes('.appservice') || 
              (importPath.includes('.service') && !importPath.includes('.appservice')) || 
              importPath.includes('.repository')) {
            context.report({
              node,
              messageId: 'entityCantImportApp',
              data: { importPath },
            });
          }
          // 禁止引用 view 层
          if (importPath.includes('.page') || importPath.includes('.component')) {
            context.report({
              node,
              messageId: 'entityCantImportView',
              data: { importPath },
            });
          }
        }

        // ==================== .logic.ts 约束 ====================
        if (isLogicFile) {
          // 禁止引用 dto 层
          if (importPath.includes('.dto')) {
            context.report({
              node,
              messageId: 'logicCantImportDto',
              data: { importPath },
            });
          }
          // 禁止引用 app 层
          if (importPath.includes('.appservice') || 
              (importPath.includes('.service') && !importPath.includes('.appservice')) || 
              importPath.includes('.repository')) {
            context.report({
              node,
              messageId: 'logicCantImportApp',
              data: { importPath },
            });
          }
          // 禁止引用 view 层
          if (importPath.includes('.page') || importPath.includes('.component')) {
            context.report({
              node,
              messageId: 'logicCantImportView',
              data: { importPath },
            });
          }
          // 禁止 HTTP 请求
          if (importPath === 'axios' || importPath === 'node-fetch' || importPath === 'got') {
            context.report({
              node,
              messageId: 'logicCantImportHttp',
              data: { importPath },
            });
          }
          // 禁止文件/系统操作
          if (importPath === 'fs' || importPath === 'path' || importPath === 'child_process') {
            context.report({
              node,
              messageId: 'logicCantImportIO',
              data: { importPath },
            });
          }
        }

        // ==================== .service.ts / .repository.ts / .appservice.ts 约束 ====================
        if (isServiceFile || isRepositoryFile || isAppServiceFile) {
          // 禁止引用 view 层
          if (importPath.includes('.page') || importPath.includes('.component')) {
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

        // ==================== .page.tsx / .component.tsx / app.tsx 约束 ====================
        if (isViewFile) {
          // 禁止直接引用 Service 层（应通过 AppService）
          if (importPath.includes('.service') && !importPath.includes('.appservice')) {
            context.report({
              node,
              messageId: 'viewCantImportService',
              data: { importPath },
            });
          }
          // 禁止直接引用 Repository 层
          if (importPath.includes('.repository')) {
            context.report({
              node,
              messageId: 'viewCantImportRepository',
              data: { importPath },
            });
          }
        }
      },
    };
  },
});
