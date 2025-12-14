/**
 * 事务上下文管理器
 * 
 * 用于在 AppService -> Service -> Repository 之间传递事务
 * 类似于 Spring 的事务传播机制
 * 
 * 在浏览器环境中，使用 Map 存储当前事务
 * 在 Node.js 环境中，可以使用 AsyncLocalStorage 实现更强的隔离
 */

/**
 * 事务上下文存储
 */
class TransactionContextManager {
  private static instance = new TransactionContextManager();
  
  // 存储当前执行栈的事务
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private currentTransaction: any | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transactionStack: Array<any> = [];

  static getInstance() {
    return this.instance;
  }

  /**
   * 设置当前事务
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransaction(trx: any): void {
    this.transactionStack.push(trx);
    this.currentTransaction = trx;
  }

  /**
   * 获取当前事务
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTransaction(): any | null {
    return this.currentTransaction;
  }

  /**
   * 检查是否存在事务
   */
  hasTransaction(): boolean {
    return this.currentTransaction !== null;
  }

  /**
   * 清除当前事务
   */
  clearTransaction(): void {
    this.transactionStack.pop();
    this.currentTransaction = this.transactionStack[this.transactionStack.length - 1] || null;
  }

  /**
   * 执行带事务上下文的代码
   */
  async runInTransaction<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trx: any,
    callback: () => Promise<T>
  ): Promise<T> {
    this.setTransaction(trx);
    try {
      return await callback();
    } finally {
      this.clearTransaction();
    }
  }
}

export const transactionContext = TransactionContextManager.getInstance();

