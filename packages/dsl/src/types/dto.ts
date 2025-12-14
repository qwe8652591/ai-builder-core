/**
 * DTO (Data Transfer Object) 类型定义
 */

/**
 * 通用 DTO 接口
 * 
 * 用于应用层与外部的数据传输
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DTO {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * 操作结果
 * 
 * 用于 AppService 的统一返回格式
 */
export interface Result<T = void> {
  /** 操作是否成功 */
  success: boolean;
  /** 成功时的返回数据 */
  data?: T;
  /** 提示信息（成功/失败/警告） */
  message?: string;
  /** 错误码或业务码 */
  code?: string;
}

/**
 * 通用错误码
 */
export enum CommonErrorCode {
  // 参数错误
  ERR_INVALID_PARAM = 'ERR_INVALID_PARAM',
  ERR_MISSING_PARAM = 'ERR_MISSING_PARAM',
  
  // 数据错误
  ERR_NOT_FOUND = 'ERR_NOT_FOUND',
  ERR_ALREADY_EXISTS = 'ERR_ALREADY_EXISTS',
  ERR_DATA_CONFLICT = 'ERR_DATA_CONFLICT',
  
  // 权限错误
  ERR_PERMISSION_DENIED = 'ERR_PERMISSION_DENIED',
  ERR_UNAUTHORIZED = 'ERR_UNAUTHORIZED',
  
  // 状态错误
  ERR_INVALID_STATUS = 'ERR_INVALID_STATUS',
  ERR_STATUS_CONFLICT = 'ERR_STATUS_CONFLICT',
  
  // 系统错误
  ERR_INTERNAL_ERROR = 'ERR_INTERNAL_ERROR',
  ERR_UNKNOWN = 'ERR_UNKNOWN',
}

/**
 * Result 辅助工具类
 */
export class ResultHelper {
  /**
   * 成功结果
   */
  static success<T>(data?: T, message?: string, code?: string): Result<T> {
    return { 
      success: true, 
      data, 
      message, 
      code 
    };
  }

/**
   * 失败结果
   */
  static error<T = never>(message: string, code?: string): Result<T> {
    return { 
      success: false, 
      message, 
      code: code || CommonErrorCode.ERR_UNKNOWN 
    };
  }

/**
   * 警告结果（成功但有警告信息）
   */
  static warning<T>(data: T, message: string, code?: string): Result<T> {
    return { 
      success: true, 
      data, 
      message, 
      code 
    };
  }

/**
   * 从异常创建失败结果
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromError(error: any, defaultMessage = '操作失败', code?: string): Result<never> {
    return {
      success: false,
      message: error?.message || defaultMessage,
      code: code || error?.code || CommonErrorCode.ERR_UNKNOWN
    };
  }
}
