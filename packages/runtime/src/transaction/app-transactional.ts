/**
 * AppService 层事务装饰器
 * 
 * 用于 AppService 层的方法，自动管理整个业务流程的事务
 * 事务会自动传递到 Service 层和 Repository 层
 * 
 * @example
 * ```typescript
 * @AppService()
 * export class PurchaseOrderAppService {
 *   @AppTransactional()
 *   async createOrder(dto: CreateOrderDTO): Promise<Result<string>> {
 *     // 这个方法中调用的所有 Service 和 Repository 操作
 *     // 都会在同一个事务中执行
 *     const orderId = await this.service.createOrder(dto);
 *     return ResultHelper.success(orderId);
 *   }
 * }
 * ```
 */

import { transactionContext } from './context';

// 全局数据库获取函数（由应用初始化时注入）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbGetter = () => Promise<any>;
let globalDbGetter: DbGetter | null = null;

/**
 * 设置全局数据库获取函数
 * 
 * 在应用启动时调用，注入数据库获取函数
 * 
 * @example
 * ```typescript
 * import { setDbGetter } from '@ai-builder/runtime';
 * import { getDb } from './kysely.browser';
 * 
 * setDbGetter(getDb);
 * ```
 */
export function setDbGetter(getter: DbGetter): void {
  globalDbGetter = getter;
}

/**
 * 获取数据库实例
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDb(): Promise<any> {
  if (!globalDbGetter) {
    throw new Error(
      'Database getter not set. Please call setDbGetter() during application initialization.'
    );
  }
  return globalDbGetter();
}

export interface AppTransactionalOptions {
  /**
   * 超时时间（毫秒）
   */
  timeout?: number;
  
  /**
   * 只读事务（优化性能）
   */
  readOnly?: boolean;
}

/**
 * AppService 层事务装饰器
 */
export function AppTransactional(options: AppTransactionalOptions = {}) {
  const { timeout, readOnly = false } = options;

  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (this: any, ...args: any[]) {
      // 如果已经在事务中，直接执行（避免嵌套）
      if (transactionContext.hasTransaction()) {
        console.log(`[Transaction] ${target.constructor.name}.${propertyKey} - 加入现有事务`);
        return originalMethod.apply(this, args);
      }

      // 获取数据库实例
      const db = await getDb();

      console.log(`[Transaction] 开始事务: ${target.constructor.name}.${propertyKey}${readOnly ? ' (只读)' : ''}`);
      const startTime = Date.now();

      try {
        // 开启事务
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await db.transaction().execute(async (trx: any) => {
          // 在事务上下文中执行
          return await transactionContext.runInTransaction(trx, async () => {
            // 超时控制
            if (timeout) {
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                  () => reject(new Error(`事务超时 (${timeout}ms)`)),
                  timeout
                );
              });
              
              return await Promise.race([
                originalMethod.apply(this, args),
                timeoutPromise
              ]);
            }
            
            // 执行原方法
            return await originalMethod.apply(this, args);
          });
        });

        const duration = Date.now() - startTime;
        console.log(`[Transaction] ✅ 提交成功: ${target.constructor.name}.${propertyKey} (${duration}ms)`);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Transaction] ❌ 回滚: ${target.constructor.name}.${propertyKey} (${duration}ms)`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 只读事务装饰器（语法糖）
 */
export function AppReadOnlyTransaction() {
  return AppTransactional({ readOnly: true });
}

