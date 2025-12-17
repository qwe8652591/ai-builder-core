/**
 * 标准 UI 组件协议主导出文件
 * 
 * 导出所有标准 UI 组件的接口定义和公共类型。
 * 
 * @packageDocumentation
 */

// 组件 Props 类型（从本地 types 目录导出）
export type {
  // 布局组件
  PageProps,
  CardProps,
  RowProps,
  ColProps,
  SpaceProps,
  // 表单组件
  FormProps,
  InputProps,
  SelectProps,
  DatePickerProps,
  UploadProps,
  CheckboxProps,
  CheckboxGroupProps,
  RadioProps,
  RadioGroupProps,
  SwitchProps,
  InputNumberProps,
  TimePickerProps,
  TextareaProps,
  // 数据展示组件
  ColumnDefinition,
  TableProps,
  PaginationConfig as TablePaginationConfig,
  SelectionConfig,
  TagProps,
  DescriptionItem,
  DescriptionsProps,
  AvatarProps,
  BadgeProps,
  EmptyProps,
  TooltipProps,
  TreeNode,
  TreeProps,
  TimelineItem,
  TimelineProps,
  ImageProps,
  ListItem,
  ListProps,
  // 反馈组件
  ModalProps,
  LoadingProps,
  MessageAPI,
  NotificationAPI,
  AlertProps,
  DrawerProps,
  ProgressProps,
  PopconfirmProps,
  ResultProps,
  SkeletonProps,
  // 导航组件
  MenuItem,
  MenuProps,
  TabPane,
  TabsProps,
  BreadcrumbProps,
  BreadcrumbItem,
  StepItem,
  StepsProps,
  DropdownMenuItem,
  DropdownProps,
  AffixProps,
  BackTopProps,
  // 基础组件
  ButtonProps,
  IconProps,
  LinkProps,
  Option,
} from './types/components';

// VNode 和原语类型
export type {
  VNode,
  VNodeChild,
  VNodeProps,
  ComponentType,
  JSXElement,
  ReactiveState,
  ComputedState,
  EffectCallback,
  CleanupFunction,
  DependencyList,
  WatchOptions,
} from './types/primitives';

// VNode 相关的值和函数
export {
  VNODE_TYPE,
  isVNode,
  isValidChild,
} from './types/primitives';

// 公共类型（为了向后兼容，保留本地定义）
export type {
  BaseProps,
  Size,
  ButtonType,
  Alignment,
  EventCallback,
  ClickCallback,
  InputCallback,
  ChangeCallback,
  Children,
  FormRule,
  FormRules,
  PaginationConfig,
  LoadingState,
  CSSProperties
} from './types';

// 本地特定类型（ui-types 中没有的）
export type { ResponsiveConfig } from './layout/Col';
export type { UploadFile } from './form/DatePicker';
export type { SortConfig } from './data/Table';
export type { PaginationProps } from './feedback/Modal';
export type {
  MessageOptions,
  MessageType,
  NotificationOptions,
  NotificationType
} from './feedback/Message';

// 虚拟组件声明（用于 .view.tsx 文件中直接使用）
export {
  // 布局
  Page,
  Card,
  Row,
  Col,
  Space,
  Divider,
  // 表单
  Form,
  FormItem,
  Input,
  Textarea,
  InputNumber,
  Select,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Switch,
  DatePicker,
  TimePicker,
  Upload,
  // 数据展示
  Table,
  Pagination,
  Tag,
  Descriptions,
  Avatar,
  Badge,
  Empty,
  Tooltip,
  Tree,
  Timeline,
  Image,
  List,
  // 反馈
  Modal,
  Loading,
  Message,
  Notification,
  Alert,
  Drawer,
  Progress,
  Popconfirm,
  Result,
  Skeleton,
  // 导航
  Menu,
  Tabs,
  Breadcrumb,
  Steps,
  Dropdown,
  Affix,
  BackTop,
  // 基础
  Button,
  Icon,
  Link,
} from './components';

