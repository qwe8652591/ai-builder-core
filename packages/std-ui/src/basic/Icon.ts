/**
 * Icon 图标组件 Props
 */

import type { BaseProps, Size } from '../types';

export interface IconProps extends BaseProps {
  /**
   * 图标名称
   */
  name: string;
  
  /**
   * 图标尺寸
   */
  size?: Size | number | string;
  
  /**
   * 图标颜色
   */
  color?: string;
  
  /**
   * 旋转角度
   */
  rotate?: number;
  
  /**
   * 是否旋转动画
   * @default false
   */
  spin?: boolean;
  
  /**
   * 点击事件
   */
  onClick?: () => void;
}

/**
 * Link 链接组件 Props
 */
import type { Children } from '../types';

export interface LinkProps extends BaseProps {
  /**
   * 链接地址
   */
  href?: string;
  
  /**
   * 链接类型
   * @default 'default'
   */
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  
  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;
  
  /**
   * 是否下划线
   * @default true
   */
  underline?: boolean;
  
  /**
   * 原生 target 属性
   */
  target?: '_blank' | '_self' | '_parent' | '_top';
  
  /**
   * 图标
   */
  icon?: Children;
  
  /**
   * 链接文本
   */
  children?: Children;
  
  /**
   * 点击事件
   */
  onClick?: () => void;
}





