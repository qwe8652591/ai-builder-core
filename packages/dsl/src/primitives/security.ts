/**
 * 安全上下文接口
 * 用于在业务逻辑中获取当前用户信息、租户信息等
 */
export interface SecurityContext {
  /**
   * 获取当前用户 ID
   * @throws 如果未登录则抛出异常
   */
  getUserId(): string;

  /**
   * 获取当前用户 ID (可为空)
   */
  getUserIdOrNull(): string | null;

  /**
   * 获取当前租户 ID
   */
  getTenantId(): string;

  /**
   * 获取当前用户角色列表
   */
  getRoles(): string[];

  /**
   * 检查是否拥有指定权限
   * @param permission 权限标识
   */
  hasPermission(permission: string): boolean;

  /**
   * 获取当前用户详情
   * @template T 用户详情类型
   */
  getUser<T = any>(): T | null;
}

// 导出变量声明
export declare const SecurityContext: SecurityContext;






