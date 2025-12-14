/**
 * Table 组件 Props
 * 
 * 表格组件，支持泛型数据和列定义。
 * 
 * @example
 * ```tsx
 * interface Order {
 *   id: string;
 *   orderNo: string;
 *   amount: number;
 * }
 * 
 * const columns: ColumnDefinition<Order>[] = [
 *   { prop: 'orderNo', label: '订单号' },
 *   { prop: 'amount', label: '金额', formatter: (row) => `¥${row.amount}` }
 * ];
 * 
 * <Table<Order>
 *   data={orders.value}
 *   columns={columns}
 *   onRowClick={handleRowClick}
 * />
 * ```
 */

import type { BaseProps, Children, PaginationConfig } from '../types';

/**
 * 列定义
 * 
 * @template T - 数据项类型
 */
export interface ColumnDefinition<T = unknown> {
  /**
   * 列标识（对应数据字段名）
   */
  prop: keyof T | string;
  
  /**
   * 列标题
   */
  label: string;
  
  /**
   * 列宽度
   */
  width?: number | string;
  
  /**
   * 最小列宽
   */
  minWidth?: number | string;
  
  /**
   * 是否固定列
   */
  fixed?: 'left' | 'right' | boolean;
  
  /**
   * 对齐方式
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';
  
  /**
   * 是否可排序
   * @default false
   */
  sortable?: boolean;
  
  /**
   * 格式化函数
   */
  formatter?: (row: T, column: ColumnDefinition<T>, cellValue: unknown, index: number) => string | Children;
  
  /**
   * 自定义渲染函数
   */
  render?: (row: T, column: ColumnDefinition<T>, index: number) => Children;
  
  /**
   * 类名
   */
  className?: string;
  
  /**
   * 表头类名
   */
  headerClassName?: string;
}

/**
 * 排序配置
 */
export interface SortConfig {
  /**
   * 排序字段
   */
  prop: string;
  
  /**
   * 排序顺序
   */
  order: 'ascending' | 'descending';
}

/**
 * 选择配置
 */
export interface SelectionConfig<T = Record<string, unknown>> {
  /**
   * 是否可选择
   * @default false
   */
  enabled?: boolean;
  
  /**
   * 选择类型
   * @default 'checkbox'
   */
  type?: 'checkbox' | 'radio';
  
  /**
   * 已选择的行
   */
  selectedRows?: T[];
  
  /**
   * 选择变化回调
   */
  onSelectionChange?: (selectedRows: T[]) => void;
  
  /**
   * 是否可选择函数
   */
  selectable?: (row: T, index: number) => boolean;
}

export interface TableProps<T = Record<string, unknown>> extends BaseProps {
  /**
   * 表格数据
   */
  data: T[];
  
  /**
   * 列定义
   */
  columns: ColumnDefinition<T>[];
  
  /**
   * 行唯一标识字段名
   * @default 'id'
   */
  rowKey?: keyof T | string;
  
  /**
   * 是否显示边框
   * @default false
   */
  bordered?: boolean;
  
  /**
   * 是否显示斑马纹
   * @default false
   */
  striped?: boolean;
  
  /**
   * 是否高亮当前行
   * @default false
   */
  highlightCurrentRow?: boolean;
  
  /**
   * 表格尺寸
   * @default 'default'
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * 表格高度（固定表头）
   */
  height?: number | string;
  
  /**
   * 表格最大高度
   */
  maxHeight?: number | string;
  
  /**
   * 加载状态
   * @default false
   */
  loading?: boolean;
  
  /**
   * 空数据提示
   * @default '暂无数据'
   */
  emptyText?: string | Children;
  
  /**
   * 选择配置
   */
  selection?: SelectionConfig<T>;
  
  /**
   * 默认排序
   */
  defaultSort?: SortConfig;
  
  /**
   * 分页配置
   */
  pagination?: PaginationConfig;
  
  /**
   * 行点击事件
   */
  onRowClick?: (row: T, index: number) => void;
  
  /**
   * 行双击事件
   */
  onRowDblClick?: (row: T, index: number) => void;
  
  /**
   * 排序变化事件
   */
  onSortChange?: (sort: SortConfig) => void;
  
  /**
   * 行类名函数
   */
  rowClassName?: (row: T, index: number) => string;
  
  /**
   * 单元格类名函数
   */
  cellClassName?: (row: T, column: ColumnDefinition<T>, rowIndex: number, columnIndex: number) => string;
}

