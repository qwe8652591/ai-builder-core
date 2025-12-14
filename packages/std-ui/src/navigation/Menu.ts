/**
 * Menu 菜单组件 Props
 */

import type { BaseProps, Children } from '../types';

export interface MenuItem {
  /**
   * 菜单项唯一标识
   */
  key: string;
  
  /**
   * 菜单项标题
   */
  label: string;
  
  /**
   * 菜单项图标
   */
  icon?: Children;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 子菜单
   */
  children?: MenuItem[];
}

export interface MenuProps extends BaseProps {
  /**
   * 菜单项列表
   */
  items: MenuItem[];
  
  /**
   * 当前激活的菜单项 key
   */
  activeKey?: string;
  
  /**
   * 默认激活的菜单项 key
   */
  defaultActiveKey?: string;
  
  /**
   * 当前打开的子菜单 keys
   */
  openKeys?: string[];
  
  /**
   * 默认打开的子菜单 keys
   */
  defaultOpenKeys?: string[];
  
  /**
   * 菜单模式
   * @default 'vertical'
   */
  mode?: 'horizontal' | 'vertical' | 'inline';
  
  /**
   * 是否折叠（仅 inline 模式）
   * @default false
   */
  collapsed?: boolean;
  
  /**
   * 菜单宽度（仅 inline 模式）
   */
  width?: number | string;
  
  /**
   * 菜单项点击事件
   */
  onSelect?: (key: string, item: MenuItem) => void;
  
  /**
   * 子菜单打开/关闭事件
   */
  onOpenChange?: (openKeys: string[]) => void;
}

/**
 * Tabs 标签页组件 Props
 */
export interface TabPane {
  /**
   * 标签页唯一标识
   */
  key: string;
  
  /**
   * 标签标题
   */
  label: string;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 是否可关闭
   */
  closable?: boolean;
  
  /**
   * 标签内容
   */
  content?: Children;
}

export interface TabsProps extends BaseProps {
  /**
   * 标签页列表
   */
  panes: TabPane[];
  
  /**
   * 当前激活的标签页 key
   */
  activeKey?: string;
  
  /**
   * 默认激活的标签页 key
   */
  defaultActiveKey?: string;
  
  /**
   * 标签位置
   * @default 'top'
   */
  tabPosition?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * 标签类型
   * @default 'line'
   */
  type?: 'line' | 'card' | 'border-card';
  
  /**
   * 是否可增加标签页
   * @default false
   */
  addable?: boolean;
  
  /**
   * 是否可关闭标签页
   * @default false
   */
  closable?: boolean;
  
  /**
   * 子元素（TabPane 组件）
   */
  children?: Children;
  
  /**
   * 标签页切换事件
   */
  onChange?: (key: string) => void;
  
  /**
   * 标签页新增事件
   */
  onAdd?: () => void;
  
  /**
   * 标签页关闭事件
   */
  onRemove?: (key: string) => void;
}

/**
 * Breadcrumb 面包屑组件 Props
 */
export interface BreadcrumbItem {
  /**
   * 面包屑项标题
   */
  label: string;
  
  /**
   * 跳转路径
   */
  path?: string;
  
  /**
   * 是否为当前项
   */
  active?: boolean;
}

export interface BreadcrumbProps extends BaseProps {
  /**
   * 面包屑项列表
   */
  items: BreadcrumbItem[];
  
  /**
   * 分隔符
   * @default '/'
   */
  separator?: string | Children;
  
  /**
   * 子元素（Breadcrumb.Item 组件）
   */
  children?: Children;
  
  /**
   * 面包屑项点击事件
   */
  onClick?: (item: BreadcrumbItem, index: number) => void;
}





