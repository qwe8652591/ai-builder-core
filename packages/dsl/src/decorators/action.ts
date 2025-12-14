import { metadataStore } from '../utils/metadata';

/**
 * 动作/方法装饰器选项
 */
export interface ActionOptions {
  /** 动作名称/描述 */
  name?: string;
  /** 是否开启事务 */
  transactional?: boolean;
  /** 缓存配置 */
  cache?: { ttl: number; key?: string };
}

/**
 * 动作装饰器
 * 标记业务方法
 */
export function Action(options: ActionOptions = {}) {
  return function (target: any, propertyKeyOrContext: string | ClassMethodDecoratorContext, descriptor?: PropertyDescriptor) {
    let methodName: string;

    if (typeof propertyKeyOrContext === 'string') {
      methodName = propertyKeyOrContext;
    } else {
      methodName = propertyKeyOrContext.name as string;
    }

    const registerMetadata = () => {
      const className = typeof target === 'function' ? target.name : target.constructor.name;
      metadataStore.registerField(className, methodName, { ...options, isAction: true });
    };

    if (typeof propertyKeyOrContext !== 'string' && propertyKeyOrContext.addInitializer) {
       propertyKeyOrContext.addInitializer(registerMetadata);
       return target; // 新版方法装饰器返回 target
    } else {
       registerMetadata();
       // 旧版装饰器不需要返回值，或返回 descriptor
       return descriptor; 
    }
  };
}

/**
 * 规则装饰器
 * 标记业务规则方法（通常返回 boolean）
 */
export function Rule(description?: string) {
  return function (target: any, propertyKeyOrContext: string | ClassMethodDecoratorContext, descriptor?: PropertyDescriptor) {
    let methodName: string;

    if (typeof propertyKeyOrContext === 'string') {
      methodName = propertyKeyOrContext;
    } else {
      methodName = propertyKeyOrContext.name as string;
    }

    const registerMetadata = () => {
      const className = typeof target === 'function' ? target.name : target.constructor.name;
      metadataStore.registerField(className, methodName, { description, isRule: true });
    };

    if (typeof propertyKeyOrContext !== 'string' && propertyKeyOrContext.addInitializer) {
       propertyKeyOrContext.addInitializer(registerMetadata);
       return target;
    } else {
       registerMetadata();
       return descriptor;
    }
  };
}

/**
 * 依赖注入装饰器
 */
export function Inject(token?: any) {
  return function (target: any, propertyKeyOrContext: string | ClassFieldDecoratorContext) {
    let fieldName: string;

    if (typeof propertyKeyOrContext === 'string') {
      fieldName = propertyKeyOrContext;
    } else {
      fieldName = propertyKeyOrContext.name as string;
    }
    
    const registerMetadata = () => {
      const className = typeof target === 'function' ? target.name : target.constructor.name;
      metadataStore.registerField(className, fieldName, { token, isInject: true });
    };

    if (typeof propertyKeyOrContext !== 'string' && propertyKeyOrContext.addInitializer) {
       propertyKeyOrContext.addInitializer(registerMetadata);
       return function(initialValue: any) { return initialValue; }
    } else {
       registerMetadata();
    }
  };
}

/**
 * 暴露装饰器
 * 标记该服务或方法可被 API 暴露
 * 支持 Method 和 Class 装饰器
 */
export function Expose(path?: string) {
  return function(target: any, propertyKeyOrContext?: string | any, descriptor?: PropertyDescriptor) {
    // 判断是否为新版装饰器 (context 对象存在且不是 string)
    const isNewDecorator = propertyKeyOrContext && typeof propertyKeyOrContext !== 'string' && 'kind' in propertyKeyOrContext;
    
    if (isNewDecorator) {
        const context = propertyKeyOrContext;
        if (context.kind === 'class') {
           metadataStore.registerEntity(context.name, { exposed: true, path });
           return undefined;
        } else if (context.kind === 'method') {
           context.addInitializer(function(this: any) {
             const className = this.constructor.name;
             metadataStore.registerField(className, context.name, { exposed: true, path });
           });
           return target;
        }
    } else {
        // 旧版装饰器
        if (typeof propertyKeyOrContext === 'string') {
            // Method Decorator
            const className = target.constructor.name;
            metadataStore.registerField(className, propertyKeyOrContext, { exposed: true, path });
            return descriptor;
        } else {
            // Class Decorator
            const className = target.name;
             metadataStore.registerEntity(className, { exposed: true, path });
             // 旧版类装饰器返回构造函数或 void
        }
    }
  } as any; 
}

