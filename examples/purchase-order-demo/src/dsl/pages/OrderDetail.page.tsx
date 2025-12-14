/**
 * 订单详情页面 - 纯 DSL 版本
 * 
 * 支持三种模式：
 * - create: 新建订单 (/orders/create)
 * - edit: 编辑订单 (/orders/:id/edit)
 * - view: 查看订单 (/orders/:id)
 */

import { 
  definePage, 
  useState, 
  useEffect,
  useComputed,
  useParams,
  useQuery,
} from '@ai-builder/jsx-runtime';

// 路由（类型安全）
import { Routes, useNavigate } from '../routes';

import { 
  Page, 
  Card, 
  Button, 
  Space, 
  Tag,
  Table,
  Input,
  Select,
} from '@ai-builder/std-ui';

// 使用 DSL 定义的服务和类型
// ✅ View 层只从 AppService 和 DTO 层导入，不直接访问 Model 层
import { PurchaseOrderAppService } from '../services/PurchaseOrder.appservice';
import type { 
  PurchaseOrderDetailDTO,
  PurchaseOrderItemDTO,
  SupplierInfoDTO,
  SupplierOptionDTO,
} from '../dto/PurchaseOrder.dto';

// 页面模式类型
type PageMode = 'create' | 'edit' | 'view';

// 表单数据类型
interface OrderFormData {
  title: string;
  supplier: SupplierInfoDTO;
  items: PurchaseOrderItemDTO[];
  remark?: string;
}

// 空的供应商信息
const emptySupplier: SupplierInfoDTO = {
  code: '',
  name: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
};

// 空的订单明细
const emptyItem: PurchaseOrderItemDTO = {
  id: '',
  materialCode: '',
  materialName: '',
  specification: '',
  quantity: 1,
  unit: '个',
  unitPrice: 0,
  remark: '',
};

// 选项数据类型（用于 Select 组件）
interface SupplierSelectOption {
  label: string;
  value: string;
  data: SupplierOptionDTO;
}

interface MaterialSelectOption {
  label: string;
  value: string;
  price: number;
  unit: string;
}

/**
 * 订单详情/编辑/新建页面
 */
export default definePage({
  title: '订单详情',
  route: '/orders/:id',
  permission: 'purchase:order:view',
}, () => {
  // ==================== 状态定义 ====================
  
  const [order, setOrder] = useState<PurchaseOrderDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<PageMode>('view');
  
  // 表单数据
  const [formData, setFormData] = useState<OrderFormData>({
    title: '',
    supplier: { ...emptySupplier },
    items: [],
    remark: '',
  });
  
  // 选项数据（从 Repository 获取）
  const [supplierOptions, setSupplierOptions] = useState<SupplierSelectOption[]>([]);
  const [materialOptions, setMaterialOptions] = useState<MaterialSelectOption[]>([]);
  
  // ==================== 路由 Hooks ====================
  
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { mode: modeParam } = useQuery<{ mode?: string }>();
  
  // 解析 URL 获取模式和 ID
  const parseUrl = () => {
    // /orders/create -> 新建模式
    if (id === 'create') {
      return { mode: 'create' as PageMode, id: null };
    }
    
    // /orders/:id?mode=edit -> 编辑模式
    if (id) {
      if (modeParam === 'edit') {
        return { mode: 'edit' as PageMode, id };
      }
      return { mode: 'view' as PageMode, id };
    }
    
    return { mode: 'view' as PageMode, id: null };
  };
  
  // ==================== 计算属性 ====================
  
  // 页面标题
  const pageTitle = useComputed(() => {
    switch (mode) {
      case 'create': return '新建采购订单';
      case 'edit': return `编辑订单 - ${order?.orderNo || ''}`;
      case 'view': return `订单详情 - ${order?.orderNo || ''}`;
    }
  }, [mode, order?.orderNo]);
  
  // 是否为编辑模式（新建或编辑）
  const isEditing = useComputed(() => mode === 'create' || mode === 'edit', [mode]);
  
  // 计算订单总金额
  const totalAmount = useComputed(() => {
    return formData.items.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);
  }, [formData.items]);
  
  // ==================== 数据加载 ====================
  
  // 加载选项数据（供应商、物料）
  const loadOptions = async () => {
    try {
      // 并行加载供应商和物料选项
      const [supplierResult, materialResult] = await Promise.all([
        PurchaseOrderAppService.getSupplierOptions(),
        PurchaseOrderAppService.getMaterialOptions(),
      ]);
      
      if (supplierResult.success && supplierResult.data) {
        setSupplierOptions(supplierResult.data.map(s => ({
          label: s.name,
          value: s.code,
          data: s,
        })));
      }
      
      if (materialResult.success && materialResult.data) {
        setMaterialOptions(materialResult.data.map(m => ({
          label: m.materialName || '',
          value: m.materialCode,
          price: m.latestPrice || 0,
          unit: m.unit || '',
        })));
      }
    } catch (error) {
      console.error('加载选项数据失败:', error);
    }
  };
  
  const loadOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const result = await PurchaseOrderAppService.getPurchaseOrderDetail({ id: orderId });
      if (result.success && result.data) {
        setOrder(result.data);
        // 同步到表单数据
        setFormData({
          title: result.data.title,
          supplier: result.data.supplier,
          items: result.data.items,
          remark: result.data.remark || '',
        });
      } else {
        console.error('加载订单失败:', result.message);
        setOrder(null);
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化
  useEffect(() => {
    const { mode: urlMode, id } = parseUrl();
    console.log('[OrderDetail] 解析 URL:', urlMode, id);
    setMode(urlMode);
    
    // 加载选项数据（供应商、物料）
    loadOptions();
    
    if (urlMode === 'create') {
      // 新建模式：初始化空表单
      setFormData({
        title: '',
        supplier: { ...emptySupplier },
        items: [{ ...emptyItem, id: `new_${Date.now()}` }],
        remark: '',
      });
      setOrder(null);
    } else if (id) {
      // 查看/编辑模式：加载订单数据
      loadOrder(id);
    }
  }, []);
  
  // ==================== 事件处理 ====================
  
  // 返回列表
  const handleBack = () => {
    navigate(Routes.OrderList);
  };
  
  // 切换到编辑模式
  const handleEdit = () => {
    if (order) {
      navigate(Routes.OrderDetail(order.id, { mode: 'edit' }));
      setMode('edit');
    }
  };
  
  // 保存订单
  const handleSave = async () => {
    // 验证
    if (!formData.title.trim()) {
      alert('请输入订单标题');
      return;
    }
    if (!formData.supplier.code) {
      alert('请选择供应商');
      return;
    }
    if (formData.items.length === 0 || formData.items.every(item => !item.materialCode)) {
      alert('请添加订单明细');
      return;
    }
    
    setSaving(true);
    try {
      if (mode === 'create') {
        // 创建订单
        const result = await PurchaseOrderAppService.createPurchaseOrder({
          title: formData.title,
          supplier: formData.supplier,
          items: formData.items.filter(item => item.materialCode),
          remark: formData.remark,
          createdBy: 'admin',
        });
        
        if (result.success) {
          alert('创建成功！');
          handleBack();
        } else {
          alert(result.message || '创建失败');
        }
      } else if (mode === 'edit' && order) {
        // 更新订单
        const result = await PurchaseOrderAppService.updatePurchaseOrder({
          id: order.id,
          title: formData.title,
          supplier: formData.supplier,
          items: formData.items.filter(item => item.materialCode),
          remark: formData.remark,
        });
        
        if (result.success) {
          alert('保存成功！');
          // 切换回查看模式
          navigate(Routes.OrderDetail(order.id));
          setMode('view');
          loadOrder(order.id);
        } else {
          alert(result.message || '保存失败');
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };
  
  // 取消编辑
  const handleCancel = () => {
    if (mode === 'create') {
      handleBack();
    } else if (order) {
      // 恢复原数据
      setFormData({
        title: order.title,
        supplier: order.supplier,
        items: order.items,
        remark: order.remark || '',
      });
      navigate(Routes.OrderDetail(order.id));
      setMode('view');
    }
  };
  
  // 供应商选择
  const handleSupplierChange = (value: unknown) => {
    const selected = supplierOptions.find(s => s.value === value);
    if (selected) {
      setFormData({
        ...formData,
        supplier: selected.data as SupplierInfoDTO,
      });
    }
  };
  
  // 添加明细行
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...emptyItem, id: `new_${Date.now()}` }],
    });
  };
  
  // 删除明细行
  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };
  
  // 更新明细行
  const updateItem = (index: number, field: keyof PurchaseOrderItemDTO, value: unknown) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // 如果选择了物料，自动填充价格和单位
    if (field === 'materialCode') {
      const material = materialOptions.find(m => m.value === value);
      if (material) {
        newItems[index].materialName = material.label;
        newItems[index].unitPrice = material.price;
        newItems[index].unit = material.unit;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };
  
  // ==================== 列定义 ====================
  
  // 查看模式的明细列
  const viewColumns = [
    { prop: 'materialCode', label: '物料编码', width: 120 },
    { prop: 'materialName', label: '物料名称', width: 200 },
    { prop: 'quantity', label: '数量', width: 80, formatter: (v: unknown) => String(v) },
    { prop: 'unit', label: '单位', width: 60 },
    { prop: 'unitPrice', label: '单价', width: 100, formatter: (v: unknown) => `¥${Number(v).toFixed(2)}` },
    { prop: 'unitPrice', label: '金额', width: 120, formatter: (_: unknown, record: Record<string, unknown>) => `¥${(Number(record.quantity) * Number(record.unitPrice)).toFixed(2)}` },
  ];
  
  // 编辑模式的明细列
  const editColumns = [
    { 
      prop: 'materialCode', 
      label: '物料', 
      width: 180,
      formatter: (_: unknown, record: Record<string, unknown>, index: number) => (
        <Select
          value={record.materialCode as string}
          options={materialOptions}
          onChange={(v: unknown) => updateItem(index, 'materialCode', v)}
          placeholder="选择物料"
          style={{ width: '100%' }}
        />
      ),
    },
    { 
      prop: 'quantity', 
      label: '数量', 
      width: 100,
      formatter: (_: unknown, record: Record<string, unknown>, index: number) => (
        <Input
          value={String(record.quantity)}
          onChange={(v: unknown) => updateItem(index, 'quantity', Number(v) || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    { 
      prop: 'unit', 
      label: '单位', 
      width: 80,
      formatter: (_: unknown, record: Record<string, unknown>) => (record.unit as string) || '-',
    },
    { 
      prop: 'unitPrice', 
      label: '单价', 
      width: 120,
      formatter: (_: unknown, record: Record<string, unknown>, index: number) => (
        <Input
          value={String(record.unitPrice)}
          onChange={(v: unknown) => updateItem(index, 'unitPrice', Number(v) || 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    { 
      prop: 'unitPrice', 
      label: '金额', 
      width: 100,
      formatter: (_: unknown, record: Record<string, unknown>) => `¥${(Number(record.quantity) * Number(record.unitPrice)).toFixed(2)}`,
    },
    { 
      prop: 'id', 
      label: '操作', 
      width: 80,
      formatter: (_: unknown, __: Record<string, unknown>, index: number) => (
        <Button type="link" size="small" onClick={() => handleRemoveItem(index)}>删除</Button>
      ),
    },
  ];
  
  // ==================== 渲染 ====================
  
  // 加载中
  if (loading) {
    return <Page title="加载中..."><Card>正在加载...</Card></Page>;
  }
  
  // 查看/编辑模式但订单不存在
  if ((mode === 'view' || mode === 'edit') && !order) {
    return (
      <Page title="未找到订单">
        <Card>
          <p>订单不存在或已被删除</p>
          <Button onClick={handleBack}>返回列表</Button>
        </Card>
      </Page>
    );
  }
  
  return (
    <Page title={pageTitle}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 操作栏 */}
        <Card>
          <Space>
            <Button onClick={handleBack}>返回列表</Button>
            {mode === 'view' && order?.canEdit && (
              <Button type="primary" onClick={handleEdit}>编辑</Button>
            )}
            {isEditing && (
              <Space>
                <Button type="primary" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </Button>
                <Button onClick={handleCancel}>取消</Button>
              </Space>
            )}
            {mode === 'view' && order?.canApprove && <Button>审批</Button>}
          </Space>
        </Card>
        
        {/* 基本信息 */}
        <Card title="基本信息">
          {isEditing ? (
            // 编辑模式：表单
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 80 }}>订单标题：</span>
                <Input
                  value={formData.title}
                  onChange={(v) => setFormData({ ...formData, title: v as string })}
                  placeholder="请输入订单标题"
                  style={{ width: 300 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 80 }}>供应商：</span>
                <Select
                  value={formData.supplier.code}
                  options={supplierOptions}
                  onChange={handleSupplierChange}
                  placeholder="请选择供应商"
                  style={{ width: 300 }}
                />
              </div>
              {formData.supplier.code && (
                <div style={{ marginLeft: 96, color: '#666' }}>
                  联系人：{formData.supplier.contactPerson} | 电话：{formData.supplier.contactPhone}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span style={{ width: 80 }}>备注：</span>
                <Input
                  value={formData.remark}
                  onChange={(v) => setFormData({ ...formData, remark: v as string })}
                  placeholder="请输入备注（可选）"
                  style={{ width: 300 }}
                />
              </div>
              {mode === 'edit' && order && (
                <Space direction="vertical">
                  <div><strong>订单编号：</strong>{order.orderNo}</div>
                  <div>
                    <strong>状态：</strong>
                    <Tag>{order.statusLabel}</Tag>
                  </div>
                </Space>
              )}
            </Space>
          ) : (
            // 查看模式：只读显示
            <Space direction="vertical">
              <div><strong>订单编号：</strong>{order?.orderNo}</div>
              <div><strong>订单标题：</strong>{order?.title}</div>
              <div><strong>供应商：</strong>{order?.supplier.name}</div>
              <div><strong>联系人：</strong>{order?.supplier.contactPerson} | 电话：{order?.supplier.contactPhone}</div>
              <div><strong>总金额：</strong>¥{Number(order?.totalAmount).toFixed(2)}</div>
              <div>
                <strong>状态：</strong>
                <Tag>{order?.statusLabel}</Tag>
              </div>
              <div><strong>创建人：</strong>{order?.createdBy}</div>
              <div><strong>创建时间：</strong>{order?.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : '-'}</div>
              {order?.remark && <div><strong>备注：</strong>{order.remark}</div>}
            </Space>
          )}
        </Card>
        
        {/* 明细列表 */}
        <Card title={isEditing ? '订单明细（可编辑）' : '订单明细'}>
          {isEditing && (
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleAddItem}>添加明细</Button>
            </div>
          )}
          
          <Table
            data={(isEditing ? formData.items : order?.items || []) as unknown as Record<string, unknown>[]}
            columns={isEditing ? editColumns : viewColumns}
            rowKey="id"
          />
          
          {/* 合计 */}
          <div style={{ marginTop: 16, textAlign: 'right', fontSize: 16 }}>
            <strong>合计金额：</strong>
            <span style={{ color: '#f5222d', fontSize: 18 }}>
              ¥{(isEditing ? totalAmount : (order?.totalAmount || 0)).toFixed(2)}
            </span>
          </div>
        </Card>
      </Space>
    </Page>
  );
});
