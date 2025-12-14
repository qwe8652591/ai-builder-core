/**
 * Page 组件 Props
 * 
 * 页面容器组件，提供统一的页面布局和加载状态。
 * 
 * @example
 * ```tsx
 * <Page loading={loading.value} title="订单列表">
 *   <div>页面内容</div>
 * </Page>
 * ```
 */

import type { BaseProps, Children } from '../types';

export interface PageProps extends BaseProps {
  /**
   * 页面标题
   */
  title?: string;
  
  /**
   * 副标题
   */
  subtitle?: string;
  
  /**
   * 加载状态
   * @default false
   */
  loading?: boolean;
  
  /**
   * 加载提示文本
   * @default '加载中...'
   */
  loadingText?: string;
  
  /**
   * 页面内容
   */
  children?: Children;
  
  /**
   * 页面头部额外内容
   */
  extra?: Children;
  
  /**
   * 返回按钮点击事件
   */
  onBack?: () => void;
  
  /**
   * 是否显示返回按钮
   * @default false
   */
  showBack?: boolean;
}





