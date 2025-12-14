/**
 * 通用类型辅助工具
 */

/**
 * 构造函数类型
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * 抽象构造函数类型
 */
export type AbstractConstructor<T = any> = abstract new (...args: any[]) => T;

/**
 * 提取类的属性（排除方法）
 */
export type PropertiesOf<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

/**
 * 提取类的方法
 */
export type MethodsOf<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

/**
 * 将所有属性变为可选，但保留 id 为必填（如果存在）
 */
export type PartialWithId<T> = Partial<T> & (T extends { id: any } ? { id: T['id'] } : {});

/**
 * 深度 Partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};






