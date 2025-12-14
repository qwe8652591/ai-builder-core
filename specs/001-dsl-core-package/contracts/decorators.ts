/**
 * @ai-builder/dsl 装饰器契约定义
 * 基于 TypeScript 5.0+ Stage 3 Decorators
 */

// =================================================================================================
// 1. Model Decorators (模型装饰器)
// =================================================================================================

/**
 * 实体装饰器选项
 */
export interface EntityOptions {
  /** 数据库表名，默认使用类名转下划线 */
  table?: string;
  /** 表注释 */
  comment?: string;
  /** 是否为抽象实体（不会生成表，仅供继承） */
  abstract?: boolean;
}

/**
 * 实体装饰器
 * 标记一个类为领域实体
 * @example
 * ```ts
 * @Entity({ table: 'sys_user', comment: '系统用户' })
 * class User { ... }
 * ```
 */
export declare function Entity(options?: EntityOptions): ClassDecorator;

/**
 * 字段装饰器选项
 */
export interface FieldOptions {
  /** 字段显示标签（用于 UI 生成） */
  label: string;
  /** 数据库列名，默认使用属性名转下划线 */
  column?: string;
  /** 字段类型（通常自动推断，特殊类型需指定，如 'text', 'json'） */
  type?: string;
  /** 是否允许为空，默认为 false */
  nullable?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 字段注释 */
  comment?: string;
  /** 是否支持国际化 */
  i18n?: boolean;
}

/**
 * 字段装饰器
 * 标记类的属性为实体字段
 * @example
 * ```ts
 * @Field({ label: '用户名' })
 * username: string;
 * ```
 */
export declare function Field(options: FieldOptions): PropertyDecorator;

/**
 * 组合关系装饰器选项 (1:1, 1:N)
 * 组合关系表示强依赖，生命周期绑定
 */
export interface CompositionOptions {
  /** 关联的目标实体类型（解决循环引用） */
  target: () => Function;
  /** 关联类型：'OneToOne' | 'OneToMany' */
  type: 'OneToOne' | 'OneToMany';
  /** 级联操作配置 */
  cascade?: boolean | ('insert' | 'update' | 'remove')[];
  /** 字段标签 */
  label?: string;
}

/**
 * 组合关系装饰器
 * @example
 * ```ts
 * @Composition({ target: () => OrderItem, type: 'OneToMany' })
 * items: OrderItem[];
 * ```
 */
export declare function Composition(options: CompositionOptions): PropertyDecorator;

/**
 * 关联关系装饰器选项 (N:1, M:N)
 * 关联关系表示弱依赖，引用关系
 */
export interface AssociationOptions {
  /** 关联的目标实体类型 */
  target: () => Function;
  /** 关联类型：'ManyToOne' | 'ManyToMany' */
  type: 'ManyToOne' | 'ManyToMany';
  /** 外键字段名 */
  joinColumn?: string;
  /** 字段标签 */
  label?: string;
}

/**
 * 关联关系装饰器
 * @example
 * ```ts
 * @Association({ target: () => Department, type: 'ManyToOne' })
 * department: Department;
 * ```
 */
export declare function Association(options: AssociationOptions): PropertyDecorator;

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
 * @example
 * ```ts
 * @Validation({ required: true, email: true, message: '请输入有效的邮箱' })
 * email: string;
 * ```
 */
export declare function Validation(options: ValidationOptions): PropertyDecorator;


// =================================================================================================
// 2. Service Decorators (服务装饰器)
// =================================================================================================

/**
 * 领域逻辑装饰器
 * 标记纯业务逻辑类，可跨端复用
 */
export declare function DomainLogic(): ClassDecorator;

/**
 * 应用服务装饰器
 * 标记应用层服务，处理编排、事务
 */
export declare function AppService(): ClassDecorator;

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
export declare function Action(options?: ActionOptions): MethodDecorator;

/**
 * 规则装饰器
 * 标记业务规则方法（通常返回 boolean）
 */
export declare function Rule(description?: string): MethodDecorator;

/**
 * 依赖注入装饰器
 * @param token - 注入的 token 或 类
 */
export declare function Inject(token?: any): PropertyDecorator;

/**
 * 暴露装饰器
 * 标记该服务或方法可被 API 暴露
 */
export declare function Expose(path?: string): MethodDecorator & ClassDecorator;


// =================================================================================================
// 3. Types for TS 5.0+ Decorators
// =================================================================================================

// 重新定义 ClassDecorator 等以匹配 Stage 3 标准
// 注意：在实际实现代码中，直接使用 TypeScript 内置的 DecoratorContext 类型即可
// 这里为了契约清晰，显式声明类型签名

type ClassDecorator = <T extends Function>(target: T, context: ClassDecoratorContext<T>) => T | void;
type PropertyDecorator = <T, V>(target: undefined, context: ClassFieldDecoratorContext<T, V>) => (initialValue: V) => V | void;
type MethodDecorator = <T, A extends any[], R>(target: (this: T, ...args: A) => R, context: ClassMethodDecoratorContext<T, (this: T, ...args: A) => R>) => (this: T, ...args: A) => R | void;






