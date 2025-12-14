/**
 * 订单卡片组件
 * 
 * 使用 defineComponent 简洁语法定义
 */

import { defineComponent } from '@qwe8652591/dsl-core';
import { Card, Space, Tag } from '@qwe8652591/std-ui';
import type { PurchaseOrderListItemDTO } from '../dto/PurchaseOrder.dto';

/** 订单卡片 Props */
export interface OrderCardProps {
  order: PurchaseOrderListItemDTO;
  onClick?: (id: string) => void;
}

/** 状态颜色映射 */
function getStatusColor(status?: string): string {
  if (!status) return 'default';
  const colors: Record<string, string> = {
    DRAFT: 'default',
    PENDING: 'processing',
    APPROVED: 'success',
    IN_PROGRESS: 'processing',
    COMPLETED: 'success',
    CANCELLED: 'default',
  };
  return colors[status] || 'default';
}

/**
 * 订单卡片组件
 * 
 * 展示订单的基本信息
 */
export const OrderCard = defineComponent<OrderCardProps>(
  { 
    name: 'OrderCard', 
    description: '订单卡片，展示订单基本信息',
    category: 'business',
  },
  (props) => (
    <Card 
      title={props.order.orderNo}
      style={{ cursor: 'pointer', marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div><strong>标题:</strong> {props.order.title}</div>
        <div><strong>供应商:</strong> {props.order.supplierName}</div>
        <div><strong>金额:</strong> ¥{Number(props.order.totalAmount).toFixed(2)}</div>
        <div>
          <strong>状态:</strong>
          <Tag color={getStatusColor(props.order.status)}>
            {props.order.statusLabel}
          </Tag>
        </div>
      </Space>
    </Card>
  )
);

export default OrderCard;
