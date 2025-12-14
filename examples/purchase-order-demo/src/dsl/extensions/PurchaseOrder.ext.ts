/**
 * 采购订单扩展
 * 
 * 🎯 使用 defineExtension 统一定义扩展（带类型安全检查）
 *    - 自动挂载方法到 prototype
 *    - 自动注册到 Metadata Store
 *    - 方法名拼写错误会被 TypeScript 检测到
 * 
 * @example
 * ```typescript
 * const order = new PurchaseOrder();
 * order.getItemCount();      // 扩展方法
 * order.calculateTotal();    // 扩展方法
 * order.isEditable();        // 扩展方法
 * ```
 */

import { defineExtension } from '@ai-builder/jsx-runtime';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  SupplierInfo,
  PurchaseOrderStatus 
} from '../models/PurchaseOrder.model';

// ==================== 1. 定义扩展方法接口 ====================

interface PurchaseOrderExtensionMethods {
  /** 获取订单明细数量 */
  getItemCount?(): number;
  /** 计算订单总额 */
  calculateTotal?(): number;
  /** 检查订单是否可编辑 */
  isEditable?(): boolean;
  /** 检查订单是否可审批 */
  isApprovable?(): boolean;
  /** 检查订单是否可取消 */
  isCancellable?(): boolean;
  /** 获取状态标签 */
  getStatusLabel?(): string;
  /** 获取格式化的总额 */
  getFormattedTotal?(): string;
}

interface PurchaseOrderItemExtensionMethods {
  /** 计算明细金额 */
  calculateAmount?(): number;
  /** 获取格式化的金额 */
  getFormattedAmount?(): string;
  /** 获取格式化的单价 */
  getFormattedUnitPrice?(): string;
  /** 获取完整的物料描述 */
  getFullDescription?(): string;
}

interface SupplierInfoExtensionMethods {
  /** 获取完整的联系信息 */
  getContactInfo?(): string;
  /** 获取简短描述 */
  getShortDescription?(): string;
}

// ==================== 2. 类型声明扩展（IDE 支持） ====================

declare module '../models/PurchaseOrder.model' {
  interface PurchaseOrder extends PurchaseOrderExtensionMethods {}
  interface PurchaseOrderItem extends PurchaseOrderItemExtensionMethods {}
  interface SupplierInfo extends SupplierInfoExtensionMethods {}
}

// ==================== 3. 定义扩展（带类型安全检查） ====================

// PurchaseOrder 扩展
defineExtension<typeof PurchaseOrder, PurchaseOrderExtensionMethods>({
  name: 'PurchaseOrderExtension',
  description: '采购订单扩展方法',
  target: PurchaseOrder,
  methods: {
    getItemCount: {
      description: '获取订单明细数量',
      returnType: 'number',
      implementation(this: PurchaseOrder) {
        return this.items?.length ?? 0;
      },
    },
    
    calculateTotal: {
      description: '计算订单总额',
      returnType: 'number',
      implementation(this: PurchaseOrder) {
        if (!this.items || this.items.length === 0) {
          return 0;
        }
        return this.items.reduce((sum, item) => {
          const amount = (item.quantity ?? 0) * (item.unitPrice ?? 0);
          return sum + amount;
        }, 0);
      },
    },
    
    isEditable: {
      description: '检查订单是否可编辑',
      returnType: 'boolean',
      implementation(this: PurchaseOrder) {
        return this.status === PurchaseOrderStatus.DRAFT;
      },
    },
    
    isApprovable: {
      description: '检查订单是否可审批',
      returnType: 'boolean',
      implementation(this: PurchaseOrder) {
        return this.status === PurchaseOrderStatus.PENDING;
      },
    },
    
    isCancellable: {
      description: '检查订单是否可取消',
      returnType: 'boolean',
      implementation(this: PurchaseOrder) {
        const cancellableStatuses: string[] = [
          PurchaseOrderStatus.DRAFT,
          PurchaseOrderStatus.PENDING,
          PurchaseOrderStatus.APPROVED,
        ];
        return cancellableStatuses.includes(this.status as string);
      },
    },
    
    getStatusLabel: {
      description: '获取状态标签',
      returnType: 'string',
      implementation(this: PurchaseOrder) {
        return PurchaseOrderStatus.getLabel(this.status as string) ?? '未知状态';
      },
    },
    
    getFormattedTotal: {
      description: '获取格式化的总额',
      returnType: 'string',
      implementation(this: PurchaseOrder) {
        return `¥${(this.totalAmount ?? 0).toLocaleString('zh-CN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      },
    },
  },
});

// PurchaseOrderItem 扩展
defineExtension<typeof PurchaseOrderItem, PurchaseOrderItemExtensionMethods>({
  name: 'PurchaseOrderItemExtension',
  description: '采购订单明细扩展方法',
  target: PurchaseOrderItem,
  methods: {
    calculateAmount: {
      description: '计算明细金额',
      returnType: 'number',
      implementation(this: PurchaseOrderItem) {
        return (this.quantity ?? 0) * (this.unitPrice ?? 0);
      },
    },
    
    getFormattedAmount: {
      description: '获取格式化的金额',
      returnType: 'string',
      implementation(this: PurchaseOrderItem) {
        const amount = this.calculateAmount?.() ?? ((this.quantity ?? 0) * (this.unitPrice ?? 0));
        return `¥${amount.toLocaleString('zh-CN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      },
    },
    
    getFormattedUnitPrice: {
      description: '获取格式化的单价',
      returnType: 'string',
      implementation(this: PurchaseOrderItem) {
        return `¥${(this.unitPrice ?? 0).toLocaleString('zh-CN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      },
    },
    
    getFullDescription: {
      description: '获取完整的物料描述',
      returnType: 'string',
      implementation(this: PurchaseOrderItem) {
        const parts = [this.materialName ?? this.materialCode];
        if (this.specification) {
          parts.push(`(${this.specification})`);
        }
        return parts.join(' ');
      },
    },
  },
});

// SupplierInfo 扩展
defineExtension<typeof SupplierInfo, SupplierInfoExtensionMethods>({
  name: 'SupplierInfoExtension',
  description: '供应商信息扩展方法',
  target: SupplierInfo,
  methods: {
    getContactInfo: {
      description: '获取完整的联系信息',
      returnType: 'string',
      implementation(this: SupplierInfo) {
        const parts: string[] = [];
        if (this.contactPerson) {
          parts.push(this.contactPerson);
        }
        if (this.contactPhone) {
          parts.push(this.contactPhone);
        }
        return parts.join(' / ') || '暂无联系信息';
      },
    },
    
    getShortDescription: {
      description: '获取简短描述',
      returnType: 'string',
      implementation(this: SupplierInfo) {
        return `${this.name} (${this.code})`;
      },
    },
  },
});
