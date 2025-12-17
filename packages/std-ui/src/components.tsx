/**
 * 标准 UI 组件的虚拟实现
 * 
 * 这些是占位符实现，用于开发阶段的类型检查和代码编写。
 * 在实际编译时，这些组件会被替换为具体的 UI 库实现（Element Plus / Ant Design）。
 * 
 * @packageDocumentation
 */

import type {
  // 布局组件
  PageProps,
  CardProps,
  RowProps,
  ColProps,
  // 表单组件
  FormProps,
  InputProps,
  TextareaProps,
  InputNumberProps,
  SelectProps,
  CheckboxProps,
  CheckboxGroupProps,
  RadioProps,
  RadioGroupProps,
  SwitchProps,
  DatePickerProps,
  TimePickerProps,
  UploadProps,
  // 数据展示组件
  TableProps,
  TagProps,
  DescriptionsProps,
  AvatarProps,
  BadgeProps,
  EmptyProps,
  TooltipProps,
  TreeProps,
  TimelineProps,
  ImageProps,
  ListProps,
  // 反馈组件
  ModalProps,
  LoadingProps,
  AlertProps,
  DrawerProps,
  ProgressProps,
  PopconfirmProps,
  ResultProps,
  SkeletonProps,
  // 导航组件
  MenuProps,
  TabsProps,
  BreadcrumbProps,
  StepsProps,
  DropdownProps,
  AffixProps,
  BackTopProps,
  // 基础组件
  ButtonProps,
  IconProps,
  LinkProps,
  // API 类型
  MessageAPI,
  NotificationAPI,
} from './index';

/**
 * 组件返回类型
 * 
 * 🎯 使用 @ai-builder/ui-types 中定义的 JSXElement 类型
 * 
 * 这些是虚拟组件的占位符实现： 
 * - 在开发时提供类型检查和代码补全
 * - 在运行时被 react-bridge 映射到真实的 UI 组件
 * - 完全框架无关，不依赖 React
 */
import type { JSXElement } from './types/primitives';

// ============================================
// 布局组件
// ============================================

/**
 * Page - 页面容器组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Page: (props: PageProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Card - 卡片容器组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Card: (props: CardProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Row - 栅格行组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Row: (props: RowProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Col - 栅格列组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Col: (props: ColProps) => JSXElement = () => null as unknown as JSXElement;

// ============================================
// 表单组件
// ============================================

/**
 * Form - 表单容器组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Form: <T = Record<string, unknown>>(props: FormProps<T>) => JSXElement = () => null as unknown as JSXElement;

/**
 * FormItem - 表单项组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const FormItem: (props: {
  label?: string;
  prop?: string;
  required?: boolean;
  children?: unknown;
}) => JSXElement = () => null as unknown as JSXElement;

/**
 * Input - 输入框组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Input: (props: InputProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Select - 选择器组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Select: <T = string | number>(props: SelectProps<T>) => JSXElement = () => null as unknown as JSXElement;

/**
 * DatePicker - 日期选择器组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const DatePicker: (props: DatePickerProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Upload - 文件上传组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Upload: (props: UploadProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Textarea - 多行文本输入框组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Textarea: (props: TextareaProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * InputNumber - 数字输入框组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const InputNumber: (props: InputNumberProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Checkbox - 复选框组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Checkbox: (props: CheckboxProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * CheckboxGroup - 复选框组组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const CheckboxGroup: (props: CheckboxGroupProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Radio - 单选框组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Radio: (props: RadioProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * RadioGroup - 单选框组组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const RadioGroup: (props: RadioGroupProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Switch - 开关组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Switch: (props: SwitchProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * TimePicker - 时间选择器组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const TimePicker: (props: TimePickerProps) => JSXElement = () => null as unknown as JSXElement;

// ============================================
// 数据展示组件
// ============================================

/**
 * Table - 表格组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Table: <T = Record<string, unknown>>(props: TableProps<T>) => JSXElement = () => null as unknown as JSXElement;

/**
 * Pagination - 分页组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Pagination: (props: {
  current: number;
  pageSize: number;
  total: number;
  onChange?: (page: number) => void;
}) => JSXElement = () => null as unknown as JSXElement;

/**
 * Tag - 标签组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Tag: (props: TagProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Descriptions - 描述列表组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Descriptions: (props: DescriptionsProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Avatar - 头像组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Avatar: (props: AvatarProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Badge - 徽标组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Badge: (props: BadgeProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Empty - 空状态组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Empty: (props: EmptyProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Tooltip - 文字提示组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Tooltip: (props: TooltipProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Tree - 树形控件组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Tree: (props: TreeProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Timeline - 时间线组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Timeline: (props: TimelineProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Image - 图片组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Image: (props: ImageProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * List - 列表组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const List: <T = unknown>(props: ListProps<T>) => JSXElement = () => null as unknown as JSXElement;

// ============================================
// 反馈组件
// ============================================

/**
 * Modal - 对话框组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Modal: (props: ModalProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Loading - 加载提示组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Loading: (props: LoadingProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Message - 消息提示 API
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Message: MessageAPI = {} as MessageAPI;

/**
 * Notification - 通知 API
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Notification: NotificationAPI = {} as NotificationAPI;

/**
 * Alert - 警告提示组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Alert: (props: AlertProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Drawer - 抽屉组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Drawer: (props: DrawerProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Progress - 进度条组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Progress: (props: ProgressProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Popconfirm - 气泡确认框组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Popconfirm: (props: PopconfirmProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Result - 结果组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Result: (props: ResultProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Skeleton - 骨架屏组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Skeleton: (props: SkeletonProps) => JSXElement = () => null as unknown as JSXElement;

// ============================================
// 导航组件
// ============================================

/**
 * Menu - 菜单组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Menu: (props: MenuProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Tabs - 标签页组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Tabs: (props: TabsProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Breadcrumb - 面包屑组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Breadcrumb: (props: BreadcrumbProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Steps - 步骤条组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Steps: (props: StepsProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Dropdown - 下拉菜单组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Dropdown: (props: DropdownProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Affix - 固钉组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Affix: (props: AffixProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * BackTop - 回到顶部组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const BackTop: (props: BackTopProps) => JSXElement = () => null as unknown as JSXElement;

// ============================================
// 基础组件
// ============================================

/**
 * Button - 按钮组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Button: (props: ButtonProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Icon - 图标组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Icon: (props: IconProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Link - 链接组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Link: (props: LinkProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Space - 间距组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
import type { SpaceProps } from './layout/Space';
export const Space: (props: SpaceProps) => JSXElement = () => null as unknown as JSXElement;

/**
 * Divider - 分割线组件
 * 
 * @virtual 编译时会被替换为具体的 UI 库实现
 */
export const Divider: (props: {
  orientation?: 'left' | 'center' | 'right';
  dashed?: boolean;
  children?: unknown;
  style?: Record<string, unknown>;
  className?: string;
}) => JSXElement = () => null as unknown as JSXElement;
