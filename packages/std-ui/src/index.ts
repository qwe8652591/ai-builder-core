/**
 * 标准 UI 组件协议主导出文件
 * 
 * 导出所有标准 UI 组件的接口定义和公共类型。
 * 这些类型来自 @ai-builder/ui-types，作为单一数据源 (SSOT)。
 * 
 * @packageDocumentation
 */

// 从 ui-types 重新导出所有类型（单一数据源）
export type {
  // 组件 Props 类型
  PageProps,
  CardProps,
  RowProps,
  ColProps,
  SpaceProps,
  FormProps,
  InputProps,
  SelectProps,
  DatePickerProps,
  UploadProps,
  ColumnDefinition,
  TableProps,
  PaginationConfig as TablePaginationConfig,
  SelectionConfig,
  TagProps,
  DescriptionItem,
  DescriptionsProps,
  ModalProps,
  LoadingProps,
  MessageAPI,
  NotificationAPI,
  MenuItem,
  MenuProps,
  TabPane,
  TabsProps,
  BreadcrumbProps,
  BreadcrumbItem,
  ButtonProps,
  IconProps,
  LinkProps,
  Option,
} from '@ai-builder/ui-types/components';

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
  // 表单
  Form,
  FormItem,
  Input,
  Select,
  DatePicker,
  Upload,
  // 数据展示
  Table,
  Pagination,
  Tag,
  Descriptions,
  // 反馈
  Modal,
  Loading,
  Message,
  Notification,
  // 导航
  Menu,
  Tabs,
  Breadcrumb,
  // 基础
  Button,
  Icon,
  Link,
} from './components';

