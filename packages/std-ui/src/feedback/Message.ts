/**
 * Message 消息提示 API
 */

export type MessageType = 'success' | 'warning' | 'info' | 'error';

export interface MessageOptions {
  /**
   * 消息类型
   */
  type?: MessageType;
  
  /**
   * 消息文本
   */
  message: string;
  
  /**
   * 显示时长（毫秒）
   * @default 3000
   */
  duration?: number;
  
  /**
   * 是否显示关闭按钮
   * @default false
   */
  closable?: boolean;
  
  /**
   * 自定义图标
   */
  icon?: any;
  
  /**
   * 是否将消息居中显示
   * @default false
   */
  center?: boolean;
  
  /**
   * 关闭时的回调
   */
  onClose?: () => void;
}

/**
 * Message API 方法
 */
export interface MessageAPI {
  /**
   * 显示普通消息
   */
  (options: MessageOptions | string): void;
  
  /**
   * 显示成功消息
   */
  success(message: string, duration?: number): void;
  
  /**
   * 显示警告消息
   */
  warning(message: string, duration?: number): void;
  
  /**
   * 显示信息消息
   */
  info(message: string, duration?: number): void;
  
  /**
   * 显示错误消息
   */
  error(message: string, duration?: number): void;
  
  /**
   * 关闭所有消息
   */
  closeAll(): void;
}

/**
 * Loading 加载提示 Props
 */
import type { BaseProps, Children } from '../types';

export interface LoadingProps extends BaseProps {
  /**
   * 是否显示加载
   */
  loading: boolean;
  
  /**
   * 加载文本
   */
  text?: string;
  
  /**
   * 背景色
   */
  background?: string;
  
  /**
   * 自定义加载图标
   */
  spinner?: Children;
  
  /**
   * 是否全屏加载
   * @default false
   */
  fullscreen?: boolean;
  
  /**
   * 是否锁定滚动
   * @default true
   */
  lock?: boolean;
  
  /**
   * 子元素（被包裹的内容）
   */
  children?: Children;
}

/**
 * Notification 通知 API
 */
export type NotificationType = 'success' | 'warning' | 'info' | 'error';

export interface NotificationOptions {
  /**
   * 通知类型
   */
  type?: NotificationType;
  
  /**
   * 标题
   */
  title: string;
  
  /**
   * 消息内容
   */
  message: string;
  
  /**
   * 显示时长（毫秒）
   * @default 4500
   */
  duration?: number;
  
  /**
   * 自定义图标
   */
  icon?: any;
  
  /**
   * 弹出位置
   * @default 'top-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * 是否显示关闭按钮
   * @default true
   */
  closable?: boolean;
  
  /**
   * 关闭时的回调
   */
  onClose?: () => void;
  
  /**
   * 点击通知时的回调
   */
  onClick?: () => void;
}

/**
 * Notification API 方法
 */
export interface NotificationAPI {
  /**
   * 显示通知
   */
  (options: NotificationOptions): void;
  
  /**
   * 显示成功通知
   */
  success(title: string, message: string, duration?: number): void;
  
  /**
   * 显示警告通知
   */
  warning(title: string, message: string, duration?: number): void;
  
  /**
   * 显示信息通知
   */
  info(title: string, message: string, duration?: number): void;
  
  /**
   * 显示错误通知
   */
  error(title: string, message: string, duration?: number): void;
  
  /**
   * 关闭所有通知
   */
  closeAll(): void;
}





