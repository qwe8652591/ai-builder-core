/**
 * Col 组件 Props
 * 
 * 栅格布局列组件，基于 24 栅格系统。
 * 
 * @example
 * ```tsx
 * <Row>
 *   <Col span={8} offset={4}>列内容</Col>
 *   <Col span={12}>列内容</Col>
 * </Row>
 * ```
 */

import type { BaseProps, Children } from '../types';

/**
 * 响应式栅格配置
 */
export interface ResponsiveConfig {
  /**
   * 栅格占据的列数（1-24）
   */
  span?: number;
  
  /**
   * 栅格左侧的间隔格数
   */
  offset?: number;
  
  /**
   * 栅格向右移动格数
   */
  push?: number;
  
  /**
   * 栅格向左移动格数
   */
  pull?: number;
}

export interface ColProps extends BaseProps {
  /**
   * 栅格占据的列数（1-24）
   * @default 24
   */
  span?: number;
  
  /**
   * 栅格左侧的间隔格数
   * @default 0
   */
  offset?: number;
  
  /**
   * 栅格向右移动格数
   * @default 0
   */
  push?: number;
  
  /**
   * 栅格向左移动格数
   * @default 0
   */
  pull?: number;
  
  /**
   * 响应式配置 - 屏幕 < 576px
   */
  xs?: number | ResponsiveConfig;
  
  /**
   * 响应式配置 - 屏幕 ≥ 576px
   */
  sm?: number | ResponsiveConfig;
  
  /**
   * 响应式配置 - 屏幕 ≥ 768px
   */
  md?: number | ResponsiveConfig;
  
  /**
   * 响应式配置 - 屏幕 ≥ 992px
   */
  lg?: number | ResponsiveConfig;
  
  /**
   * 响应式配置 - 屏幕 ≥ 1200px
   */
  xl?: number | ResponsiveConfig;
  
  /**
   * 响应式配置 - 屏幕 ≥ 1920px
   */
  xxl?: number | ResponsiveConfig;
  
  /**
   * 列内容
   */
  children?: Children;
}





