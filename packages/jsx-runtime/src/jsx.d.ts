/**
 * JSX 类型声明
 * 
 * 为 TypeScript 提供 JSX 类型支持
 */

import type { VNode, VNodeProps, ComponentType, VNodeChild } from './types';

// JSX 命名空间
declare global {
  namespace JSX {
    // JSX 元素类型
    type Element = VNode;
    
    // JSX 元素类型（函数组件返回）
    type ElementType = ComponentType;
    
    // 内置元素属性
    interface IntrinsicElements {
      // 布局组件
      Page: PageProps;
      Card: CardProps;
      Row: RowProps;
      Col: ColProps;
      Space: SpaceProps;
      Divider: DividerProps;
      
      // 表单组件
      Form: FormProps;
      FormItem: FormItemProps;
      Input: InputProps;
      Select: SelectProps;
      DatePicker: DatePickerProps;
      Upload: UploadProps;
      
      // 数据展示
      Table: TableProps;
      Tag: TagProps;
      Descriptions: DescriptionsProps;
      
      // 反馈组件
      Modal: ModalProps;
      Loading: LoadingProps;
      
      // 导航组件
      Menu: MenuProps;
      Tabs: TabsProps;
      Breadcrumb: BreadcrumbProps;
      
      // 基础组件
      Button: ButtonProps;
      Icon: IconProps;
      Link: LinkProps;
      Text: TextProps;
      
      // 允许任意组件（兜底）
      [key: string]: any;
    }
    
    // 元素属性
    interface ElementAttributesProperty {
      props: {};
    }
    
    // 子元素属性
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

// 基础属性
interface BaseProps {
  key?: string | number;
  ref?: any;
  children?: VNodeChild;
  className?: string;
  style?: Record<string, any>;
}

// 布局组件属性
interface PageProps extends BaseProps {
  title?: string;
  loading?: boolean;
}

interface CardProps extends BaseProps {
  title?: string;
  bordered?: boolean;
  hoverable?: boolean;
}

interface RowProps extends BaseProps {
  gutter?: number | [number, number];
  align?: 'top' | 'middle' | 'bottom';
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
}

interface ColProps extends BaseProps {
  span?: number;
  offset?: number;
  push?: number;
  pull?: number;
}

interface SpaceProps extends BaseProps {
  size?: 'small' | 'middle' | 'large' | number;
  direction?: 'horizontal' | 'vertical';
  wrap?: boolean;
}

interface DividerProps extends BaseProps {
  orientation?: 'left' | 'center' | 'right';
  dashed?: boolean;
}

// 表单组件属性
interface FormProps extends BaseProps {
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelWidth?: string | number;
  model?: Record<string, any>;
  rules?: Record<string, any>;
  onSubmit?: (values: any) => void;
}

interface FormItemProps extends BaseProps {
  label?: string;
  prop?: string;
  required?: boolean;
  rules?: any[];
}

interface InputProps extends BaseProps {
  type?: 'text' | 'password' | 'textarea' | 'number';
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  maxLength?: number;
  rows?: number;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

interface SelectProps extends BaseProps {
  value?: any;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  options?: Array<{ label: string; value: any }>;
  onChange?: (value: any) => void;
}

interface DatePickerProps extends BaseProps {
  type?: 'date' | 'daterange' | 'datetime' | 'datetimerange';
  value?: Date | [Date, Date];
  placeholder?: string | [string, string];
  disabled?: boolean;
  format?: string;
  onChange?: (value: Date | [Date, Date]) => void;
}

interface UploadProps extends BaseProps {
  action?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  fileList?: any[];
  onChange?: (info: any) => void;
}

// 数据展示属性
interface TableProps extends BaseProps {
  data?: any[];
  columns?: any[];
  loading?: boolean;
  rowKey?: string | ((record: any) => string);
  pagination?: any;
  selection?: any;
  onRowClick?: (record: any) => void;
}

interface TagProps extends BaseProps {
  color?: string;
  closable?: boolean;
  onClose?: () => void;
}

interface DescriptionsProps extends BaseProps {
  title?: string;
  column?: number;
  bordered?: boolean;
  items?: any[];
}

// 反馈组件属性
interface ModalProps extends BaseProps {
  title?: string;
  visible?: boolean;
  width?: number | string;
  closable?: boolean;
  maskClosable?: boolean;
  footer?: VNodeChild;
  onOk?: () => void;
  onCancel?: () => void;
}

interface LoadingProps extends BaseProps {
  loading?: boolean;
  tip?: string;
}

// 导航组件属性
interface MenuProps extends BaseProps {
  mode?: 'horizontal' | 'vertical' | 'inline';
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  items?: any[];
  onClick?: (info: any) => void;
}

interface TabsProps extends BaseProps {
  activeKey?: string;
  defaultActiveKey?: string;
  items?: any[];
  onChange?: (key: string) => void;
}

interface BreadcrumbProps extends BaseProps {
  items?: Array<{ title: string; href?: string }>;
}

// 基础组件属性
interface ButtonProps extends BaseProps {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'large' | 'middle' | 'small';
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface IconProps extends BaseProps {
  name?: string;
  size?: number;
  color?: string;
}

interface LinkProps extends BaseProps {
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

interface TextProps extends BaseProps {
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  delete?: boolean;
  code?: boolean;
}

export {};

