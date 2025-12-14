import { metadataStore } from '../utils/metadata';

/**
 * 验证规则装饰器选项
 * 基于常用验证库的规则集
 */
export interface ValidationOptions {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  email?: boolean;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

/**
 * 验证装饰器
 */
export function Validation(options: ValidationOptions) {
  return function (target: any, propertyKeyOrContext: string | ClassFieldDecoratorContext) {
    let fieldName: string;

    if (typeof propertyKeyOrContext === 'string') {
      fieldName = propertyKeyOrContext;
    } else {
      fieldName = propertyKeyOrContext.name as string;
    }

    const registerMetadata = () => {
      const className = typeof target === 'function' ? target.name : target.constructor.name;
      metadataStore.registerField(className, fieldName, { ...options, isValidation: true });
    };

    if (typeof propertyKeyOrContext !== 'string' && propertyKeyOrContext.addInitializer) {
       propertyKeyOrContext.addInitializer(registerMetadata);
       return function(initialValue: any) { return initialValue; }
    } else {
       registerMetadata();
    }
  };
}

