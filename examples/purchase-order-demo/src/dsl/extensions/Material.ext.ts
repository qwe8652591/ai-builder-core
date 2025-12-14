/**
 * 物料扩展
 * 
 * 🎯 使用 defineExtension 统一定义扩展（带类型安全检查）
 *    - 自动挂载方法到 prototype
 *    - 自动注册到 Metadata Store
 *    - 方法名拼写错误会被 TypeScript 检测到
 * 
 * @example
 * ```typescript
 * const material = new Material();
 * material.isActive();           // 扩展方法
 * material.getFormattedPrice();  // 扩展方法
 * material.getFullName();        // 扩展方法
 * ```
 */

import { defineExtension } from '@ai-builder/jsx-runtime';
import { Material } from '../models/Material.model';

// ==================== 1. 定义扩展方法接口 ====================

interface MaterialExtensionMethods {
  /** 检查物料是否激活 */
  isActive?(): boolean;
  /** 获取格式化的标准单价 */
  getFormattedPrice?(): string;
  /** 获取格式化的最新单价 */
  getFormattedLatestPrice?(): string;
  /** 获取完整名称（含规格） */
  getFullName?(): string;
  /** 获取简短描述 */
  getShortDescription?(): string;
  /** 获取价格变化百分比 */
  getPriceChangePercent?(): number | null;
  /** 获取格式化的价格变化 */
  getFormattedPriceChange?(): string;
}

// ==================== 2. 类型声明扩展（IDE 支持） ====================

declare module '../models/Material.model' {
  interface Material extends MaterialExtensionMethods {}
}

// ==================== 3. 定义扩展（带类型安全检查） ====================

defineExtension<typeof Material, MaterialExtensionMethods>({
  name: 'MaterialExtension',
  description: '物料扩展方法',
  target: Material,
  methods: {
    isActive: {
      description: '检查物料是否激活',
      returnType: 'boolean',
      implementation(this: Material) {
        return this.status === 'ACTIVE';
      },
    },
    
    getFormattedPrice: {
      description: '获取格式化的标准单价',
      returnType: 'string',
      implementation(this: Material) {
        if (this.price == null) {
          return '暂无报价';
        }
        return `¥${this.price.toLocaleString('zh-CN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      },
    },
    
    getFormattedLatestPrice: {
      description: '获取格式化的最新单价',
      returnType: 'string',
      implementation(this: Material) {
        if (this.latestPrice == null) {
          return '暂无报价';
        }
        return `¥${this.latestPrice.toLocaleString('zh-CN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      },
    },
    
    getFullName: {
      description: '获取完整名称（含规格）',
      returnType: 'string',
      implementation(this: Material) {
        if (this.specification) {
          return `${this.name} (${this.specification})`;
        }
        return this.name;
      },
    },
    
    getShortDescription: {
      description: '获取简短描述',
      returnType: 'string',
      implementation(this: Material) {
        return `${this.name} [${this.code}]`;
      },
    },
    
    getPriceChangePercent: {
      description: '获取价格变化百分比',
      returnType: 'number | null',
      implementation(this: Material) {
        if (this.price == null || this.latestPrice == null || this.price === 0) {
          return null;
        }
        return ((this.latestPrice - this.price) / this.price) * 100;
      },
    },
    
    getFormattedPriceChange: {
      description: '获取格式化的价格变化',
      returnType: 'string',
      implementation(this: Material) {
        const percent = this.getPriceChangePercent?.();
        if (percent == null) {
          return '-';
        }
        const sign = percent >= 0 ? '+' : '';
        return `${sign}${percent.toFixed(2)}%`;
      },
    },
  },
});
