/**
 * 应用级别 DSL
 * 
 * 🎯 定义应用的全局配置，如布局、主题、菜单等
 * 
 * @example
 * ```typescript
 * // src/dsl/app.ts
 * export const app = defineApp({
 *   name: '采购管理系统',
 *   logo: '📦',
 *   layout: 'sidebar',
 *   theme: {
 *     primaryColor: '#1890ff',
 *   },
 * });
 * ```
 */

import React from 'react';

// ==================== 类型定义 ====================

/** 布局类型 */
export type LayoutType = 'sidebar' | 'header' | 'blank' | 'custom';

/** 主题配置 */
export interface ThemeConfig {
  /** 主色调 */
  primaryColor?: string;
  /** 成功色 */
  successColor?: string;
  /** 警告色 */
  warningColor?: string;
  /** 错误色 */
  errorColor?: string;
  /** 边框圆角 */
  borderRadius?: number;
  /** 紧凑模式 */
  compact?: boolean;
}

/** 菜单配置 */
export interface MenuConfig {
  /** 菜单宽度 */
  width?: number;
  /** 是否可收起 */
  collapsible?: boolean;
  /** 默认收起 */
  defaultCollapsed?: boolean;
}

/** 头部配置 */
export interface HeaderConfig {
  /** 头部高度 */
  height?: number;
  /** 是否固定 */
  fixed?: boolean;
  /** 显示用户信息 */
  showUser?: boolean;
  /** 用户菜单项 */
  userMenuItems?: Array<{
    key: string;
    label: string;
    icon?: string;
    danger?: boolean;
    onClick?: () => void;
  }>;
}

/** 头部扩展 Props */
export interface HeaderSlotProps {
  /** 当前页面标题 */
  pageTitle: string;
  /** 当前路由路径 */
  currentPath: string;
}

/** 侧边栏扩展 Props */
export interface SidebarSlotProps {
  /** 当前路由路径 */
  currentPath: string;
  /** 导航函数 */
  navigate: (path: string) => void;
}

/** 插槽配置（使用 DSL 组件） */
export interface AppSlots {
  /** 自定义头部右侧内容（用户信息、通知等） */
  headerRight?: unknown;  // DSL Component Definition
  /** 自定义头部左侧内容（面包屑等） */
  headerLeft?: unknown;
  /** 自定义侧边栏头部（Logo 区域） */
  sidebarHeader?: unknown;
  /** 自定义侧边栏底部（版本信息等） */
  sidebarFooter?: unknown;
  /** 页面内容包装器 */
  contentWrapper?: unknown;
}

/** 应用定义 */
export interface AppDefinition {
  /** 应用名称 */
  name: string;
  /** 应用 Logo（emoji 或 URL） */
  logo?: string;
  /** 布局类型 */
  layout?: LayoutType;
  /** 主题配置 */
  theme?: ThemeConfig;
  /** 菜单配置 */
  menu?: MenuConfig;
  /** 头部配置 */
  header?: HeaderConfig;
  
  /**
   * 🎯 可扩展插槽（使用 DSL 组件）
   * 
   * @example
   * slots: {
   *   headerRight: defineComponent({ ... }),
   *   sidebarFooter: defineComponent({ ... }),
   * }
   */
  slots?: AppSlots;
  
  /** 应用描述 */
  description?: string;
  /** 版本号 */
  version?: string;
}

/** 注册后的应用定义 */
export interface RegisteredAppDefinition extends AppDefinition {
  __type: 'app';
  __registeredAt: number;
}

// ==================== 全局状态 ====================

let registeredApp: RegisteredAppDefinition | null = null;

// ==================== 核心函数 ====================

/**
 * 定义应用
 * 
 * 🎯 应用级别的 DSL，配置全局布局、主题等
 * 
 * @example
 * ```typescript
 * export const app = defineApp({
 *   name: '采购管理系统',
 *   logo: '📦',
 *   layout: 'sidebar',
 *   theme: { primaryColor: '#1890ff' },
 *   menu: { width: 220, collapsible: true },
 *   header: { showUser: true },
 * });
 * ```
 */
export function defineApp(definition: AppDefinition): RegisteredAppDefinition {
  const registered: RegisteredAppDefinition = {
    ...definition,
    __type: 'app',
    __registeredAt: Date.now(),
  };
  
  // 注册到全局
  registeredApp = registered;
  
  console.log(`[DSL] App registered: ${definition.name}`);
  
  return registered;
}

/**
 * 获取注册的应用定义
 */
export function getAppDefinition(): RegisteredAppDefinition | null {
  return registeredApp;
}

/**
 * 获取应用定义（必须存在）
 */
export function requireAppDefinition(): RegisteredAppDefinition {
  if (!registeredApp) {
    throw new Error(
      'No app definition found. Please define your app using defineApp():\n\n' +
      'export const app = defineApp({ name: "My App" });'
    );
  }
  return registeredApp;
}

/**
 * 重置应用定义（用于测试）
 */
export function resetAppDefinition(): void {
  registeredApp = null;
}

// ==================== 默认配置 ====================

export const DEFAULT_APP_CONFIG: Partial<AppDefinition> = {
  name: 'DSL Application',
  logo: '🚀',
  layout: 'sidebar',
  theme: {
    primaryColor: '#1890ff',
    borderRadius: 6,
  },
  menu: {
    width: 220,
    collapsible: false,
  },
  header: {
    height: 56,
    fixed: true,
    showUser: true,
  },
};

/**
 * 获取合并后的应用配置（用户配置 + 默认配置）
 */
export function getMergedAppConfig(): AppDefinition {
  const app = getAppDefinition();
  
  return {
    ...DEFAULT_APP_CONFIG,
    ...app,
    theme: { ...DEFAULT_APP_CONFIG.theme, ...app?.theme },
    menu: { ...DEFAULT_APP_CONFIG.menu, ...app?.menu },
    header: { ...DEFAULT_APP_CONFIG.header, ...app?.header },
  } as AppDefinition;
}
