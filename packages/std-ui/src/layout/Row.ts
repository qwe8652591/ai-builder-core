/**
 * Row 组件 Props
 * 
 * 栅格布局行组件，基于 24 栅格系统。
 * 
 * @example
 * ```tsx
 * <Row gutter={16} justify="space-between">
 *   <Col span={12}>列1</Col>
 *   <Col span={12}>列2</Col>
 * </Row>
 * ```
 */

import type { BaseProps, Children, Alignment } from '../types';

export interface RowProps extends BaseProps {
  /**
   * 栅格间隔（px）
   * @default 0
   */
  gutter?: number | [number, number];
  
  /**
   * 水平排列方式
   * @default 'start'
   */
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly';
  
  /**
   * 垂直对齐方式
   * @default 'top'
   */
  align?: 'top' | 'middle' | 'bottom';
  
  /**
   * 是否自动换行
   * @default true
   */
  wrap?: boolean;
  
  /**
   * 子元素（Col 组件）
   */
  children?: Children;
}





