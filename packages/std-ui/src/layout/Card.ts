/**
 * Card 组件 Props
 * 
 * 卡片容器组件，用于内容分组。
 * 
 * @example
 * ```tsx
 * <Card title="订单信息" extra={<Button>操作</Button>}>
 *   <div>卡片内容</div>
 * </Card>
 * ```
 */

import type { BaseProps, Children } from '../types';

export interface CardProps extends BaseProps {
  /**
   * 卡片标题
   */
  title?: string;
  
  /**
   * 卡片右上角额外内容
   */
  extra?: Children;
  
  /**
   * 卡片内容
   */
  children?: Children;
  
  /**
   * 是否显示边框
   * @default true
   */
  bordered?: boolean;
  
  /**
   * 是否显示阴影
   * @default false
   */
  shadow?: 'always' | 'hover' | 'never';
  
  /**
   * 内边距大小
   * @default 'default'
   */
  bodyPadding?: 'small' | 'default' | 'large' | 'none';
  
  /**
   * 是否可折叠
   * @default false
   */
  collapsible?: boolean;
  
  /**
   * 是否默认折叠
   * @default false
   */
  defaultCollapsed?: boolean;
  
  /**
   * 折叠状态变化回调
   */
  onCollapse?: (collapsed: boolean) => void;
}





