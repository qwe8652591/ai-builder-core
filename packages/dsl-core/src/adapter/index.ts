/**
 * UI 适配器层
 * 
 * 提供框架无关的适配器接口，支持多种 UI 框架的切换
 * 
 * 架构：
 * - jsx-runtime: 定义适配器接口 + 注册机制（本文件）
 * - runtime-renderer: 提供具体实现（Ant Design 适配器）
 * - 未来: 可添加 Element Plus、Material UI 等适配器
 */

// ==================== 适配器接口定义 ====================

/**
 * 组件适配器类型
 * 可以是 React 组件、Vue 组件或其他框架组件
 * 使用 any 类型以支持各种框架的组件签名
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentAdapter = any;

/**
 * 组件映射表
 * 键: DSL 组件名称（如 'Table', 'Button'）
 * 值: 目标框架的组件实现
 */
export type ComponentMapping = Record<string, ComponentAdapter>;

/**
 * 适配器配置
 */
export interface AdapterConfig {
  /** 适配器名称 */
  name: string;
  /** 适配器版本 */
  version?: string;
  /** 目标 UI 框架 */
  framework: 'react' | 'vue' | 'native';
  /** UI 库名称 */
  uiLibrary?: string;
  /** 组件映射 */
  components: ComponentMapping;
  /** VNode 转换函数（可选） */
  vnodeTransformer?: (vnode: unknown) => unknown;
}

/**
 * 适配器注册表（单例）
 */
class AdapterRegistry {
  private adapters = new Map<string, AdapterConfig>();
  private activeAdapter: AdapterConfig | null = null;
  private componentMapping: ComponentMapping = {};
  
  /**
   * 注册适配器
   */
  register(config: AdapterConfig): void {
    this.adapters.set(config.name, config);
    console.log(`[AdapterRegistry] 已注册适配器: ${config.name} (${config.framework}/${config.uiLibrary || 'default'})`);
  }
  
  /**
   * 激活适配器
   */
  activate(name: string): void {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`适配器 "${name}" 未注册`);
    }
    
    this.activeAdapter = adapter;
    this.componentMapping = { ...adapter.components };
    console.log(`[AdapterRegistry] 已激活适配器: ${name}`);
  }
  
  /**
   * 获取当前激活的适配器
   */
  getActive(): AdapterConfig | null {
    return this.activeAdapter;
  }
  
  /**
   * 获取组件映射
   */
  getComponentMapping(): ComponentMapping {
    return this.componentMapping;
  }
  
  /**
   * 获取指定组件
   */
  getComponent(name: string): ComponentAdapter | undefined {
    return this.componentMapping[name];
  }
  
  /**
   * 覆盖/扩展组件映射
   * 用于用户自定义组件或覆盖默认实现
   */
  extendComponents(mapping: ComponentMapping): void {
    this.componentMapping = { ...this.componentMapping, ...mapping };
    console.log(`[AdapterRegistry] 扩展组件映射: ${Object.keys(mapping).join(', ')}`);
  }
  
  /**
   * 获取所有已注册的适配器名称
   */
  getRegisteredAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }
  
  /**
   * 重置（用于测试）
   */
  reset(): void {
    this.adapters.clear();
    this.activeAdapter = null;
    this.componentMapping = {};
  }
}

// 全局适配器注册表
export const adapterRegistry = new AdapterRegistry();

// ==================== 便捷函数 ====================

/**
 * 注册适配器
 */
export function registerAdapter(config: AdapterConfig): void {
  adapterRegistry.register(config);
}

/**
 * 激活适配器
 */
export function activateAdapter(name: string): void {
  adapterRegistry.activate(name);
}

/**
 * 注册组件映射（兼容旧 API）
 * 这是 registerComponents 的别名，保持向后兼容
 */
export function registerComponentMapping(mapping: ComponentMapping): void {
  adapterRegistry.extendComponents(mapping);
}

/**
 * 获取组件
 */
export function getAdaptedComponent(name: string): ComponentAdapter | undefined {
  return adapterRegistry.getComponent(name);
}

/**
 * 获取所有组件映射
 */
export function getAllComponentMappings(): ComponentMapping {
  return adapterRegistry.getComponentMapping();
}

// ==================== 预定义适配器名称常量 ====================

export const ADAPTER_NAMES = {
  REACT_ANTD: 'react-antd',
  REACT_MUI: 'react-mui',
  VUE_ELEMENT: 'vue-element-plus',
  VUE_ANTD: 'vue-antd',
} as const;

export type AdapterName = typeof ADAPTER_NAMES[keyof typeof ADAPTER_NAMES];

