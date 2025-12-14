/**
 * 采购订单应用服务 - 装饰器版本
 * 
 * 暴露给表现层的接口，调用 Service
 */

import { 
  AppService, 
  Method,
  type Result,
  type PageResult,
} from '@ai-builder/jsx-runtime';
import { PurchaseOrderService } from './PurchaseOrder.service';
import { PurchaseOrderRepository } from '../repositories/PurchaseOrder.repository';
import type { 
  PurchaseOrderListItemDTO,
  PurchaseOrderDetailDTO,
  SupplierOptionDTO,
  MaterialOptionDTO,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  SimplePurchaseOrderDTO,
} from '../dto/PurchaseOrder.dto';

// ==================== AppService 装饰器版本 ====================

/**
 * 采购订单应用服务
 * 
 * 暴露给表现层，统一返回 Result 格式
 */
@AppService({ description: '采购订单应用服务', expose: true })
export class PurchaseOrderAppService {
  
  /**
   * 获取订单列表
   */
  @Method({ description: '获取订单列表', query: true })
  static async getPurchaseOrderList(query: {
    status?: string;
    pageNo?: number;
    pageSize?: number;
  }): Promise<Result<PageResult<PurchaseOrderListItemDTO>>> {
    try {
      const pageNo = query.pageNo || 1;
      const pageSize = query.pageSize || 20;
      
      const result = await PurchaseOrderService.getOrderList({
        status: query.status,
        offset: (pageNo - 1) * pageSize,
        limit: pageSize,
      });
      
      return {
        success: true,
        data: {
          list: result.data,
          total: result.total,
          pageNo,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
        },
      };
    } catch (e) {
      const error = e as Error;
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 获取订单详情
   */
  @Method({ description: '获取订单详情', query: true })
  static async getPurchaseOrderDetail(query: { id: string }): Promise<Result<PurchaseOrderDetailDTO>> {
    try {
      const order = await PurchaseOrderService.getOrderDetail(query.id);
      
      if (!order) {
        return { success: false, message: '订单不存在' };
      }
      
      return { success: true, data: order };
    } catch (e) {
      const error = e as Error;
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 删除订单
   */
  @Method({ description: '删除订单', command: true })
  static async deletePurchaseOrder(command: SimplePurchaseOrderDTO): Promise<Result<void>> {
    try {
      await PurchaseOrderService.deleteOrder(command.id);
      return { success: true, message: '删除成功' };
    } catch (e) {
      const error = e as Error;
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 提交订单
   */
  @Method({ description: '提交订单', command: true })
  static async submitPurchaseOrder(command: SimplePurchaseOrderDTO): Promise<Result<void>> {
    try {
      await PurchaseOrderService.submitOrder(command.id);
      return { success: true, message: '提交成功' };
    } catch (e) {
      const error = e as Error;
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 创建订单
   */
  @Method({ description: '创建订单', command: true })
  static async createPurchaseOrder(command: CreatePurchaseOrderDTO): Promise<Result<{ id: string }>> {
    try {
      const orderId = await PurchaseOrderService.createOrder({
        title: command.title,
        supplier: command.supplier,
        items: command.items,
        remark: command.remark,
        createdBy: command.createdBy,
      });
      return { success: true, data: { id: orderId }, message: '创建成功' };
    } catch (e) {
      const error = e as Error;
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 更新订单
   */
  @Method({ description: '更新订单', command: true })
  static async updatePurchaseOrder(command: UpdatePurchaseOrderDTO): Promise<Result<void>> {
    try {
      await PurchaseOrderService.updateOrder(command.id, {
        title: command.title,
        supplier: command.supplier,
        items: command.items,
        remark: command.remark,
      });
      return { success: true, message: '更新成功' };
    } catch (e) {
      const error = e as Error;
      return { success: false, message: error.message };
    }
  }
  
  // ==================== 选项数据查询 ====================
  
  /**
   * 获取供应商选项列表
   */
  @Method({ description: '获取供应商选项', query: true })
  static async getSupplierOptions(): Promise<Result<SupplierOptionDTO[]>> {
    try {
      const options = await PurchaseOrderRepository.getSupplierOptions();
      return { success: true, data: options as SupplierOptionDTO[] };
    } catch (e) {
      const error = e as Error;
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 获取物料选项列表
   */
  @Method({ description: '获取物料选项', query: true })
  static async getMaterialOptions(): Promise<Result<MaterialOptionDTO[]>> {
    try {
      const options = await PurchaseOrderRepository.getMaterialOptions();
      return { success: true, data: options as MaterialOptionDTO[] };
    } catch (e) {
      const error = e as Error;
      return { success: false, message: error.message };
    }
  }
}

