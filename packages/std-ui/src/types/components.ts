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

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface CheckboxGroupProps {
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  options?: Array<{ label: string; value: string | number; disabled?: boolean }>;
  disabled?: boolean;
  onChange?: (checkedValues: (string | number)[]) => void;
  style?: CSSProperties;
  className?: string;
}

export interface RadioProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  value?: string | number;
  onChange?: (checked: boolean) => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface RadioGroupProps {
  value?: string | number;
  defaultValue?: string | number;
  options?: Array<{ label: string; value: string | number; disabled?: boolean }>;
  disabled?: boolean;
  optionType?: 'default' | 'button';
  buttonStyle?: 'outline' | 'solid';
  onChange?: (value: string | number) => void;
  style?: CSSProperties;
  className?: string;
}

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: 'default' | 'small';
  checkedText?: string;
  uncheckedText?: string;
  onChange?: (checked: boolean) => void;
  style?: CSSProperties;
  className?: string;
}

export interface InputNumberProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  disabled?: boolean;
  placeholder?: string;
  controls?: boolean;
  onChange?: (value: number | null) => void;
  style?: CSSProperties;
  className?: string;
}

export interface TimePickerProps {
  value?: unknown;
  defaultValue?: unknown;
  format?: string;
  placeholder?: string;
  disabled?: boolean;
  use12Hours?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  onChange?: (value: unknown) => void;
  style?: CSSProperties;
  className?: string;
}

export interface TextareaProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  showCount?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
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
  onRowClick?: (row: T, index: number) => void;
  onRowDblClick?: (row: T, index: number) => void;
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

export interface AvatarProps {
  src?: string;
  alt?: string;
  icon?: Children;
  size?: 'small' | 'default' | 'large' | number;
  shape?: 'circle' | 'square';
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface BadgeProps {
  count?: number;
  dot?: boolean;
  showZero?: boolean;
  overflowCount?: number;
  color?: string;
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning';
  text?: string;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface EmptyProps {
  image?: Children | 'default' | 'simple';
  description?: Children;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface TooltipProps {
  title?: Children;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  trigger?: 'hover' | 'focus' | 'click';
  visible?: boolean;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface TreeNode {
  key: string;
  title: string;
  children?: TreeNode[];
  disabled?: boolean;
  selectable?: boolean;
  checkable?: boolean;
  isLeaf?: boolean;
}

export interface TreeProps {
  treeData?: TreeNode[];
  selectedKeys?: string[];
  expandedKeys?: string[];
  checkedKeys?: string[];
  checkable?: boolean;
  defaultExpandAll?: boolean;
  showLine?: boolean;
  onSelect?: (keys: string[], info: { node: TreeNode }) => void;
  onExpand?: (keys: string[]) => void;
  onCheck?: (keys: string[]) => void;
  style?: CSSProperties;
  className?: string;
}

export interface TimelineItem {
  key?: string;
  label?: Children;
  children?: Children;
  color?: 'blue' | 'red' | 'green' | 'gray' | string;
  dot?: Children;
}

export interface TimelineProps {
  items?: TimelineItem[];
  mode?: 'left' | 'alternate' | 'right';
  pending?: boolean | Children;
  reverse?: boolean;
  style?: CSSProperties;
  className?: string;
}

export interface ImageProps {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  preview?: boolean;
  fallback?: string;
  placeholder?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface ListItem {
  key?: string;
  title?: Children;
  description?: Children;
  avatar?: Children;
  extra?: Children;
}

export interface ListProps<T = ListItem> {
  dataSource?: T[];
  renderItem?: (item: T, index: number) => Children;
  header?: Children;
  footer?: Children;
  loading?: boolean;
  bordered?: boolean;
  size?: 'small' | 'default' | 'large';
  pagination?: false | PaginationConfig;
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

export interface AlertProps {
  type?: 'success' | 'info' | 'warning' | 'error';
  message?: Children;
  description?: Children;
  closable?: boolean;
  showIcon?: boolean;
  banner?: boolean;
  onClose?: () => void;
  style?: CSSProperties;
  className?: string;
}

export interface DrawerProps {
  visible?: boolean;
  title?: Children;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  width?: number | string;
  height?: number | string;
  closable?: boolean;
  mask?: boolean;
  maskClosable?: boolean;
  footer?: Children;
  onClose?: () => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface ProgressProps {
  percent?: number;
  type?: 'line' | 'circle' | 'dashboard';
  status?: 'success' | 'exception' | 'normal' | 'active';
  showInfo?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  format?: (percent: number) => Children;
  style?: CSSProperties;
  className?: string;
}

export interface PopconfirmProps {
  title?: Children;
  description?: Children;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface ResultProps {
  status?: 'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500';
  title?: Children;
  subTitle?: Children;
  icon?: Children;
  extra?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface SkeletonProps {
  active?: boolean;
  loading?: boolean;
  avatar?: boolean | { size?: 'small' | 'default' | 'large'; shape?: 'circle' | 'square' };
  title?: boolean | { width?: number | string };
  paragraph?: boolean | { rows?: number; width?: number | string | (number | string)[] };
  children?: Children;
  style?: CSSProperties;
  className?: string;
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

export interface StepItem {
  title?: Children;
  description?: Children;
  subTitle?: Children;
  icon?: Children;
  status?: 'wait' | 'process' | 'finish' | 'error';
  disabled?: boolean;
}

export interface StepsProps {
  items?: StepItem[];
  current?: number;
  direction?: 'horizontal' | 'vertical';
  type?: 'default' | 'navigation';
  size?: 'default' | 'small';
  status?: 'wait' | 'process' | 'finish' | 'error';
  labelPlacement?: 'horizontal' | 'vertical';
  onChange?: (current: number) => void;
  style?: CSSProperties;
  className?: string;
}

export interface DropdownMenuItem {
  key: string;
  label: Children;
  icon?: Children;
  disabled?: boolean;
  danger?: boolean;
  type?: 'item' | 'divider';
  children?: DropdownMenuItem[];
}

export interface DropdownProps {
  menu?: {
    items: DropdownMenuItem[];
    onClick?: (info: { key: string }) => void;
  };
  trigger?: ('click' | 'hover' | 'contextMenu')[];
  placement?: 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
  disabled?: boolean;
  arrow?: boolean;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface AffixProps {
  offsetTop?: number;
  offsetBottom?: number;
  target?: () => HTMLElement | Window;
  onChange?: (affixed: boolean) => void;
  children?: Children;
  style?: CSSProperties;
  className?: string;
}

export interface BackTopProps {
  visibilityHeight?: number;
  target?: () => HTMLElement | Window;
  onClick?: () => void;
  children?: Children;
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

