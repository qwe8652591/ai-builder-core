/**
 * PurchaseOrder 扩展示例
 * 
 * ⚠️ 注意：这是一个**演示文件**
 * 
 * 实际使用场景：
 * - 当 PurchaseOrder 来自 NPM 包时（如 @your-org/base-models）
 * - 需要在不修改 NPM 包代码的情况下添加字段
 * 
 * 当前项目中，PurchaseOrder 是本地模型，扩展字段会直接包含在
 * PurchaseOrder.schema.ts 中，不会生成单独的 .schema.ext.ts 文件
 */

import { PurchaseOrder } from '../PurchaseOrder.model';
import { extendEntity } from '@ai-builder/dsl';

// ========== 1. TypeScript 类型扩展（编译时） ==========
// 这部分让 TypeScript 编译器知道有新字段，提供类型检查和智能提示
declare module '../PurchaseOrder.model' {
  interface PurchaseOrder {
    /**
     * 内部审批状态
     * 示例：PENDING, APPROVED, REJECTED
     */
    internalApprovalStatus?: string;
    
    /**
     * 审批人工号
     */
    approverEmployeeNo?: string;
    
    /**
     * 自定义备注
     */
    customRemark?: string;
    
    /**
     * 扩展标签（JSON 格式）
     */
    customTags?: string;
  }
}

// ========== 2. 运行时元数据注册（Schema 生成时） ==========
// 这部分让 Schema 生成器知道有新字段，生成正确的数据库 Schema
extendEntity(PurchaseOrder, {
  // fromPackage: '@your-org/base-models',  // ← 注释掉，因为是本地模型
  // ⚠️ 如果 PurchaseOrder 来自 NPM 包，取消注释上面这行
  fields: {
    internalApprovalStatus: {
      type: 'string',
      label: '内部审批状态',
      nullable: true,
      dbField: {
        type: 'VARCHAR',
        length: 50,
        comment: '内部审批状态：PENDING-待审批, APPROVED-已批准, REJECTED-已拒绝',
      },
      validation: {
        maxLength: 50,
      },
    },
    approverEmployeeNo: {
      type: 'string',
      label: '审批人工号',
      nullable: true,
      dbField: {
        type: 'VARCHAR',
        length: 20,
        comment: '审批人工号',
      },
    },
    customRemark: {
      type: 'string',
      label: '自定义备注',
      nullable: true,
      dbField: {
        type: 'TEXT',
        comment: '客户自定义备注信息',
      },
    },
    customTags: {
      type: 'string',
      label: '扩展标签',
      nullable: true,
      dbField: {
        type: 'TEXT',
        comment: '扩展标签，JSON 格式存储',
      },
    },
  },
});

console.log('✅ PurchaseOrder 扩展定义已加载');

