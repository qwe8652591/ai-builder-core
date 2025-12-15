import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ai-builder/ai-builder/blob/main/docs/rules/${name}.md`
);

/**
 * 规则: decorator-in-correct-file
 * 
 * 确保 DSL 装饰器和定义函数只能在正确后缀的文件中使用
 * 
 * 约束：
 * - @Entity, @Embeddable, @Column, @PrimaryKey → *.entity.ts
 * - @Logic, @Validation, @Computation, @Check, @Action → *.logic.ts
 * - @DTO, @Field → *.dto.ts
 * - @Repository, @Method (在 repository 中) → *.repository.ts
 * - @Service → *.service.ts (不含 appservice)
 * - @AppService, @Expose → *.appservice.ts
 * - definePage → *.page.tsx
 * - defineComponent → *.component.tsx
 * - extendEntity → *.ext.ts
 */
export const decoratorInCorrectFile = createRule({
  name: 'decorator-in-correct-file',
  meta: {
    type: 'problem',
    docs: {
      description: '确保 DSL 装饰器和定义函数在正确后缀的文件中使用',
      recommended: 'recommended',
    },
    messages: {
      entityDecoratorWrongFile: '🛑 @{{decorator}} 装饰器只能在 *.entity.ts 文件中使用',
      logicDecoratorWrongFile: '🛑 @{{decorator}} 装饰器只能在 *.logic.ts 文件中使用',
      dtoDecoratorWrongFile: '🛑 @{{decorator}} 装饰器只能在 *.dto.ts 文件中使用',
      repositoryDecoratorWrongFile: '🛑 @{{decorator}} 装饰器只能在 *.repository.ts 文件中使用',
      serviceDecoratorWrongFile: '🛑 @{{decorator}} 装饰器只能在 *.service.ts 文件中使用',
      appserviceDecoratorWrongFile: '🛑 @{{decorator}} 装饰器只能在 *.appservice.ts 文件中使用',
      definePageWrongFile: '🛑 definePage() 只能在 *.page.tsx 文件中使用',
      defineComponentWrongFile: '🛑 defineComponent() 只能在 *.component.tsx 或 app.tsx 文件中使用',
      defineAppWrongFile: '🛑 defineApp() 只能在 app.tsx 文件中使用',
      extendEntityWrongFile: '🛑 extendEntity() 只能在 *.ext.ts 文件中使用',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    
    // 判断文件类型
    const isEntityFile = filename.endsWith('.entity.ts');
    const isLogicFile = filename.endsWith('.logic.ts');
    const isDtoFile = filename.endsWith('.dto.ts');
    const isRepositoryFile = filename.endsWith('.repository.ts');
    const isServiceFile = filename.endsWith('.service.ts') && !filename.endsWith('.appservice.ts');
    const isAppServiceFile = filename.endsWith('.appservice.ts');
    const isPageFile = filename.endsWith('.page.tsx');
    const isComponentFile = filename.endsWith('.component.tsx');
    const isAppFile = filename.endsWith('app.tsx') && !filename.includes('node_modules');
    const isExtensionFile = filename.endsWith('.ext.ts');

    // 装饰器与文件类型的映射
    const entityDecorators = ['Entity', 'Embeddable', 'Column', 'PrimaryKey', 'ManyToOne', 'OneToMany', 'ManyToMany', 'OneToOne', 'Embedded'];
    const logicDecorators = ['Logic', 'Validation', 'Computation', 'Check', 'Action', 'BusinessRule'];
    const dtoDecorators = ['DTO', 'Field', 'InputDTO', 'OutputDTO'];
    const repositoryDecorators = ['Repository'];
    const serviceDecorators = ['Service'];
    const appserviceDecorators = ['AppService', 'Expose'];

    return {
      // 检查装饰器
      Decorator(node: TSESTree.Decorator) {
        let decoratorName = '';
        
        // 获取装饰器名称
        if (node.expression.type === 'Identifier') {
          decoratorName = node.expression.name;
        } else if (node.expression.type === 'CallExpression' && node.expression.callee.type === 'Identifier') {
          decoratorName = node.expression.callee.name;
        }

        if (!decoratorName) return;

        // Entity 装饰器检查
        if (entityDecorators.includes(decoratorName) && !isEntityFile) {
          context.report({
            node,
            messageId: 'entityDecoratorWrongFile',
            data: { decorator: decoratorName },
          });
        }

        // Logic 装饰器检查
        if (logicDecorators.includes(decoratorName) && !isLogicFile) {
          context.report({
            node,
            messageId: 'logicDecoratorWrongFile',
            data: { decorator: decoratorName },
          });
        }

        // DTO 装饰器检查
        if (dtoDecorators.includes(decoratorName) && !isDtoFile) {
          context.report({
            node,
            messageId: 'dtoDecoratorWrongFile',
            data: { decorator: decoratorName },
          });
        }

        // Repository 装饰器检查
        if (repositoryDecorators.includes(decoratorName) && !isRepositoryFile) {
          context.report({
            node,
            messageId: 'repositoryDecoratorWrongFile',
            data: { decorator: decoratorName },
          });
        }

        // Service 装饰器检查（在非 service 和非 appservice 文件中报错）
        if (serviceDecorators.includes(decoratorName) && !isServiceFile && !isAppServiceFile) {
          context.report({
            node,
            messageId: 'serviceDecoratorWrongFile',
            data: { decorator: decoratorName },
          });
        }

        // AppService/Expose 装饰器检查
        if (appserviceDecorators.includes(decoratorName) && !isAppServiceFile) {
          // @Expose 只能在 appservice 中使用
          if (decoratorName === 'Expose') {
            context.report({
              node,
              messageId: 'appserviceDecoratorWrongFile',
              data: { decorator: decoratorName },
            });
          }
          // @AppService 只能在 appservice 中使用
          if (decoratorName === 'AppService') {
            context.report({
              node,
              messageId: 'appserviceDecoratorWrongFile',
              data: { decorator: decoratorName },
            });
          }
        }
      },

      // 检查函数调用
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== 'Identifier') return;
        
        const funcName = node.callee.name;

        // definePage 检查
        if (funcName === 'definePage' && !isPageFile) {
          context.report({
            node,
            messageId: 'definePageWrongFile',
          });
        }

        // defineComponent 检查（允许在 component.tsx 和 app.tsx 中使用）
        if (funcName === 'defineComponent' && !isComponentFile && !isAppFile) {
          context.report({
            node,
            messageId: 'defineComponentWrongFile',
          });
        }

        // defineApp 检查
        if (funcName === 'defineApp' && !isAppFile) {
          context.report({
            node,
            messageId: 'defineAppWrongFile',
          });
        }

        // extendEntity 检查
        if (funcName === 'extendEntity' && !isExtensionFile) {
          context.report({
            node,
            messageId: 'extendEntityWrongFile',
          });
        }
      },
    };
  },
});
