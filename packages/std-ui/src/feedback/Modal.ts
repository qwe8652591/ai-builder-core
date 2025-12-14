/**
 * Modal 组件 Props
 */

import type { BaseProps, Children } from '../types';

export interface ModalProps extends BaseProps {
  /**
   * 是否显示
   */
  visible: boolean;
  
  /**
   * 标题
   */
  title?: string;
  
  /**
   * 宽度
   */
  width?: number | string;
  
  /**
   * 是否显示遮罩
   * @default true
   */
  mask?: boolean;
  
  /**
   * 点击遮罩是否关闭
   * @default true
   */
  maskClosable?: boolean;
  
  /**
   * 是否显示关闭按钮
   * @default true
   */
  closable?: boolean;
  
  /**
   * 确认按钮文字
   * @default '确定'
   */
  okText?: string;
  
  /**
   * 取消按钮文字
   * @default '取消'
   */
  cancelText?: string;
  
  /**
   * 确认按钮加载状态
   */
  confirmLoading?: boolean;
  
  /**
   * 内容
   */
  children?: Children;
  
  /**
   * 底部内容
   */
  footer?: Children | null;
  
  /**
   * 确认事件
   */
  onOk?: () => void | Promise<void>;
  
  /**
   * 取消事件
   */
  onCancel?: () => void;
}

/**
 * Pagination 组件 Props
 */
export interface PaginationProps extends BaseProps {
  /**
   * 当前页码
   */
  current: number;
  
  /**
   * 每页条数
   */
  pageSize: number;
  
  /**
   * 总条数
   */
  total: number;
  
  /**
   * 每页条数选项
   * @default [10, 20, 50, 100]
   */
  pageSizeOptions?: number[];
  
  /**
   * 是否显示总条数
   * @default true
   */
  showTotal?: boolean;
  
  /**
   * 是否显示快速跳转
   * @default false
   */
  showQuickJumper?: boolean;
  
  /**
   * 是否显示每页条数选择器
   * @default false
   */
  showSizeChanger?: boolean;
  
  /**
   * 页码变化事件
   */
  onChange?: (page: number, pageSize: number) => void;
  
  /**
   * 每页条数变化事件
   */
  onPageSizeChange?: (pageSize: number) => void;
}





