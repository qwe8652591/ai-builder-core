/**
 * 供应商扩展
 * 
 * 🎯 使用 defineExtension 统一定义扩展（带类型安全检查）
 *    - 自动挂载方法到 prototype
 *    - 自动注册到 Metadata Store
 *    - 方法名拼写错误会被 TypeScript 检测到
 * 
 * @example
 * ```typescript
 * const supplier = new Supplier();
 * supplier.isActive();         // 扩展方法
 * supplier.getContactInfo();   // 扩展方法
 * supplier.getFullAddress();   // 扩展方法
 * ```
 */

import { defineExtension } from '@qwe8652591/dsl-core';
import { Supplier } from '../models/Supplier.model';

// ==================== 1. 定义扩展方法接口 ====================
// 🎯 这个接口同时用于：
//    - declare module 类型扩展
//    - defineExtension 方法名检查

interface SupplierExtensionMethods {
  /** 检查供应商是否激活 */
  isActive?(): boolean;
  /** 获取完整的联系信息 */
  getContactInfo?(): string;
  /** 获取完整地址 */
  getFullAddress?(): string;
  /** 获取简短描述 */
  getShortDescription?(): string;
  /** 获取显示名称（用于下拉框等） */
  getDisplayName?(): string;
  /** 检查联系信息是否完整 */
  hasCompleteContactInfo?(): boolean;
}

// ==================== 2. 类型声明扩展（IDE 支持） ====================

declare module '../models/Supplier.model' {
  interface Supplier extends SupplierExtensionMethods {}
}

// ==================== 3. 定义扩展（带类型安全检查） ====================
// 🎯 传入 SupplierExtensionMethods 作为第二个泛型参数
//    如果 methods 中有拼写错误，TypeScript 会报错

defineExtension<typeof Supplier, SupplierExtensionMethods>({
  name: 'SupplierExtension',
  description: '供应商扩展方法',
  target: Supplier,
  methods: {
    isActive: {
      description: '检查供应商是否激活',
      returnType: 'boolean',
      implementation(this: Supplier) {
        return this.status === 'ACTIVE';
      },
    },
    
    getContactInfo: {
      description: '获取完整的联系信息',
      returnType: 'string',
      implementation(this: Supplier) {
        const parts: string[] = [];
        if (this.contactPerson) {
          parts.push(`联系人: ${this.contactPerson}`);
        }
        if (this.contactPhone) {
          parts.push(`电话: ${this.contactPhone}`);
        }
        return parts.join(' | ') || '暂无联系信息';
      },
    },
    
    getFullAddress: {
      description: '获取完整地址',
      returnType: 'string',
      implementation(this: Supplier) {
        return this.address || '暂无地址信息';
      },
    },
    
    getShortDescription: {
      description: '获取简短描述',
      returnType: 'string',
      implementation(this: Supplier) {
        return `${this.name} [${this.code}]`;
      },
    },
    
    getDisplayName: {
      description: '获取显示名称',
      returnType: 'string',
      implementation(this: Supplier) {
        return `${this.code} - ${this.name}`;
      },
    },
    
    hasCompleteContactInfo: {
      description: '检查联系信息是否完整',
      returnType: 'boolean',
      implementation(this: Supplier) {
        return !!(this.contactPerson && this.contactPhone && this.address);
      },
    },
  },
});
