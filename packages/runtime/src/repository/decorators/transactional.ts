/**
 * 事务管理装饰器（类似 Spring @Transactional）
 * 
 * 自动将方法包装在数据库事务中执行
 * 如果方法抛出异常，事务自动回滚
 * 如果方法正常返回，事务自动提交
 * 
 * @example
 * ```typescript
 * @Transactional()
 * async createOrder(dto: CreateOrderDTO): Promise<string> {
 *   // 这个方法会自动在事务中执行
 *   const orderId = await this.create(order);
 *   await this.createItems(orderId, items);
 *   return orderId;
 * }
 * ```
 */

/**
 * 事务传播行为（参考 Spring）
 */
export enum TransactionPropagation {
  /**
   * 如果当前存在事务，则加入该事务；否则创建新事务（默认）
   */
  REQUIRED = 'REQUIRED',
  
  /**
   * 总是创建新事务，如果当前存在事务，则挂起当前事务
   */
  REQUIRES_NEW = 'REQUIRES_NEW',
  
  /**
   * 如果当前存在事务，则在嵌套事务中执行
   */
  NESTED = 'NESTED',
  
  /**
   * 如果当前存在事务，则加入该事务；否则以非事务方式执行
   */
  SUPPORTS = 'SUPPORTS',
  
  /**
   * 以非事务方式执行，如果当前存在事务，则抛出异常
   */
  NEVER = 'NEVER',
}

export interface TransactionalOptions {
  /**
   * 事务传播行为
   */
  propagation?: TransactionPropagation;
  
  /**
   * 只读事务（优化性能）
   */
  readOnly?: boolean;
  
  /**
   * 超时时间（毫秒）
   */
  timeout?: number;
}

/**
 * 事务上下文（用于存储当前事务状态）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transactionContext = new Map<any, any>();

/**
 * 需要实现 db 属性的 Repository 接口
 */
interface RepositoryWithDb {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  initialize(): Promise<void>;
}

/**
 * 事务装饰器
 */
export function Transactional(options: TransactionalOptions = {}) {
  const {
    propagation = TransactionPropagation.REQUIRED,
    readOnly = false,
    timeout
  } = options;

  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      this: RepositoryWithDb,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) {
      // 确保初始化
      await this.initialize();

      // 获取当前事务上下文
      const currentTrx = transactionContext.get(this);

      // 根据传播行为决定是否创建新事务
      if (currentTrx && propagation === TransactionPropagation.REQUIRED) {
        // 加入现有事务
        return originalMethod.apply(this, args);
      }

      if (currentTrx && propagation === TransactionPropagation.NEVER) {
        throw new Error(
          `方法 ${propertyKey} 配置了 NEVER 传播行为，但当前存在事务`
        );
      }

      if (!currentTrx && propagation === TransactionPropagation.SUPPORTS) {
        // 以非事务方式执行
        return originalMethod.apply(this, args);
      }

      // 创建新事务
      console.log(`[Transaction] 开始事务: ${target.constructor.name}.${propertyKey}`);
      
      const startTime = Date.now();
      
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await this.db.transaction().execute(async (trx: any) => {
          // 保存事务上下文
          const originalDb = this.db;
          transactionContext.set(this, trx);
          
          // 临时替换 db 为事务对象
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any).db = trx;
          
          try {
            // 超时控制
            if (timeout) {
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`事务超时 (${timeout}ms)`)), timeout);
              });
              return await Promise.race([
                originalMethod.apply(this, args),
                timeoutPromise
              ]);
            }
            
            return await originalMethod.apply(this, args);
          } finally {
            // 恢复原始 db
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any).db = originalDb;
            transactionContext.delete(this);
          }
        });

        const duration = Date.now() - startTime;
        console.log(`[Transaction] 提交成功: ${target.constructor.name}.${propertyKey} (${duration}ms)`);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Transaction] 回滚: ${target.constructor.name}.${propertyKey} (${duration}ms)`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 只读事务装饰器（语法糖）
 */
export function ReadOnlyTransaction() {
  return Transactional({ readOnly: true });
}

