/**
 * Button 组件 Props
 * 
 * 按钮组件，支持多种类型和尺寸。
 * 
 * @example
 * ```tsx
 * <Button type="primary" size="large" onClick={handleClick}>
 *   提交
 * </Button>
 * ```
 */

import type { BaseProps, Size, ButtonType, Children, ClickCallback } from '../types';

export interface ButtonProps extends BaseProps {
  /**
   * 按钮类型
   * @default 'default'
   */
  type?: ButtonType;
  
  /**
   * 按钮尺寸
   * @default 'default'
   */
  size?: Size;
  
  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;
  
  /**
   * 是否加载中
   * @default false
   */
  loading?: boolean;
  
  /**
   * 是否危险按钮
   * @default false
   */
  danger?: boolean;
  
  /**
   * 按钮形状
   * @default 'default'
   */
  shape?: 'default' | 'circle' | 'round';
  
  /**
   * 是否幽灵按钮（透明背景）
   * @default false
   */
  ghost?: boolean;
  
  /**
   * 是否块级按钮（宽度100%）
   * @default false
   */
  block?: boolean;
  
  /**
   * 图标
   */
  icon?: Children;
  
  /**
   * 按钮文本
   */
  children?: Children;
  
  /**
   * HTML button type
   * @default 'button'
   */
  htmlType?: 'button' | 'submit' | 'reset';
  
  /**
   * 点击事件
   */
  onClick?: ClickCallback;
}





