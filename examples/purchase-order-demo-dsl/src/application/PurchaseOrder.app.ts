/**
 * 采购订单应用服务
 * 
 * 负责业务编排、事件发布和 API 暴露
 * 通过 Service 层执行业务逻辑，不直接访问 Repository
 */

import { AppService, Action, Expose } from '@ai-builder/dsl';
import type { EventBus, PageResult } from '@ai-builder/dsl';
import { PurchaseOrderService } from './PurchaseOrder.service';
import {
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  SubmitPurchaseOrderDTO,
  ApprovePurchaseOrderDTO,
  RejectPurchaseOrderDTO,
  CancelPurchaseOrderDTO,
  StartExecutionDTO,
  CompletePurchaseOrderDTO,
  DeletePurchaseOrderDTO,
  GetPurchaseOrderListDTO,
  GetPurchaseOrderDetailDTO,
  CountPurchaseOrdersByStatusDTO,
  PurchaseOrderListItemDTO,
  PurchaseOrderDetailDTO,
  PurchaseOrderStatisticsDTO,
} from './dto/PurchaseOrderDTO';

/**
 * 采购订单应用服务
 * 
 * 🎯 职责：
 * - API 暴露（@Expose）
 * - 事件发布（EventBus）
 * - 业务编排（调用 Service）
 * 
 * ⚠️ 约束：
 * - 不直接访问 Repository
 * - 不包含业务逻辑
 * - 只负责协调和编排
 */
@AppService()
@Expose()
export class PurchaseOrderAppService {
  constructor(
    private readonly service: PurchaseOrderService,
    private readonly eventBus: EventBus
  ) {}

  /**
   * 创建采购订单
   */
  @Action()
  @Expose()
  async createPurchaseOrder(command: CreatePurchaseOrderDTO): Promise<string> {
    // 调用 Service 执行业务逻辑
    const orderId = await this.service.createOrder(command);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderCreated' },
      orderId: orderId,
      orderNo: command.title, // 实际应该从返回值获取
    });

    return orderId;
  }

  /**
   * 更新采购订单
   */
  @Action()
  @Expose()
  async updatePurchaseOrder(command: UpdatePurchaseOrderDTO): Promise<void> {
    // 调用 Service
    await this.service.updateOrder(command);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderUpdated' },
      orderId: command.id,
    });
  }

  /**
   * 提交审批
   */
  @Action()
  @Expose()
  async submitPurchaseOrder(command: SubmitPurchaseOrderDTO): Promise<void> {
    // 调用 Service
    await this.service.submitForApproval(command.id);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderSubmitted' },
      orderId: command.id,
    });
  }

  /**
   * 审批通过
   */
  @Action()
  @Expose()
  async approvePurchaseOrder(command: ApprovePurchaseOrderDTO): Promise<void> {
    // 调用 Service
    await this.service.approve(command.id, command.approvedBy, command.comment);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderApproved' },
      orderId: command.id,
      approvedBy: command.approvedBy,
    });
  }

  /**
   * 审批拒绝
   */
  @Action()
  @Expose()
  async rejectPurchaseOrder(command: RejectPurchaseOrderDTO): Promise<void> {
    // 调用 Service
    await this.service.reject(command.id, command.approvedBy, command.comment);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderRejected' },
      orderId: command.id,
      approvedBy: command.approvedBy,
      reason: command.comment,
    });
  }

  /**
   * 取消订单
   */
  @Action()
  @Expose()
  async cancelPurchaseOrder(command: CancelPurchaseOrderDTO): Promise<void> {
    // 调用 Service
    await this.service.cancel(command.id, command.reason);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderCancelled' },
      orderId: command.id,
    });
  }

  /**
   * 开始执行
   */
  @Action()
  @Expose()
  async startExecution(command: StartExecutionDTO): Promise<void> {
    // 调用 Service
    await this.service.startExecution(command.id);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderExecutionStarted' },
      orderId: command.id,
    });
  }

  /**
   * 完成订单
   */
  @Action()
  @Expose()
  async completePurchaseOrder(command: CompletePurchaseOrderDTO): Promise<void> {
    // 调用 Service
    await this.service.complete(command.id);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderCompleted' },
      orderId: command.id,
    });
  }

  /**
   * 删除订单
   */
  @Action()
  @Expose()
  async deletePurchaseOrder(command: DeletePurchaseOrderDTO): Promise<void> {
    // 调用 Service
    await this.service.deleteOrder(command.id);

    // 发布事件
    await this.eventBus.publish({
      constructor: { name: 'PurchaseOrderDeleted' },
      orderId: command.id,
    });
  }

  /**
   * 查询采购订单列表
   */
  @Action()
  @Expose()
  async getPurchaseOrderList(
    query: GetPurchaseOrderListDTO
  ): Promise<PageResult<PurchaseOrderListItemDTO>> {
    // 调用 Service 查询
    const result = await this.service.getOrderList({
      status: query.status,
      supplierCode: undefined, // query 中没有此字段
      orderNo: undefined,
      offset: ((query.pageNo || 1) - 1) * (query.pageSize || 20),
      limit: query.pageSize || 20,
    });

    // 转换为分页结果
    return {
      list: result.data,
      total: result.total,
      pageNo: query.pageNo || 1,
      pageSize: query.pageSize || 20,
      totalPages: Math.ceil(result.total / (query.pageSize || 20)),
    };
  }

  /**
   * 查询采购订单详情
   */
  @Action()
  @Expose()
  async getPurchaseOrderDetail(
    query: GetPurchaseOrderDetailDTO
  ): Promise<PurchaseOrderDetailDTO> {
    // 调用 Service 查询
    return await this.service.getOrderDetail(query.id);
  }

  /**
   * 统计采购订单数量
   */
  @Action()
  @Expose()
  async countPurchaseOrdersByStatus(
    query: CountPurchaseOrdersByStatusDTO
  ): Promise<PurchaseOrderStatisticsDTO> {
    // 调用 Service 统计
    return await this.service.getStatistics(query.userId);
  }
}

/**
 * 🎯 架构说明：
 * 
 * 1. AppService (本文件)
 *    - 暴露 HTTP API (@Expose)
 *    - 发布领域事件 (EventBus)
 *    - 编排业务流程（调用 Service）
 *    - 不包含业务逻辑
 * 
 * 2. Service (PurchaseOrder.service.ts)
 *    - 内部业务逻辑封装
 *    - 调用 Repository 访问数据
 *    - 调用 DomainLogic 执行业务规则
 *    - 不暴露 API
 * 
 * 3. Repository (PurchaseOrder.repository.ts)
 *    - 数据持久化
 *    - 查询构建
 *    - 数据库映射
 *    - 不包含业务逻辑
 * 
 * 调用链：
 * API Request → AppService → Service → Repository → Database
 *                    ↓
 *                EventBus
 */
