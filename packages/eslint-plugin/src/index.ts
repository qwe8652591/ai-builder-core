import { noAsyncInLogic } from './rules/no-async-in-logic';
import { noThisInLogic } from './rules/no-this-in-logic';
import { entityFieldsOnly } from './rules/entity-fields-only';
import { useInjectDecorator } from './rules/use-inject-decorator';
import { actionReturnType } from './rules/action-return-type';
import { noRestrictedImportsInLayer } from './rules/no-restricted-imports-in-layer';
import { noAsyncInEntity } from './rules/no-async-in-entity';
import { useDefinePage } from './rules/use-define-page';
import { noSideEffectInRender } from './rules/no-side-effect-in-render';
import { noExposeInService } from './rules/no-expose-in-service';
import { decoratorInCorrectFile } from './rules/decorator-in-correct-file';

// ESLint 8.x 需要使用 module.exports = 
module.exports = {
  meta: {
    name: '@qwe8652591/eslint-plugin',
    version: '0.2.0',
  },
  rules: {
    // Logic 层规则（原 Domain）
    'no-async-in-logic': noAsyncInLogic,
    'no-this-in-logic': noThisInLogic,
    
    // Entity 层规则（原 Model）
    'entity-fields-only': entityFieldsOnly,
    'no-async-in-entity': noAsyncInEntity,
    
    // 应用服务层规则
    'use-inject-decorator': useInjectDecorator,
    'action-return-type': actionReturnType,
    
    // 内部服务层规则
    'no-expose-in-service': noExposeInService,
    
    // 视图层规则
    'use-define-page': useDefinePage,
    'no-side-effect-in-render': noSideEffectInRender,
    
    // 跨层约束规则
    'no-restricted-imports-in-layer': noRestrictedImportsInLayer,
    
    // 装饰器/定义函数文件约束规则
    'decorator-in-correct-file': decoratorInCorrectFile,
  },
  configs: {
    recommended: {
      plugins: ['@qwe8652591'],
      // 全局规则 - 对所有文件生效（基于文件名自动判断）
      rules: {
        // 跨层引用约束
        '@qwe8652591/no-restricted-imports-in-layer': 'error',
        // 装饰器/定义函数必须在正确后缀的文件中使用
        '@qwe8652591/decorator-in-correct-file': 'error',
      },
      // 按文件类型配置规则
      overrides: [
        // .entity.ts 文件 - 实体层（原 model）
        {
          files: ['**/*.entity.ts'],
          rules: {
            '@qwe8652591/entity-fields-only': 'error',
            '@qwe8652591/no-async-in-entity': 'error',
          },
        },
        // .logic.ts 文件 - 业务逻辑层（原 domain）
        {
          files: ['**/*.logic.ts'],
          rules: {
            '@qwe8652591/no-async-in-logic': 'error',
            '@qwe8652591/no-this-in-logic': 'error',
          },
        },
        // .appservice.ts 文件 - 应用服务层
        {
          files: ['**/*.appservice.ts'],
          rules: {
            '@qwe8652591/use-inject-decorator': 'warn',
            '@qwe8652591/action-return-type': 'error',
          },
        },
        // .service.ts 文件 - 内部服务层（不含 appservice）
        {
          files: ['**/*.service.ts'],
          excludedFiles: ['**/*.appservice.ts'],
          rules: {
            '@qwe8652591/use-inject-decorator': 'warn',
            '@qwe8652591/action-return-type': 'error',
            '@qwe8652591/no-expose-in-service': 'error',
          },
        },
        // .repository.ts 文件 - 仓储层
        {
          files: ['**/*.repository.ts'],
          rules: {
            '@qwe8652591/use-inject-decorator': 'warn',
            '@qwe8652591/no-expose-in-service': 'error',
          },
        },
        // .page.tsx 文件 - 页面层
        {
          files: ['**/*.page.tsx'],
          rules: {
            '@qwe8652591/use-define-page': 'error',
            '@qwe8652591/no-side-effect-in-render': 'error',
          },
        },
        // .component.tsx 文件 - 组件层
        {
          files: ['**/*.component.tsx'],
          rules: {
            '@qwe8652591/no-side-effect-in-render': 'error',
      },
        },
      ],
    },
  },
};
