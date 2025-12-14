/**
 * Space 间距组件类型定义
 */

import type { BaseProps, Children } from '../types';

/**
 * Space 组件属性
 */
export interface SpaceProps extends BaseProps {
  /**
   * 间距大小
   */
  size?: 'small' | 'middle' | 'large' | number;
  
  /**
   * 间距方向
   */
  direction?: 'horizontal' | 'vertical';
  
  /**
   * 对齐方式
   */
  align?: 'start' | 'end' | 'center' | 'baseline';
  
  /**
   * 是否自动换行（仅在 horizontal 时生效）
   */
  wrap?: boolean;
  
  /**
   * 子元素
   */
  children?: Children;
}





