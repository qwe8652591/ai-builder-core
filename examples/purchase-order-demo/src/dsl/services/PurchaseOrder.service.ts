/**
 * 采购订单服务 - 装饰器版本
 * 
 * 业务逻辑层，调用 Repository
 */

import { Service, Method } from '@ai-builder/jsx-runtime';
import { 
  PurchaseOrderStatus,
  type PurchaseOrderItem,
  type SupplierInfo,
} from '../models/PurchaseOrder.model';
import { PurchaseOrderRepository } from '../repositories/PurchaseOrder.repository';
import type { 
  PurchaseOrderListItemDTO,
  PurchaseOrderDetailDTO,
} from '../dto/PurchaseOrder.dto';

// ==================== Service 装饰器版本 ====================

/**
 * 采购订单 Service
 * 
 * 提供业务逻辑，调用 Repository
 */
@Service({ description: '采购订单业务服务' })
export class PurchaseOrderService {
  
  /**
   * 创建订单
   */
  @Method({ description: '创建订单', command: true })
  static async createOrder(data: {
    title: string;
    supplier: SupplierInfo;
    items: Omit<PurchaseOrderItem, 'id'>[];
    remark?: string;
    createdBy: string;
  }): Promise<string> {
    // 验证
    if (!data.items || data.items.length === 0) {
      throw new Error('订单明细不能为空');
    }
    
    // 调用 Repository
    const orderId = await PurchaseOrderRepository.create(data);
    
    console.log('[Service] 创建订单成功:', orderId);
    return orderId;
  }
  
  /**
   * 获取订单列表
   */
  @Method({ description: '获取订单列表', query: true })
  static async getOrderList(params: {
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ data: PurchaseOrderListItemDTO[]; total: number }> {
    const result = await PurchaseOrderRepository.findList(params);
    
    // 转换为 DTO
    const data: PurchaseOrderListItemDTO[] = result.data.map(order => ({
      id: order.id,
      orderNo: order.orderNo,
      title: order.title,
      totalAmount: order.totalAmount,
      status: order.status,
      createdBy: order.createdBy ?? '',
      createdAt: order.createdAt ?? new Date(),
      supplierName: order.supplier.name,
      statusLabel: PurchaseOrderStatus.getLabel(order.status ?? '') ?? order.status ?? '',
    }));
    
    return { data, total: result.total };
  }
  
  /**
   * 获取订单详情
   */
  @Method({ description: '获取订单详情', query: true })
  static async getOrderDetail(orderId: string): Promise<PurchaseOrderDetailDTO | null> {
    const order = await PurchaseOrderRepository.findById(orderId);
    if (!order) return null;
    
    // 转换为 DTO
    return {
      id: order.id,
      orderNo: order.orderNo,
      title: order.title,
      supplier: order.supplier,
      items: order.items.map(item => ({
        ...item,
        amount: item.quantity * item.unitPrice,
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      statusLabel: PurchaseOrderStatus.getLabel(order.status ?? '') ?? order.status ?? '',
      createdBy: order.createdBy,
      createdAt: order.createdAt,
      remark: order.remark,
      // 计算操作权限
      canEdit: order.status === 'DRAFT',
      canSubmit: order.status === 'DRAFT',
      canApprove: order.status === 'PENDING',
      canReject: order.status === 'PENDING',
      canCancel: ['DRAFT', 'PENDING'].includes(order.status ?? ''),
      canDelete: order.status === 'DRAFT',
      canStartExecution: order.status === 'APPROVED',
      canComplete: order.status === 'IN_PROGRESS',
    };
  }
  
  /**
   * 删除订单
   */
  @Method({ description: '删除订单', command: true })
  static async deleteOrder(orderId: string): Promise<void> {
    const order = await PurchaseOrderRepository.findById(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (order.status !== 'DRAFT') {
      throw new Error('只有草稿状态的订单可以删除');
    }
    
    await PurchaseOrderRepository.delete(orderId);
    console.log('[Service] 删除订单成功:', orderId);
  }
  
  /**
   * 提交订单
   */
  @Method({ description: '提交订单', command: true })
  static async submitOrder(orderId: string): Promise<void> {
    const order = await PurchaseOrderRepository.findById(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (order.status !== 'DRAFT') {
      throw new Error('只有草稿状态的订单可以提交');
    }
    
    await PurchaseOrderRepository.updateStatus(orderId, 'PENDING');
    console.log('[Service] 提交订单成功:', orderId);
  }
  
  /**
   * 更新订单
   */
  @Method({ description: '更新订单', command: true })
  static async updateOrder(orderId: string, data: {
    title?: string;
    supplier?: SupplierInfo;
    items?: PurchaseOrderItem[];
    remark?: string;
  }): Promise<void> {
    const order = await PurchaseOrderRepository.findById(orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    if (order.status !== 'DRAFT') {
      throw new Error('只有草稿状态的订单可以编辑');
    }
    
    // 计算新的总金额（如果有明细更新）
    let totalAmount = order.totalAmount;
    if (data.items) {
      totalAmount = data.items.reduce((sum, item) => {
        return sum + (item.quantity || 0) * (item.unitPrice || 0);
      }, 0);
    }
    
    await PurchaseOrderRepository.update(orderId, {
      ...data,
      totalAmount,
    });
    
    console.log('[Service] 更新订单成功:', orderId);
  }
}

