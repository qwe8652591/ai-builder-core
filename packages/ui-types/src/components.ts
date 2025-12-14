/**
 * UI 组件类型定义
 * 
 * 这些类型定义了标准 UI 组件的 Props 接口
 * 独立于具体的 UI 库实现（Ant Design/Element Plus）
 */

/**
 * 基础类型
 * 
 * 注意：这些是框架无关的类型定义
 * 在具体实现中会被映射到对应框架的类型
 * 例如：Children -> React.ReactNode (React) or VNode (Vue)
 */
export type Children = unknown;
export type CSSProperties = Record<string, unknown>;

/**
 * 布局组件类型
 */
export interface PageProps {
  title?: string;
  loading?: boolean;
  onBack?: () => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface CardProps {
  title?: string;
  extra?: Children;
  shadow?: 'never' | 'hover' | 'default';
  collapsible?: boolean;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface RowProps {
  gutter?: number | [number, number];
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
  align?: 'top' | 'middle' | 'bottom';
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface ColProps {
  span?: number;
  offset?: number;
  pull?: number;
  push?: number;
  xs?: number | { span?: number; offset?: number };
  sm?: number | { span?: number; offset?: number };
  md?: number | { span?: number; offset?: number };
  lg?: number | { span?: number; offset?: number };
  xl?: number | { span?: number; offset?: number };
  xxl?: number | { span?: number; offset?: number };
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface SpaceProps {
  size?: 'small' | 'middle' | 'large' | number;
  direction?: 'horizontal' | 'vertical';
  align?: 'start' | 'end' | 'center' | 'baseline';
  wrap?: boolean;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

/**
 * 表单组件类型
 */
export interface FormProps<T = Record<string, unknown>> {
  model?: T;
  rules?: Partial<Record<keyof T, unknown[]>>;
  labelWidth?: string | number;
  onSubmit?: (values: T) => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface InputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  type?: 'text' | 'password' | 'email' | 'tel' | 'url' | 'number' | 'textarea';
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  style?: CSSProperties;
  className?: string;
}

export interface Option<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface SelectProps<T = string | number> {
  value?: T | T[];
  defaultValue?: T | T[];
  options?: Option<T>[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  filterable?: boolean;
  clearable?: boolean;
  onChange?: (value: T | T[]) => void;
  style?: CSSProperties;
  className?: string;
}

export interface DatePickerProps {
  value?: unknown;
  defaultValue?: unknown;
  format?: string;
  placeholder?: string | [string, string];
  disabled?: boolean;
  type?: 'date' | 'daterange';
  onChange?: (value: unknown) => void;
  style?: CSSProperties;
  className?: string;
}

export interface UploadProps {
  action?: string;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxCount?: number;
  fileList?: unknown[];
  onChange?: (fileList: unknown[]) => void;
  onRemove?: (file: unknown) => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

/**
 * 数据展示组件类型
 */
export interface ColumnDefinition<T = Record<string, unknown>> {
  prop?: keyof T;
  label?: string;
  // Ant Design 兼容属性
  title?: string;
  dataIndex?: keyof T;
  key?: string;
  width?: number;
  minWidth?: number;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filters?: Array<{ text: string; value: string | number | boolean }>;
  formatter?: (value: unknown, record: T, index: number) => Children;
}

export interface PaginationConfig {
  current?: number;
  pageSize?: number;
  total?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  onChange?: (page: number, pageSize: number) => void;
}

export interface SelectionConfig<T = Record<string, unknown>> {
  type?: 'checkbox' | 'radio';
  selectedRows?: T[];
  selectedRowKeys?: string[]; // Ant Design 兼容属性
  onChange?: (keys: string[], rows: T[]) => void;
}

export interface TableProps<T = Record<string, unknown>> {
  data?: T[];
  columns: ColumnDefinition<T>[];
  rowKey?: string;
  selection?: SelectionConfig<T>;
  pagination?: false | PaginationConfig;
  loading?: boolean;
  onSelectionChange?: (keys: string[], rows: T[]) => void;
  style?: CSSProperties;
  className?: string;
}

export interface TagProps {
  color?: string;
  closable?: boolean;
  onClose?: () => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface DescriptionItem {
  label: string;
  content?: Children;
  value?: Children; // 别名，与 content 等价
  span?: number;
}

export interface DescriptionsProps {
  title?: string;
  column?: number;
  items: DescriptionItem[];
  bordered?: boolean;
  style?: CSSProperties;
  className?: string;
}

/**
 * 反馈组件类型
 */
export interface ModalProps {
  visible?: boolean;
  title?: string;
  width?: number | string;
  footer?: Children;
  onOk?: () => void;
  onCancel?: () => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface LoadingProps {
  spinning?: boolean;
  size?: 'small' | 'default' | 'large';
  tip?: string;
  children?: Children;
}

export interface MessageAPI {
  success: (content: string, duration?: number) => void;
  error: (content: string, duration?: number) => void;
  warning: (content: string, duration?: number) => void;
  info: (content: string, duration?: number) => void;
  loading: (content: string, duration?: number) => void;
}

export interface NotificationAPI {
  success: (config: { message: string; description?: string; duration?: number }) => void;
  error: (config: { message: string; description?: string; duration?: number }) => void;
  warning: (config: { message: string; description?: string; duration?: number }) => void;
  info: (config: { message: string; description?: string; duration?: number }) => void;
}

/**
 * 导航组件类型
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: Children;
  children?: MenuItem[];
}

export interface MenuProps {
  items: MenuItem[];
  mode?: 'horizontal' | 'vertical' | 'inline';
  selectedKeys?: string[];
  defaultSelectedKeys?: string[]; // 默认选中的菜单项
  onSelect?: (key: string) => void;
  style?: CSSProperties;
  className?: string;
}

export interface TabPane {
  key: string;
  tab: string;
  children?: Children;
}

export interface TabsProps {
  items: TabPane[];
  activeKey?: string;
  onChange?: (key: string) => void;
  style?: CSSProperties;
  className?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  href?: string; // 别名，与 path 等价
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: string | Children;
  style?: CSSProperties;
  className?: string;
}

/**
 * 基础组件类型
 */
export interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'small' | 'middle' | 'large';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface IconProps {
  name: string;
  size?: number | string;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export interface LinkProps {
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

