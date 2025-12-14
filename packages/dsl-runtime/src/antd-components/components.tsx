/**
 * 标准 UI 组件的 Ant Design 5 适配器实现
 * 将 @qwe8652591/std-ui 的虚拟组件映射到真实的 Ant Design 组件
 */

import React from 'react';
import type { CSSProperties } from 'react';
import dayjs from 'dayjs';
// Ant Design DatePicker 需要这些 dayjs 插件
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// 激活 dayjs 插件
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);

import {
  Layout,
  Card as AntCard,
  Button as AntButton,
  Table as AntTable,
  Form as AntForm,
  Input as AntInput,
  Select as AntSelect,
  DatePicker as AntDatePicker,
  Modal as AntModal,
  Tag as AntTag,
  Breadcrumb as AntBreadcrumb,
  Menu as AntMenu,
  Row as AntRow,
  Col as AntCol,
  Descriptions as AntDescriptions,
  Divider as AntDivider,
  Space as AntSpace,
  Typography as AntTypography,
  message as antMessage,
  Spin,
} from 'antd';
import * as Icons from '@ant-design/icons';

/**
 * 类型定义
 * 
 * 从 @ai-builder/ui-types 导入所有标准类型定义
 * ui-types 是 UI 组件的单一来源（Single Source of Truth）
 * 
 * 架构说明：
 * - @ai-builder/ui-types: 纯类型定义（SSOT）
 * - @qwe8652591/std-ui: 标准协议层，重新导出 ui-types 的类型 + 虚拟组件声明
 * - @ai-builder/runtime-renderer: 适配层，直接从 ui-types 获取类型并映射到 Ant Design
 */

import type {
  PageProps as DSLPageProps,
  CardProps as DSLCardProps,
  RowProps as DSLRowProps,
  ColProps as DSLColProps,
  SpaceProps as DSLSpaceProps,
  FormProps as DSLFormProps,
  InputProps as DSLInputProps,
  SelectProps as DSLSelectProps,
  DatePickerProps as DSLDatePickerProps,
  UploadProps as DSLUploadProps,
  TableProps as DSLTableProps,
  ColumnDefinition as DSLColumnDefinition,
  PaginationConfig as DSLPaginationConfig,
  SelectionConfig as DSLSelectionConfig,
  TagProps as DSLTagProps,
  DescriptionsProps as DSLDescriptionsProps,
  DescriptionItem as DSLDescriptionItem,
  ModalProps as DSLModalProps,
  LoadingProps as DSLLoadingProps,
  MessageAPI as DSLMessageAPI,
  NotificationAPI as DSLNotificationAPI,
  MenuProps as DSLMenuProps,
  MenuItem as DSLMenuItem,
  TabsProps as DSLTabsProps,
  TabPane as DSLTabPane,
  BreadcrumbProps as DSLBreadcrumbProps,
  BreadcrumbItem as DSLBreadcrumbItem,
  ButtonProps as DSLButtonProps,
  IconProps as DSLIconProps,
  LinkProps as DSLLinkProps,
  Option as DSLOption,
} from '@qwe8652591/std-ui/components';

// React 特定的类型映射：将 DSL 的 `unknown` 类型映射到 React 的实际类型
type Children = React.ReactNode;

// 重新定义组件 Props，将 Children 类型从 unknown 映射为 React.ReactNode
export type PageProps = Omit<DSLPageProps, 'children'> & { children?: Children };
export type CardProps = Omit<DSLCardProps, 'children' | 'extra'> & { children?: Children; extra?: Children };
export type RowProps = Omit<DSLRowProps, 'children'> & { children?: Children };
export type ColProps = Omit<DSLColProps, 'children'> & { children?: Children };
export type SpaceProps = Omit<DSLSpaceProps, 'children'> & { children?: Children };
export type FormProps<T = Record<string, unknown>> = Omit<DSLFormProps<T>, 'children'> & { children?: Children };
export type InputProps = DSLInputProps;
export type SelectProps<T = string | number> = DSLSelectProps<T>;
export type DatePickerProps = DSLDatePickerProps;
export type UploadProps = Omit<DSLUploadProps, 'children'> & { children?: Children };
export type ColumnDefinition<T = Record<string, unknown>> = Omit<DSLColumnDefinition<T>, 'formatter'> & {
  formatter?: (value: unknown, record: T, index: number) => Children;
};
export type TableProps<T = Record<string, unknown>> = Omit<DSLTableProps<T>, 'columns'> & {
  columns: ColumnDefinition<T>[];
};
export type PaginationConfig = DSLPaginationConfig;
export type SelectionConfig<T = Record<string, unknown>> = DSLSelectionConfig<T>;
export type TagProps = Omit<DSLTagProps, 'children'> & { children?: Children };
export type DescriptionItem = Omit<DSLDescriptionItem, 'content' | 'value'> & { content?: Children; value?: Children };
export type DescriptionsProps = Omit<DSLDescriptionsProps, 'items'> & { items: DescriptionItem[] };
export type ModalProps = Omit<DSLModalProps, 'children' | 'footer'> & { children?: Children; footer?: Children };
export type LoadingProps = Omit<DSLLoadingProps, 'children'> & { children?: Children };
export type MessageAPI = DSLMessageAPI;
export type NotificationAPI = DSLNotificationAPI;
export type MenuItem = Omit<DSLMenuItem, 'icon' | 'children'> & { icon?: Children; children?: MenuItem[] };
export type MenuProps = Omit<DSLMenuProps, 'items'> & { items: MenuItem[] };
export type TabPane = Omit<DSLTabPane, 'children'> & { children?: Children };
export type TabsProps = Omit<DSLTabsProps, 'items'> & { items: TabPane[] };
export type BreadcrumbProps = Omit<DSLBreadcrumbProps, 'separator'> & { separator?: string | Children };
export type BreadcrumbItem = DSLBreadcrumbItem;
export type ButtonProps = Omit<DSLButtonProps, 'children'> & { children?: Children };
export type IconProps = DSLIconProps;
export type LinkProps = Omit<DSLLinkProps, 'children'> & { children?: Children };
export type Option<T = string | number> = DSLOption<T>;

/**
 * 1. Page 组件 - 页面容器
 * 映射到 Ant Design Layout
 */
export const Page: React.FC<PageProps> = ({
  title,
  loading,
  onBack,
  children,
  style,
  className,
}) => {
  return (
    <Layout style={{ minHeight: '100vh', ...style }} className={className}>
      {title && (
        <Layout.Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '64px' }}>
            {onBack && (
              <AntButton
                type="text"
                icon={<Icons.ArrowLeftOutlined />}
                onClick={onBack}
                style={{ marginRight: '16px' }}
              />
            )}
            <AntTypography.Title level={3} style={{ margin: 0 }}>
              {title}
            </AntTypography.Title>
          </div>
        </Layout.Header>
      )}
      <Layout.Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          children
        )}
      </Layout.Content>
    </Layout>
  );
};

/**
 * 2. Card 组件 - 卡片容器
 */
export const Card: React.FC<CardProps> = ({
  title,
  extra,
  shadow = 'default',
  collapsible,
  children,
  style,
  className,
}) => {
  const shadowStyles: Record<string, CSSProperties> = {
    never: { boxShadow: 'none' },
    hover: { boxShadow: '0 2px 8px rgba(0,0,0,0.09)' },
    default: { boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
  };
  const shadowStyle = shadowStyles[shadow];

  return (
    <AntCard
      title={title}
      extra={extra}
      style={{ ...shadowStyle, ...style }}
      className={className}
    >
      {children}
    </AntCard>
  );
};

/**
 * 3. Row 组件 - 栅格行
 */
export const Row: React.FC<{ gutter?: number | [number, number]; justify?: string; align?: string; children?: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({
  gutter,
  justify,
  align,
  children,
  style,
  className,
}) => {
  return (
    <AntRow
      gutter={gutter}
      justify={justify as any}
      align={align as any}
      style={style}
      className={className}
    >
      {children}
    </AntRow>
  );
};

/**
 * 4. Col 组件 - 栅格列
 */
export const Col: React.FC<{ span?: number; offset?: number; pull?: number; push?: number; xs?: number | Record<string, unknown>; sm?: number | Record<string, unknown>; md?: number | Record<string, unknown>; lg?: number | Record<string, unknown>; xl?: number | Record<string, unknown>; xxl?: number | Record<string, unknown>; children?: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({
  span,
  offset,
  pull,
  push,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  children,
  style,
  className,
}) => {
  return (
    <AntCol
      span={span}
      offset={offset}
      pull={pull}
      push={push}
      xs={xs as any}
      sm={sm as any}
      md={md as any}
      lg={lg as any}
      xl={xl as any}
      xxl={xxl as any}
      style={style}
      className={className}
    >
      {children}
    </AntCol>
  );
};

/**
 * 5. Form 组件 - 表单容器
 */
export const Form = <T extends Record<string, unknown>>({
  model,
  rules,
  labelWidth,
  onSubmit,
  children,
  style,
  className,
}: FormProps<T>): React.ReactElement => {
  const [form] = AntForm.useForm();

  const handleFinish = (values: T) => {
    onSubmit?.(values);
  };

  return (
    <AntForm
      form={form}
      initialValues={model}
      onFinish={handleFinish}
      labelCol={{ style: { width: labelWidth } }}
      style={style}
      className={className}
    >
      {children}
    </AntForm>
  );
};

/**
 * 6. Input 组件 - 输入框
 */
export const Input: React.FC<InputProps> = ({
  value,
  defaultValue,
  placeholder,
  disabled,
  maxLength,
  type = 'text',
  onChange,
  onBlur,
  onFocus,
  style,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  if (type === 'textarea') {
    return (
      <AntInput.TextArea
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        style={style}
        className={className}
      />
    );
  }

  return (
    <AntInput
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      type={type}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      style={style}
      className={className}
    />
  );
};

/**
 * 7. Select 组件 - 选择器
 */
export const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  options,
  placeholder,
  disabled,
  multiple,
  filterable,
  clearable,
  onChange,
  style,
  className,
}) => {
  return (
    <AntSelect
      value={value}
      defaultValue={defaultValue}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      mode={multiple ? 'multiple' : undefined}
      showSearch={filterable}
      allowClear={clearable}
      onChange={onChange}
      style={{ width: '100%', ...style }}
      className={className}
    />
  );
};

/**
 * 将 Date/string/dayjs 转换为 dayjs 对象
 */
const toDayjs = (value: unknown): dayjs.Dayjs | null | undefined => {
  if (value === null || value === undefined) {
    return value as null | undefined;
  }
  if (dayjs.isDayjs(value)) {
    return value;
  }
  if (value instanceof Date) {
    return dayjs(value);
  }
  if (typeof value === 'string') {
    return dayjs(value);
  }
  return null;
};

/**
 * 8. DatePicker 组件 - 日期选择器
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  defaultValue,
  format = 'YYYY-MM-DD',
  placeholder,
  disabled,
  type = 'date',
  onChange,
  style,
  className,
}) => {
  // 将 Date/string 转换为 dayjs
  const dayjsValue = toDayjs(value);
  const dayjsDefaultValue = toDayjs(defaultValue);

  // 处理 onChange，将 dayjs 转换回 Date
  const handleChange = (dayjsDate: dayjs.Dayjs | null) => {
    if (onChange) {
      onChange(dayjsDate ? dayjsDate.toDate() : undefined);
    }
  };

  if (type === 'daterange') {
    return (
      <AntDatePicker.RangePicker
        value={value as any}
        defaultValue={defaultValue as any}
        format={format}
        placeholder={placeholder as [string, string]}
        disabled={disabled}
        onChange={onChange as any}
        style={{ width: '100%', ...style }}
        className={className}
      />
    );
  }

  return (
    <AntDatePicker
      value={dayjsValue}
      defaultValue={dayjsDefaultValue}
      format={format}
      placeholder={placeholder as string}
      disabled={disabled}
      onChange={handleChange}
      style={{ width: '100%', ...style }}
      className={className}
    />
  );
};

/**
 * 9. Table 组件 - 数据表格
 */
export const Table = <T extends Record<string, unknown> = Record<string, unknown>>({
  data,
  columns,
  rowKey = 'id',
  selection,
  pagination,
  loading,
  onSelectionChange,
  style,
  className,
}: TableProps<T>): React.ReactElement => {
  // 将 DSL 列定义映射到 Ant Design 列定义
  // DSL 使用 prop/label，Ant Design 使用 dataIndex/title
  const antdColumns = columns.map((col: any) => ({
    title: col.label || col.title,  // 支持 DSL 的 label 和 Ant Design 的 title
    dataIndex: col.prop || col.dataIndex,  // 支持 DSL 的 prop 和 Ant Design 的 dataIndex
    key: col.key || col.prop || col.dataIndex,
    width: col.width,
    fixed: col.fixed,
    align: col.align,
    sorter: col.sortable,
    filters: col.filters,
    // formatter 签名: (value, record, index) => ReactNode
    render: col.formatter 
      ? (value: unknown, record: T, index: number) => col.formatter(value, record, index)
      : col.render,
  }));

  // 使用类型断言来处理 AntD 的类型要求
  const dataSource = data as unknown as readonly Record<string, unknown>[];
  const rowKeyFn = typeof rowKey === 'function' 
    ? (record: Record<string, unknown>) => String((rowKey as any)(record as T))
    : String(rowKey);

  return (
    <AntTable<Record<string, unknown>>
      dataSource={dataSource}
      columns={antdColumns as any}
      rowKey={rowKeyFn}
      rowSelection={
        selection
          ? {
              type: selection.type,
              selectedRowKeys: selection.selectedRowKeys,
              onChange: (keys: React.Key[], rows: Record<string, unknown>[]) => {
                onSelectionChange?.(keys as string[], rows as T[]);
              },
            }
          : undefined
      }
      pagination={pagination}
      loading={loading}
      style={style}
      className={className}
    />
  );
};

/**
 * 10. Button 组件 - 按钮
 */
export const Button: React.FC<ButtonProps> = ({
  type = 'default',
  size = 'middle',
  loading,
  disabled,
  onClick,
  children,
  style,
  className,
}) => {
  return (
    <AntButton
      type={type as any}
      size={size}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={className}
    >
      {children}
    </AntButton>
  );
};

/**
 * 11. Modal 组件 - 对话框
 */
// Modal 组件基础实现
const ModalComponent: React.FC<ModalProps> = ({
  visible,
  title,
  width,
  footer,
  onOk,
  onCancel,
  children,
  style,
  className,
}) => {
  return (
    <AntModal
      open={visible}
      title={title}
      width={width}
      footer={footer}
      onOk={onOk}
      onCancel={onCancel}
      style={style}
      className={className}
    >
      {children}
    </AntModal>
  );
};

// 添加静态方法
export const Modal = Object.assign(ModalComponent, {
  confirm: AntModal.confirm,
  info: AntModal.info,
  success: AntModal.success,
  error: AntModal.error,
  warning: AntModal.warning,
  warn: AntModal.warn,
});

/**
 * 12. Tag 组件 - 标签
 */
export const Tag: React.FC<TagProps> = ({
  color,
  closable,
  onClose,
  children,
  style,
  className,
}) => {
  return (
    <AntTag
      color={color}
      closable={closable}
      onClose={onClose}
      style={style}
      className={className}
    >
      {children}
    </AntTag>
  );
};

/**
 * 13. Breadcrumb 组件 - 面包屑导航
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = '/',
  style,
  className,
}) => {
  const breadcrumbItems = items.map((item: BreadcrumbProps['items'][number]) => ({
    title: item.href ? <a href={item.href}>{item.label}</a> : item.label,
  }));

  return (
    <AntBreadcrumb
      separator={separator}
      items={breadcrumbItems}
      style={style}
      className={className}
    />
  );
};

/**
 * 14. Menu 组件 - 导航菜单
 */
export const Menu: React.FC<MenuProps> = ({
  items,
  mode = 'vertical',
  defaultSelectedKeys,
  onSelect,
  style,
  className,
}) => {
  const menuItems = items.map((item: MenuProps['items'][number]) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    children: item.children?.map((child: { key: string; label: string }) => ({
      key: child.key,
      label: child.label,
    })),
  }));

  return (
    <AntMenu
      mode={mode}
      defaultSelectedKeys={defaultSelectedKeys}
      items={menuItems}
      onSelect={({ key }) => onSelect?.(key)}
      style={style}
      className={className}
    />
  );
};

/**
 * 15. Descriptions 组件 - 描述列表
 */
export const Descriptions: React.FC<DescriptionsProps> = ({
  title,
  column = 3,
  items,
  bordered,
  style,
  className,
}) => {
  return (
    <AntDescriptions
      title={title}
      column={column}
      bordered={bordered}
      style={style}
      className={className}
    >
      {items.map((item: DescriptionsProps['items'][number], index: number) => (
        <AntDescriptions.Item key={index} label={item.label} span={item.span}>
          {item.value}
        </AntDescriptions.Item>
      ))}
    </AntDescriptions>
  );
};

/**
 * 16. Icon 组件 - 图标
 */
export const Icon: React.FC<IconProps> = ({ name, size, color, style, className }) => {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ style?: CSSProperties; className?: string }>>)[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in @ant-design/icons`);
    return null;
  }

  return React.createElement(IconComponent, {
    style: { fontSize: size, color, ...style },
    className,
  });
};

/**
 * 17. Divider 组件 - 分割线
 */
export const Divider: React.FC<{ orientation?: 'left' | 'center' | 'right'; dashed?: boolean; children?: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({
  orientation = 'center',
  dashed,
  children,
  style,
  className,
}) => {
  return (
    <AntDivider
      orientation={orientation}
      dashed={dashed}
      style={style}
      className={className}
    >
      {children}
    </AntDivider>
  );
};

/**
 * 18. Space 组件 - 间距
 */
export const Space: React.FC<{ size?: 'small' | 'middle' | 'large' | number; direction?: 'horizontal' | 'vertical'; align?: 'start' | 'end' | 'center' | 'baseline'; wrap?: boolean; children?: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({
  size = 'small',
  direction = 'horizontal',
  align,
  wrap,
  children,
  style,
  className,
}) => {
  return (
    <AntSpace
      size={size}
      direction={direction}
      align={align}
      wrap={wrap}
      style={style}
      className={className}
    >
      {children}
    </AntSpace>
  );
};

/**
 * 19. Message API - 全局提示
 */
export const Message: MessageAPI = {
  success: (content: string, duration?: number) => {
    antMessage.success(content, duration);
  },
  error: (content: string, duration?: number) => {
    antMessage.error(content, duration);
  },
  warning: (content: string, duration?: number) => {
    antMessage.warning(content, duration);
  },
  info: (content: string, duration?: number) => {
    antMessage.info(content, duration);
  },
  loading: (content: string, duration?: number) => {
    antMessage.loading(content, duration);
  },
};

/**
 * FormItem 组件 - 表单项（Ant Design 特有）
 * 作为 Form 的子组件使用
 */
export const FormItem: React.FC<{
  name?: string;
  label?: string;
  rules?: unknown[];
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ name, label, rules, children, style, className }) => {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={rules as any}
      style={style}
      className={className}
    >
      {children}
    </AntForm.Item>
  );
};

