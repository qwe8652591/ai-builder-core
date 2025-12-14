/**
 * 分页查询参数接口
 */
export interface PageQuery {
  /** 页码（从 1 开始） */
  pageNo?: number;
  /** 每页大小 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页参数别名
 */
export type PageParam = PageQuery;

/**
 * 分页结果
 */
export interface PageResult<T> {
  /** 数据列表 */
  list: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  pageNo: number;
  /** 每页大小 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}




