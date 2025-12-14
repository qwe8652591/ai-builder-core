/**
 * DatePicker 组件 Props
 */

import type { BaseProps, Size } from '../types';

export interface DatePickerProps extends BaseProps {
  /**
   * 日期值
   */
  value?: Date | string | number;
  
  /**
   * 日期格式
   * @default 'YYYY-MM-DD'
   */
  format?: string;
  
  /**
   * 显示类型
   * @default 'date'
   */
  type?: 'date' | 'datetime' | 'daterange' | 'datetimerange' | 'month' | 'year';
  
  /**
   * 占位符
   */
  placeholder?: string;
  
  /**
   * 范围选择时的开始占位符
   */
  startPlaceholder?: string;
  
  /**
   * 范围选择时的结束占位符
   */
  endPlaceholder?: string;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 是否可清空
   * @default true
   */
  clearable?: boolean;
  
  /**
   * 尺寸
   */
  size?: Size;
  
  /**
   * 可选择的最小日期
   */
  minDate?: Date | string | number;
  
  /**
   * 可选择的最大日期
   */
  maxDate?: Date | string | number;
  
  /**
   * 禁用日期函数
   */
  disabledDate?: (date: Date) => boolean;
  
  /**
   * 值变化事件
   */
  onChange?: (value: Date | string | number | [Date, Date] | null) => void;
}

/**
 * Upload 组件 Props
 */
export interface UploadFile {
  /**
   * 文件唯一标识
   */
  uid: string;
  
  /**
   * 文件名
   */
  name: string;
  
  /**
   * 文件状态
   */
  status?: 'uploading' | 'success' | 'error';
  
  /**
   * 上传进度
   */
  percent?: number;
  
  /**
   * 文件 URL
   */
  url?: string;
  
  /**
   * 原始文件对象
   */
  raw?: File;
  
  /**
   * 服务器响应
   */
  response?: unknown;
}

export interface UploadProps extends BaseProps {
  /**
   * 上传地址
   */
  action: string;
  
  /**
   * 文件列表
   */
  fileList?: UploadFile[];
  
  /**
   * 是否支持多选
   * @default false
   */
  multiple?: boolean;
  
  /**
   * 最大上传数量
   */
  limit?: number;
  
  /**
   * 接受的文件类型
   */
  accept?: string;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 是否显示已上传文件列表
   * @default true
   */
  showFileList?: boolean;
  
  /**
   * 上传请求方法
   * @default 'POST'
   */
  method?: 'POST' | 'PUT';
  
  /**
   * 请求头部
   */
  headers?: Record<string, string>;
  
  /**
   * 额外的请求参数
   */
  data?: Record<string, unknown>;
  
  /**
   * 文件字段名
   * @default 'file'
   */
  name?: string;
  
  /**
   * 是否携带 cookie
   * @default false
   */
  withCredentials?: boolean;
  
  /**
   * 上传前钩子
   */
  beforeUpload?: (file: File) => boolean | Promise<boolean | File>;
  
  /**
   * 文件列表变化事件
   */
  onChange?: (fileList: UploadFile[]) => void;
  
  /**
   * 上传成功事件
   */
  onSuccess?: (response: unknown, file: UploadFile) => void;
  
  /**
   * 上传失败事件
   */
  onError?: (error: Error, file: UploadFile) => void;
  
  /**
   * 上传进度事件
   */
  onProgress?: (percent: number, file: UploadFile) => void;
  
  /**
   * 删除文件事件
   */
  onRemove?: (file: UploadFile) => boolean | Promise<boolean>;
}

