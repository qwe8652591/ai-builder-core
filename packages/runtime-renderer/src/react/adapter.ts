/**
 * Ant Design 5 适配器
 * 
 * 提供预配置的 Ant Design 组件映射，用于 DSL 到 React 的转换
 * 
 * 使用方式：
 * ```typescript
 * import { registerAntdAdapter } from '@ai-builder/runtime-renderer';
 * 
 * // 一行代码完成所有组件注册
 * registerAntdAdapter();
 * ```
 */

import type { AdapterConfig, ComponentMapping } from '@ai-builder/jsx-runtime';
import { registerAdapter, activateAdapter, ADAPTER_NAMES } from '@ai-builder/jsx-runtime';

// 导入所有适配过的组件
import {
  Page,
  Card,
  Row,
  Col,
  Form,
  FormItem,
  Input,
  Select,
  DatePicker,
  Table,
  Button,
  Modal,
  Tag,
  Breadcrumb,
  Menu,
  Descriptions,
  Icon,
  Divider,
  Space,
  Message,
} from './components';

/**
 * Ant Design 5 组件映射
 */
export const antdComponentMapping: ComponentMapping = {
  // 布局组件
  Page,
  Card,
  Row,
  Col,
  Space,
  Divider,
  
  // 表单组件
  Form,
  FormItem,
  Input,
  Select,
  DatePicker,
  
  // 数据展示
  Table,
  Tag,
  Descriptions,
  
  // 反馈组件
  Modal,
  Message,
  
  // 导航组件
  Menu,
  Breadcrumb,
  
  // 基础组件
  Button,
  Icon,
};

/**
 * Ant Design 5 适配器配置
 */
export const antdAdapterConfig: AdapterConfig = {
  name: ADAPTER_NAMES.REACT_ANTD,
  version: '5.x',
  framework: 'react',
  uiLibrary: 'antd',
  components: antdComponentMapping,
};

/**
 * 注册并激活 Ant Design 适配器
 * 
 * 这是最常用的一站式注册方法，调用后即可使用所有组件映射
 * 
 * @example
 * ```typescript
 * import { registerAntdAdapter } from '@ai-builder/runtime-renderer';
 * 
 * // 在应用初始化时调用
 * registerAntdAdapter();
 * ```
 */
export function registerAntdAdapter(): void {
  registerAdapter(antdAdapterConfig);
  activateAdapter(ADAPTER_NAMES.REACT_ANTD);
  console.log('[Adapter] Ant Design 5 适配器已激活');
}

/**
 * 仅注册 Ant Design 适配器（不激活）
 * 
 * 适用于需要注册多个适配器后再选择激活的场景
 */
export function registerAntdAdapterOnly(): void {
  registerAdapter(antdAdapterConfig);
}

/**
 * 获取 Ant Design 组件映射（用于 registerComponents）
 * 
 * 如果你需要自定义组件映射，可以基于此扩展：
 * 
 * @example
 * ```typescript
 * import { getAntdComponentMapping } from '@ai-builder/runtime-renderer';
 * import { registerComponents } from '@ai-builder/jsx-runtime';
 * 
 * const customMapping = {
 *   ...getAntdComponentMapping(),
 *   // 覆盖或扩展
 *   MyCustomTable: CustomTableComponent,
 * };
 * 
 * registerComponents(customMapping);
 * ```
 */
export function getAntdComponentMapping(): ComponentMapping {
  return { ...antdComponentMapping };
}

