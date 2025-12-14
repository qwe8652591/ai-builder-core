/**
 * 依赖注入 Token 定义
 * 使用 Symbol 确保类型安全和唯一性
 */

/**
 * 基础设施 Token
 */
export const TOKENS = {
  /** Decimal 高精度计算类 */
  Decimal: Symbol.for('Decimal'),
  
  /** 事件总线 */
  EventBus: Symbol.for('EventBus'),
  
  /** Hook 注册表 */
  Hooks: Symbol.for('Hooks'),
  
  /** 安全上下文 */
  SecurityContext: Symbol.for('SecurityContext'),
  
  /** Repository 工厂 */
  RepoFactory: Symbol.for('RepoFactory'),
  
  /**
   * 创建 Repository Token
   * @example TOKENS.Repo('Product') => Symbol.for('Repo<Product>')
   */
  Repo: <T extends string>(entityName: T) => Symbol.for(`Repo<${entityName}>`),
} as const;

/**
 * Token 类型定义
 */
export type TokenType = typeof TOKENS;

/**
 * 将 Token Symbol 转换为字符串（用于调试）
 */
export function tokenToString(token: symbol): string {
  return token.description || token.toString();
}





