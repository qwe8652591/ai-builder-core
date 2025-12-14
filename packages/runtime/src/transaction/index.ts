/**
 * 事务管理模块
 * 
 * 提供类似 Spring 的事务管理能力
 */

export { transactionContext } from './context';
export { 
  AppTransactional, 
  AppReadOnlyTransaction,
  setDbGetter,
  type AppTransactionalOptions 
} from './app-transactional';

