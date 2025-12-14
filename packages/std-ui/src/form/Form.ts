/**
 * Form 组件 Props
 */

import type { BaseProps, Children, FormRules } from '../types';

export interface FormProps<T = Record<string, any>> extends BaseProps {
  /**
   * 表单数据模型
   */
  model: T;
  
  /**
   * 表单验证规则
   */
  rules?: FormRules<T>;
  
  /**
   * 标签宽度
   */
  labelWidth?: number | string;
  
  /**
   * 标签位置
   * @default 'right'
   */
  labelPosition?: 'left' | 'right' | 'top';
  
  /**
   * 表单尺寸
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 表单项
   */
  children?: Children;
  
  /**
   * 提交事件
   */
  onSubmit?: (model: T) => void | Promise<void>;
  
  /**
   * 验证失败事件
   */
  onValidateFail?: (errors: Record<string, string[]>) => void;
}

/**
 * Input 组件 Props
 */
export interface InputProps extends BaseProps {
  /**
   * 输入值
   */
  value?: string | number;
  
  /**
   * 输入类型
   */
  type?: 'text' | 'password' | 'number' | 'email' | 'tel' | 'url';
  
  /**
   * 占位符
   */
  placeholder?: string;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 是否只读
   */
  readonly?: boolean;
  
  /**
   * 尺寸
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * 最大长度
   */
  maxLength?: number;
  
  /**
   * 是否显示字数统计
   */
  showCount?: boolean;
  
  /**
   * 前缀图标
   */
  prefix?: Children;
  
  /**
   * 后缀图标
   */
  suffix?: Children;
  
  /**
   * 是否可清空
   */
  clearable?: boolean;
  
  /**
   * 输入事件
   */
  onInput?: (value: string) => void;
  
  /**
   * 变化事件
   */
  onChange?: (value: string) => void;
  
  /**
   * 失焦事件
   */
  onBlur?: () => void;
  
  /**
   * 获焦事件
   */
  onFocus?: () => void;
}

/**
 * Select 组件 Props
 */
export interface SelectProps<T = string | number> extends BaseProps {
  /**
   * 选中值
   */
  value?: T;
  
  /**
   * 选项列表
   */
  options: Array<{
    label: string;
    value: T;
    disabled?: boolean;
  }>;
  
  /**
   * 占位符
   */
  placeholder?: string;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 是否多选
   */
  multiple?: boolean;
  
  /**
   * 是否可搜索
   */
  filterable?: boolean;
  
  /**
   * 是否可清空
   */
  clearable?: boolean;
  
  /**
   * 尺寸
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * 变化事件
   */
  onChange?: (value: T) => void;
}

