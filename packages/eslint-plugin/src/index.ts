import { noAsyncInDomain } from './rules/no-async-in-domain';
import { noThisInDomain } from './rules/no-this-in-domain';
import { modelFieldsOnly } from './rules/model-fields-only';
import { useInjectDecorator } from './rules/use-inject-decorator';
import { actionReturnType } from './rules/action-return-type';
import { noRestrictedImportsInLayer } from './rules/no-restricted-imports-in-layer';
import { noAsyncInModel } from './rules/no-async-in-model';
import { useDefinePage } from './rules/use-define-page';
import { noSideEffectInRender } from './rules/no-side-effect-in-render';
import { noExposeInService } from './rules/no-expose-in-service';

// ESLint 8.x 需要使用 module.exports = 
module.exports = {
  meta: {
    name: '@ai-builder/eslint-plugin',
    version: '0.1.0',
  },
  rules: {
    // 领域层规则
    'no-async-in-domain': noAsyncInDomain,
    'no-this-in-domain': noThisInDomain,
    
    // 模型层规则
    'model-fields-only': modelFieldsOnly,
    'no-async-in-model': noAsyncInModel,
    
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
  },
  configs: {
    recommended: {
      plugins: ['@ai-builder'],
      rules: {
        // 领域层规则
        '@ai-builder/no-async-in-domain': 'error',
        '@ai-builder/no-this-in-domain': 'error',
        
        // 模型层规则
        '@ai-builder/model-fields-only': 'error',
        '@ai-builder/no-async-in-model': 'error',
        
        // 应用服务层规则
        '@ai-builder/use-inject-decorator': 'warn',
        '@ai-builder/action-return-type': 'error',
        
        // 内部服务层规则
        '@ai-builder/no-expose-in-service': 'error',
        
        // 视图层规则
        '@ai-builder/use-define-page': 'error',
        '@ai-builder/no-side-effect-in-render': 'error',
        
        // 跨层约束规则
        '@ai-builder/no-restricted-imports-in-layer': 'error',
      },
    },
  },
};

