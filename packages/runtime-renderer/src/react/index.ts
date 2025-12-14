/**
 * @ai-builder/runtime-renderer/react
 * React runtime implementation for ai-builder UI DSL
 */

// 导出响应式原语
export {
  useState,
  useComputed,
  useWatch,
  useEffect,
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount,
  definePage,
  defineComponent,
} from './primitives';

// 导出 Decimal 运行时实现
export {
  Decimal,
  initializeDecimal,
} from './decimal';

// 导出 Decimal 类型
export type {
  DSLDecimal,
  DSLDecimalConstructor,
} from './decimal';

// 导出所有 UI 组件
export {
  Page,
  Card,
  Row,
  Col,
  Form,
  FormItem,
  Input,
  Select,
  DatePicker,
  Table,
  Button,
  Modal,
  Tag,
  Breadcrumb,
  Menu,
  Descriptions,
  Icon,
  Divider,
  Space,
  Message,
} from './components';

// 导出类型定义
export type {
  ColumnDefinition,
  TableProps,
  FormProps,
  InputProps,
  SelectProps,
  DatePickerProps,
  ModalProps,
  ButtonProps,
  PageProps,
  CardProps,
} from './components';

// 🎯 导出适配器（一站式注册）
export {
  registerAntdAdapter,
  registerAntdAdapterOnly,
  getAntdComponentMapping,
  antdComponentMapping,
  antdAdapterConfig,
} from './adapter';

// 重新导出 React，方便使用
export { default as React } from 'react';



