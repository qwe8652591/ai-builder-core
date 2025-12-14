/**
 * 自动装配模块
 * 
 * 类似 Spring Boot 的自动装配能力
 * 通过 @Repository、@Service、@AppService 装饰器声明依赖，自动扫描并创建实例
 * 
 * @example
 * ```typescript
 * // 1. 定义服务（使用 DSL 装饰器）
 * @Repository()
 * export class PurchaseOrderRepository { }
 * 
 * @Service({ deps: [PurchaseOrderRepository] })
 * export class PurchaseOrderService {
 *   constructor(private repo: PurchaseOrderRepository) {}
 * }
 * 
 * @AppService({ deps: [PurchaseOrderService, LocalEventBus] })
 * export class PurchaseOrderAppService {
 *   constructor(private service: PurchaseOrderService, private eventBus: EventBus) {}
 * }
 * 
 * // 2. 自动装配
 * await autoWire({
 *   beforeWire: async () => {
 *     await initBrowserDatabase();
 *     setRepositoryDbGetter(getDb);
 *   }
 * });
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getServiceRegistry, type ServiceMetadata } from '@ai-builder/dsl';
import { globalContainer } from './simple-container';

/**
 * 自动装配配置
 */
export interface AutoWireOptions {
  /**
   * 装配前的钩子（如初始化数据库）
   */
  beforeWire?: () => Promise<void>;
  
  /**
   * 装配后的钩子
   */
  afterWire?: () => Promise<void>;
  
  /**
   * 是否打印详细日志
   */
  verbose?: boolean;
}

/**
 * 拓扑排序服务（处理依赖关系）
 */
function topologicalSort(
  services: Map<new (...args: any[]) => any, ServiceMetadata>
): ServiceMetadata[] {
  const result: ServiceMetadata[] = [];
  const visited = new Set<new (...args: any[]) => any>();
  const visiting = new Set<new (...args: any[]) => any>();
  
  function visit(constructor: new (...args: any[]) => any) {
    if (visited.has(constructor)) return;
    
    if (visiting.has(constructor)) {
      throw new Error(`[AutoWire] 检测到循环依赖: ${constructor.name}`);
    }
    
    visiting.add(constructor);
    
    const metadata = services.get(constructor);
    if (metadata) {
      for (const dep of metadata.deps) {
        if (services.has(dep)) {
          visit(dep);
        }
      }
      
      visiting.delete(constructor);
      visited.add(constructor);
      result.push(metadata);
    }
  }
  
  for (const constructor of services.keys()) {
    visit(constructor);
  }
  
  return result;
}

/**
 * 自动装配所有服务
 * 
 * 基于 @Repository、@Service、@AppService 装饰器中声明的 deps 参数，
 * 自动解析依赖关系并创建实例。
 * 
 * @example
 * ```typescript
 * await autoWire({
 *   beforeWire: async () => {
 *     await initBrowserDatabase();
 *     setRepositoryDbGetter(getDb);
 *   },
 *   verbose: true
 * });
 * ```
 */
export async function autoWire(options: AutoWireOptions = {}): Promise<void> {
  const { beforeWire, afterWire, verbose = true } = options;
  
  // 从 DSL 获取服务注册表
  const serviceRegistry = getServiceRegistry();
  
  if (verbose) {
    console.log('[AutoWire] 开始自动装配...');
    console.log(`[AutoWire] 发现 ${serviceRegistry.size} 个服务`);
  }
  
  // 1. 执行装配前钩子
  if (beforeWire) {
    if (verbose) console.log('[AutoWire] 执行 beforeWire 钩子...');
    await beforeWire();
  }
  
  // 2. 拓扑排序（确保依赖先创建）
  const sortedServices = topologicalSort(serviceRegistry);
  
  if (verbose) {
    console.log('[AutoWire] 装配顺序:', sortedServices.map(s => s.name).join(' → '));
  }
  
  // 3. 按顺序创建实例并注册
  for (const metadata of sortedServices) {
    const { constructor, deps, name } = metadata;
    
    // 解析依赖
    const resolvedDeps = deps.map(dep => {
      try {
        return globalContainer.resolve(dep);
      } catch {
        throw new Error(
          `[AutoWire] 无法解析 ${name} 的依赖 ${dep.name}。请确保依赖已注册或在装饰器的 deps 中声明。`
        );
      }
    });
    
    // 创建实例
    const instance = new constructor(...resolvedDeps);
    
    // 注册到容器（默认单例）
    globalContainer.register(constructor, { useValue: instance });
    
    if (verbose) {
      console.log(`[AutoWire] ✅ ${name} (deps: [${deps.map(d => d.name).join(', ')}])`);
    }
  }
  
  // 4. 执行装配后钩子
  if (afterWire) {
    if (verbose) console.log('[AutoWire] 执行 afterWire 钩子...');
    await afterWire();
  }
  
  if (verbose) {
    console.log('[AutoWire] 自动装配完成！');
    const registeredNames = sortedServices.map(m => m.name);
    console.log('[AutoWire] 已注册服务:', registeredNames.join(', '));
  }
}
