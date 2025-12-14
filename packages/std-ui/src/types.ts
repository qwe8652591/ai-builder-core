/**
 * 标准 UI 组件公共类型定义
 * 
 * 本文件定义所有标准组件共用的基础类型、Props 基类和事件类型。
 * 
 * @packageDocumentation
 */

/**
 * CSS 样式对象类型
 * 
 * 兼容 React 和 Vue 的样式定义。
 */
export type CSSProperties = Record<string, string | number>;

/**
 * 基础 Props 接口
 * 
 * 所有标准组件都继承此接口，包含通用属性。
 */
export interface BaseProps {
  /**
   * 组件 CSS 类名
   */
  className?: string;
  
  /**
   * 组件内联样式
   */
  style?: CSSProperties;
  
  /**
   * 组件 ID
   */
  id?: string;
  
  /**
   * 透传给原生组件的属性（框架特定）
   * 
   * 用于传递当前标准组件协议不支持的原生 UI 库属性。
   * 
   * @example
   * ```tsx
   * <Table
   *   data={users}
   *   nativeProps={{
   *     // Element Plus 专有属性
   *     highlightCurrentRow: true
   *   }}
   * />
   * ```
   */
  nativeProps?: Record<string, unknown>;
}

/**
 * 尺寸类型
 * 
 * 通用的组件尺寸枚举。
 */
export type Size = 'large' | 'default' | 'small';

/**
 * 按钮类型
 * 
 * 标准按钮样式类型。
 */
export type ButtonType = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'link';

/**
 * 对齐方式
 */
export type Alignment = 'left' | 'center' | 'right';

/**
 * 事件回调类型
 * 
 * 通用的事件处理函数类型。
 */
export type EventCallback<T = void> = (event: T) => void | Promise<void>;

/**
 * 点击事件回调
 */
export type ClickCallback = EventCallback<MouseEvent>;

/**
 * 输入事件回调
 */
export type InputCallback = EventCallback<string>;

/**
 * 变化事件回调
 */
export type ChangeCallback<T = unknown> = EventCallback<T>;

/**
 * 子节点类型
 * 
 * 组件可接收的子节点类型。
 */
export type Children = unknown; // JSX.Element | JSX.Element[] | string | number | null | undefined;

/**
 * 表单规则
 * 
 * 统一的表单验证规则接口（兼容 async-validator）。
 */
export interface FormRule {
  /**
   * 是否必填
   */
  required?: boolean;
  
  /**
   * 错误提示消息
   */
  message?: string;
  
  /**
   * 触发验证的时机
   */
  trigger?: 'blur' | 'change' | 'submit';
  
  /**
   * 最小长度
   */
  min?: number;
  
  /**
   * 最大长度
   */
  max?: number;
  
  /**
   * 正则表达式验证
   */
  pattern?: RegExp;
  
  /**
   * 自定义验证器
   */
  validator?: (rule: FormRule, value: unknown, callback: (error?: Error) => void) => void;
}

/**
 * 表单规则集合
 */
export type FormRules<T = Record<string, unknown>> = {
  [K in keyof T]?: FormRule | FormRule[];
};

/**
 * 选项类型
 * 
 * 用于 Select, Radio, Checkbox 等组件的选项定义。
 */
export interface Option<T = string | number> {
  /**
   * 选项标签（显示文本）
   */
  label: string;
  
  /**
   * 选项值
   */
  value: T;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  /**
   * 当前页码
   */
  current?: number;
  
  /**
   * 每页条数
   */
  pageSize?: number;
  
  /**
   * 总条数
   */
  total?: number;
  
  /**
   * 页码变化回调
   */
  onChange?: (page: number, pageSize: number) => void;
}

/**
 * 加载状态
 */
export type LoadingState = boolean | {
  /**
   * 是否显示加载中
   */
  spinning: boolean;
  
  /**
   * 加载提示文本
   */
  tip?: string;
};

