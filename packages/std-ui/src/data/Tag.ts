/**
 * Tag 组件 Props
 */

import type { BaseProps, Size, Children } from '../types';

export interface TagProps extends BaseProps {
  /**
   * 标签类型
   * @default 'default'
   */
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  
  /**
   * 标签尺寸
   */
  size?: Size;
  
  /**
   * 是否可关闭
   * @default false
   */
  closable?: boolean;
  
  /**
   * 是否禁用淡入动画
   * @default false
   */
  disableTransitions?: boolean;
  
  /**
   * 是否有边框
   * @default true
   */
  bordered?: boolean;
  
  /**
   * 标签颜色（自定义）
   */
  color?: string;
  
  /**
   * 标签内容
   */
  children?: Children;
  
  /**
   * 关闭事件
   */
  onClose?: () => void;
  
  /**
   * 点击事件
   */
  onClick?: () => void;
}

/**
 * Descriptions 组件 Props
 */
export interface DescriptionItem {
  /**
   * 标签
   */
  label: string;
  
  /**
   * 内容
   */
  content: Children;
  
  /**
   * 占据的列数
   * @default 1
   */
  span?: number;
}

export interface DescriptionsProps extends BaseProps {
  /**
   * 标题
   */
  title?: string;
  
  /**
   * 额外内容
   */
  extra?: Children;
  
  /**
   * 一行显示的列数
   * @default 3
   */
  column?: number;
  
  /**
   * 尺寸
   */
  size?: Size;
  
  /**
   * 是否显示边框
   * @default false
   */
  bordered?: boolean;
  
  /**
   * 标签对齐方式
   * @default 'left'
   */
  labelAlign?: 'left' | 'center' | 'right';
  
  /**
   * 内容对齐方式
   * @default 'left'
   */
  contentAlign?: 'left' | 'center' | 'right';
  
  /**
   * 布局方式
   * @default 'horizontal'
   */
  layout?: 'horizontal' | 'vertical';
  
  /**
   * 标签样式
   */
  labelStyle?: Record<string, any>;
  
  /**
   * 内容样式
   */
  contentStyle?: Record<string, any>;
  
  /**
   * 描述项列表
   */
  items: DescriptionItem[];
  
  /**
   * 子元素（描述项）
   */
  children?: Children;
}





