/**
 * 采购订单仓储 - 装饰器版本
 * 
 * 使用内存 Mock 数据，不依赖外部数据库和运行时
 */

import { Repository, Method } from '@ai-builder/jsx-runtime';
import { 
  PurchaseOrderStatus,
  type PurchaseOrder as PurchaseOrderType,
  type PurchaseOrderItem,
  type SupplierInfo,
} from '../models/PurchaseOrder.model';

// 从 defineTypedEnum 获取类型
type PurchaseOrderStatusType = keyof typeof PurchaseOrderStatus.values;

// ==================== Mock 数据存储 ====================

/** 内存订单存储 */
const mockOrders: PurchaseOrderType[] = [];

/** 生成唯一 ID */
function generateId(): string {
  return `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** 生成订单号 */
function generateOrderNo(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(mockOrders.length + 1).padStart(4, '0');
  return `PO${y}${m}${d}${seq}`;
}

// ==================== 基础数据（供应商、物料） ====================

/** 供应商选项数据 */
const supplierData = [
  { code: 'SUP001', name: '上海供应商A', contactPerson: '张三', contactPhone: '13800138001', address: '上海市浦东新区' },
  { code: 'SUP002', name: '北京供应商B', contactPerson: '李四', contactPhone: '13800138002', address: '北京市朝阳区' },
  { code: 'SUP003', name: '广州供应商C', contactPerson: '王五', contactPhone: '13800138003', address: '广州市天河区' },
];

/** 物料选项数据 */
const materialData = [
  { code: 'MAT001', name: '办公电脑', unit: '台', price: 5000, specification: '联想 ThinkPad' },
  { code: 'MAT002', name: '打印机', unit: '台', price: 2000, specification: 'HP LaserJet' },
  { code: 'MAT003', name: '办公桌', unit: '张', price: 800, specification: '1.4m 标准办公桌' },
  { code: 'MAT004', name: '办公椅', unit: '把', price: 500, specification: '人体工学椅' },
  { code: 'MAT005', name: '投影仪', unit: '台', price: 3000, specification: 'EPSON 高清' },
];

/** 初始化 Mock 数据 */
function initMockData() {
  if (mockOrders.length > 0) return;
  
  const suppliers = supplierData;
  
  const materials = materialData;
  
  const statuses: PurchaseOrderStatusType[] = [
    PurchaseOrderStatus.DRAFT,
    PurchaseOrderStatus.PENDING,
    PurchaseOrderStatus.APPROVED,
    PurchaseOrderStatus.IN_PROGRESS,
    PurchaseOrderStatus.COMPLETED,
  ];
  
  // 生成 5 条 mock 订单
  for (let i = 0; i < 5; i++) {
    const supplier = suppliers[i % suppliers.length];
    const status = statuses[i % statuses.length];
    const itemCount = 2 + (i % 3);
    
    const items: PurchaseOrderItem[] = [];
    let total = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const mat = materials[(i + j) % materials.length];
      const qty = 1 + (j % 5);
      const price = mat.price;
      const amount = qty * price;
      total += amount;
      
      items.push({
        id: `item_${i}_${j}`,
        materialCode: mat.code,
        materialName: mat.name,
        unit: mat.unit,
        quantity: qty,
        unitPrice: price,
        requiredDate: new Date(Date.now() + (7 + j) * 24 * 60 * 60 * 1000),
      });
    }
    
    const createdAt = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    
    mockOrders.push({
      id: generateId(),
      orderNo: generateOrderNo(),
      title: `采购订单-${supplier.name}-${i + 1}`,
      supplier,
      items,
      totalAmount: total,
      status,
      createdBy: 'admin',
      createdAt,
      remark: `这是第 ${i + 1} 条测试订单`,
    });
  }
  
  console.log('[Repository] Mock 数据初始化完成，共', mockOrders.length, '条订单');
}

// 初始化数据
initMockData();

// ==================== Repository 装饰器版本 ====================

/**
 * 采购订单 Repository
 * 
 * 提供数据访问接口，操作内存 Mock 数据
 */
@Repository({ 
  description: '采购订单数据访问',
  entity: 'PurchaseOrder',
  table: 'purchase_orders',
})
export class PurchaseOrderRepository {
  
  /**
   * 创建订单
   */
  @Method({ description: '创建订单', command: true })
  static async create(data: {
    title: string;
    supplier: SupplierInfo;
    items: Omit<PurchaseOrderItem, 'id'>[];
    remark?: string;
    createdBy: string;
  }): Promise<string> {
    const id = generateId();
    const orderNo = generateOrderNo();
    
    // 计算总金额
    let totalAmount = 0;
    const items: PurchaseOrderItem[] = data.items.map((item, index) => {
      const amount = item.quantity * item.unitPrice;
      totalAmount += amount;
      return {
        ...item,
        id: `${id}_item_${index}`,
      };
    });
    
    const order: PurchaseOrderType = {
      id,
      orderNo,
      title: data.title,
      supplier: data.supplier,
      items,
      totalAmount,
      status: 'DRAFT',
      createdBy: data.createdBy,
      createdAt: new Date(),
      remark: data.remark,
    };
    
    mockOrders.unshift(order);
    console.log('[Repository] 创建订单:', id);
    
    return id;
  }
  
  /**
   * 根据 ID 查询
   */
  @Method({ description: '根据ID查询', query: true })
  static async findById(id: string): Promise<PurchaseOrderType | null> {
    return mockOrders.find(o => o.id === id) || null;
  }
  
  /**
   * 查询列表
   */
  @Method({ description: '查询列表', query: true })
  static async findList(params: {
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ data: PurchaseOrderType[]; total: number }> {
    let orders = [...mockOrders];
    
    // 状态过滤
    if (params.status) {
      orders = orders.filter(o => o.status === params.status);
    }
    
    const total = orders.length;
    
    // 分页
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const data = orders.slice(offset, offset + limit);
    
    return { data, total };
  }
  
  /**
   * 更新订单
   */
  @Method({ description: '更新订单', command: true })
  static async update(id: string, data: Partial<PurchaseOrderType>): Promise<boolean> {
    const index = mockOrders.findIndex(o => o.id === id);
    if (index === -1) return false;
    
    mockOrders[index] = {
      ...mockOrders[index],
      ...data,
      updatedAt: new Date(),
    };
    
    console.log('[Repository] 更新订单:', id);
    return true;
  }
  
  /**
   * 更新状态
   */
  @Method({ description: '更新订单状态', command: true })
  static async updateStatus(id: string, status: string): Promise<boolean> {
    const order = mockOrders.find(o => o.id === id);
    if (!order) return false;
    
    order.status = status as PurchaseOrderStatusType;
    order.updatedAt = new Date();
    
    console.log('[Repository] 更新订单状态:', id, '->', status);
    return true;
  }
  
  /**
   * 删除订单
   */
  @Method({ description: '删除订单', command: true })
  static async delete(id: string): Promise<boolean> {
    const index = mockOrders.findIndex(o => o.id === id);
    if (index === -1) return false;
    
    mockOrders.splice(index, 1);
    console.log('[Repository] 删除订单:', id);
    return true;
  }
  
  /**
   * 获取供应商选项列表
   */
  @Method({ description: '获取供应商选项', query: true })
  static async getSupplierOptions(): Promise<SupplierInfo[]> {
    return supplierData.map(s => ({
      code: s.code,
      name: s.name,
      contactPerson: s.contactPerson,
      contactPhone: s.contactPhone,
      address: s.address,
    }));
  }
  
  /**
   * 获取物料选项列表
   */
  @Method({ description: '获取物料选项', query: true })
  static async getMaterialOptions(): Promise<Array<{
    materialCode: string;
    materialName: string;
    unit: string;
    latestPrice: number;
    specification?: string;
  }>> {
    return materialData.map(m => ({
      materialCode: m.code,
      materialName: m.name,
      unit: m.unit,
      latestPrice: m.price,
      specification: m.specification,
    }));
  }
}

