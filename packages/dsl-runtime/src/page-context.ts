/**
 * 页面上下文
 * 
 * 管理单个页面的状态、计算属性、生命周期
 */

import type { VNode } from '@qwe8652591/dsl-core';

/** 生命周期类型 */
export type LifecycleType = 'beforeMount' | 'mounted' | 'beforeUnmount' | 'unmounted';

/** 页面元数据 */
export interface PageMeta {
  title?: string;
  route?: string;
  permission?: string;
  description?: string;
  menu?: {
    parent?: string;
    order?: number;
    icon?: string;
  };
}

/** 页面上下文接口 */
export interface IPageContext {
  /** 页面元数据 */
  meta: PageMeta;
  
  // 状态管理
  registerState<T>(initial: T): string;
  getState<T>(id: string): T;
  setState<T>(id: string, value: T): void;
  
  // 计算属性
  registerComputed<T>(compute: () => T, deps?: any[]): string;
  getComputed<T>(id: string): T;
  
  // 监听
  registerWatch<T>(
    getter: () => T,
    callback: (newValue: T, oldValue: T) => void,
    options?: { immediate?: boolean }
  ): void;
  
  // 副作用
  registerEffect(
    effect: () => void | (() => void) | Promise<void>,
    deps?: any[]
  ): void;
  
  // 生命周期
  registerLifecycle(type: LifecycleType, callback: () => void | Promise<void>): void;
  
  // 服务获取
  getService<T>(name: string): T;
  
  // 销毁
  destroy(): void;
}

/** 当前上下文栈 */
let currentContext: IPageContext | null = null;

/**
 * 获取当前页面上下文
 */
export function getCurrentContext(): IPageContext | null {
  return currentContext;
}

/**
 * 设置当前页面上下文
 */
export function setCurrentContext(ctx: IPageContext | null): void {
  currentContext = ctx;
}

/**
 * 在上下文中执行函数
 */
export function runInContext<T>(ctx: IPageContext, fn: () => T): T {
  const prev = currentContext;
  currentContext = ctx;
  try {
    return fn();
  } finally {
    currentContext = prev;
  }
}

/**
 * 页面上下文实现
 */
export class PageContext implements IPageContext {
  meta: PageMeta;
  
  // 状态存储
  private states = new Map<string, any>();
  private stateCounter = 0;
  private stateListeners = new Map<string, Set<() => void>>();
  
  // 计算属性存储
  private computedDefs = new Map<string, { compute: () => any; deps?: any[] }>();
  private computedCache = new Map<string, any>();
  private computedDirty = new Set<string>();
  private computedCounter = 0;
  
  // 监听器
  private watchers: Array<{
    getter: () => any;
    callback: (newValue: any, oldValue: any) => void;
    lastValue: any;
  }> = [];
  
  // 副作用
  private effects: Array<{
    effect: () => void | (() => void) | Promise<void>;
    cleanup?: () => void;
    deps?: any[];
    lastDeps?: any[];
  }> = [];
  
  // 生命周期
  private lifecycles: Record<LifecycleType, Array<() => void | Promise<void>>> = {
    beforeMount: [],
    mounted: [],
    beforeUnmount: [],
    unmounted: [],
  };
  
  // 服务容器
  private services = new Map<string, any>();
  
  // 渲染结果
  private _renderResult: VNode | null = null;
  
  constructor(meta: PageMeta = {}) {
    this.meta = meta;
  }
  
  // ==================== 状态管理 ====================
  
  registerState<T>(initial: T): string {
    const id = `state_${this.stateCounter++}`;
    this.states.set(id, initial);
    this.stateListeners.set(id, new Set());
    return id;
  }
  
  getState<T>(id: string): T {
    return this.states.get(id) as T;
  }
  
  setState<T>(id: string, value: T): void {
    const oldValue = this.states.get(id);
    if (oldValue === value) return;
    
    this.states.set(id, value);
    
    // 标记相关计算属性为脏
    this.markComputedDirty();
    
    // 通知监听器
    const listeners = this.stateListeners.get(id);
    if (listeners) {
      listeners.forEach(listener => listener());
    }
    
    // 检查 watchers
    this.checkWatchers();
  }
  
  // ==================== 计算属性 ====================
  
  registerComputed<T>(compute: () => T, deps?: any[]): string {
    const id = `computed_${this.computedCounter++}`;
    this.computedDefs.set(id, { compute, deps });
    this.computedDirty.add(id);
    return id;
  }
  
  getComputed<T>(id: string): T {
    const def = this.computedDefs.get(id);
    if (!def) {
      throw new Error(`Computed property not found: ${id}`);
    }
    
    if (this.computedDirty.has(id)) {
      const value = def.compute();
      this.computedCache.set(id, value);
      this.computedDirty.delete(id);
    }
    
    return this.computedCache.get(id) as T;
  }
  
  private markComputedDirty(): void {
    // 简单实现：标记所有计算属性为脏
    for (const id of this.computedDefs.keys()) {
      this.computedDirty.add(id);
    }
  }
  
  // ==================== 监听 ====================
  
  registerWatch<T>(
    getter: () => T,
    callback: (newValue: T, oldValue: T) => void,
    options?: { immediate?: boolean }
  ): void {
    const lastValue = getter();
    this.watchers.push({ getter, callback, lastValue });
    
    if (options?.immediate) {
      callback(lastValue, undefined as any);
    }
  }
  
  private checkWatchers(): void {
    for (const watcher of this.watchers) {
      const newValue = watcher.getter();
      if (newValue !== watcher.lastValue) {
        const oldValue = watcher.lastValue;
        watcher.lastValue = newValue;
        watcher.callback(newValue, oldValue);
      }
    }
  }
  
  // ==================== 副作用 ====================
  
  registerEffect(
    effect: () => void | (() => void) | Promise<void>,
    deps?: any[]
  ): void {
    this.effects.push({ effect, deps });
  }
  
  async runEffects(): Promise<void> {
    for (const effectDef of this.effects) {
      const { effect, deps, lastDeps, cleanup } = effectDef;
      
      // 检查依赖是否变化
      const shouldRun = !lastDeps || !deps || !depsEqual(deps, lastDeps);
      
      if (shouldRun) {
        // 执行清理函数
        if (cleanup) {
          cleanup();
        }
        
        // 执行副作用
        const result = effect();
        
        // 如果返回清理函数，保存它
        if (typeof result === 'function') {
          effectDef.cleanup = result;
        }
        
        // 更新依赖
        effectDef.lastDeps = deps ? [...deps] : undefined;
      }
    }
  }
  
  // ==================== 生命周期 ====================
  
  registerLifecycle(type: LifecycleType, callback: () => void | Promise<void>): void {
    this.lifecycles[type].push(callback);
  }
  
  async triggerLifecycle(type: LifecycleType): Promise<void> {
    for (const callback of this.lifecycles[type]) {
      await callback();
    }
  }
  
  // ==================== 服务 ====================
  
  registerService<T>(name: string, service: T): void {
    this.services.set(name, service);
  }
  
  getService<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }
    return service as T;
  }
  
  // ==================== 渲染 ====================
  
  get renderResult(): VNode | null {
    return this._renderResult;
  }
  
  setRenderResult(vnode: VNode | null): void {
    this._renderResult = vnode;
  }
  
  // ==================== 生命周期管理 ====================
  
  async mount(): Promise<void> {
    await this.triggerLifecycle('beforeMount');
    await this.runEffects();
    await this.triggerLifecycle('mounted');
  }
  
  async unmount(): Promise<void> {
    await this.triggerLifecycle('beforeUnmount');
    
    // 执行所有清理函数
    for (const effectDef of this.effects) {
      if (effectDef.cleanup) {
        effectDef.cleanup();
      }
    }
    
    await this.triggerLifecycle('unmounted');
  }
  
  // ==================== 销毁 ====================
  
  destroy(): void {
    this.states.clear();
    this.stateListeners.clear();
    this.computedDefs.clear();
    this.computedCache.clear();
    this.computedDirty.clear();
    this.watchers = [];
    this.effects = [];
    this.services.clear();
    this._renderResult = null;
  }
}

/**
 * 比较依赖数组是否相等
 */
function depsEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

