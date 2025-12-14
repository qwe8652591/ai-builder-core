/**
 * 采购订单列表页面 - 纯 DSL 版本
 * 
 * 使用自定义 JSX 运行时，不依赖 React
 * JSX 编译为 VNode 而不是 React.createElement
 */

import { 
  definePage, 
  useState, 
  useEffect, 
  useComputed,
} from '@ai-builder/jsx-runtime';

// 路由
import { Routes, useNavigate } from '../routes';

import { 
  Page, 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
  Select
} from '@ai-builder/std-ui';

// 使用 DSL 定义的服务和类型
import { PurchaseOrderAppService } from '../services/PurchaseOrder.appservice';
import { type PurchaseOrderListItemDTO } from '../dto/PurchaseOrder.dto';
import { PurchaseOrderStatus } from '../models/PurchaseOrder.model';

// 导入自定义组件
import { StatusTag } from '../components/StatusTag.component';
import { OrderCard } from '../components/OrderCard.component';

/**
 * 订单列表页面
 */
export default definePage({
  title: '采购订单列表',
  route: '/orders',
  permission: 'purchase:order:list',
  menu: {
    parent: 'PurchaseManagement',
    order: 10,
    icon: 'OrderedListOutlined',
  },
}, () => {
  // 路由
  const navigate = useNavigate();
  
  // 状态定义
  const [orders, setOrders] = useState<PurchaseOrderListItemDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(20);
  
  // 查询条件
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  // 状态选项（使用 defineTypedEnum 提供的 getOptions 方法）
  const statusOptions = useComputed(() => {
    return PurchaseOrderStatus.getOptions();
  }, []);

  // 表格列定义
  const columns = useComputed(() => [
    { prop: 'orderNo' as const, label: '订单编号', width: 150 },
    { prop: 'title' as const, label: '订单标题', width: 200 },
    { prop: 'supplierName' as const, label: '供应商', width: 150 },
    { 
      prop: 'totalAmount' as const, 
      label: '金额', 
      width: 120,
      align: 'right' as const,
      formatter: (value: unknown) => value ? `¥${Number(value).toFixed(2)}` : '-',
    },
    { 
      prop: 'statusLabel' as const, 
      label: '状态', 
      width: 100,
    },
    { 
      prop: 'createdAt' as const, 
      label: '创建时间', 
      width: 180,
      formatter: (value: unknown) => value ? new Date(value as string).toLocaleString('zh-CN') : '-',
    },
    { 
      prop: 'id' as const, 
      label: '操作', 
      width: 180,
      formatter: (_: unknown, record: PurchaseOrderListItemDTO) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleView(record.id)}>查看</Button>
          <Button type="link" size="small" onClick={() => handleEdit(record.id)}>编辑</Button>
          <Button type="link" size="small" onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ], []);

  // 加载数据
  const loadData = async () => {
    console.log('[OrderList] Loading data...');
    setLoading(true);
    
    try {
      const result = await PurchaseOrderAppService.getPurchaseOrderList({
        status: selectedStatus,
        pageNo,
        pageSize,
      });
      
      if (result.success && result.data) {
        console.log('[OrderList] Data loaded:', result.data.list.length, 'orders');
        setOrders(result.data.list);
        setTotal(result.data.total);
      } else {
        console.error('[OrderList] Load failed:', result.message);
        setOrders([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('[OrderList] Load error:', error);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 生命周期：组件挂载时加载数据
  useEffect(() => {
    console.log('[OrderList] Component mounted');
    loadData();
  }, []);

  // 事件处理
  const handleSearch = () => {
    console.log('[OrderList] Search:', searchText, selectedStatus);
    setPageNo(1);
    loadData();
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedStatus(undefined);
    setPageNo(1);
    loadData();
  };

  const handleCreate = () => {
    console.log('[OrderList] Create new order');
    navigate(Routes.OrderCreate);
  };

  const handleView = (id: string) => {
    console.log('[OrderList] View order:', id);
    navigate(Routes.OrderDetail(id));
  };

  const handleEdit = (id: string) => {
    console.log('[OrderList] Edit order:', id);
    navigate(Routes.OrderDetail(id, { mode: 'edit' }));
  };

  const handleDelete = async (id: string) => {
    console.log('[OrderList] Delete order:', id);
    try {
      const result = await PurchaseOrderAppService.deletePurchaseOrder({ id });
      if (result.success) {
        console.log('[OrderList] Delete success');
        loadData();
      } else {
        console.error('[OrderList] Delete failed:', result.message);
        alert(result.message);
      }
    } catch (error) {
      console.error('[OrderList] Delete error:', error);
    }
  };

  // 返回 JSX
  return (
    <Page title="采购订单列表">
      <Card>
        {/* 查询区域 */}
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="订单编号/标题"
              value={searchText}
              onChange={setSearchText}
              style={{ width: 200 }}
            />
            <Select
              placeholder="订单状态"
              value={selectedStatus}
              options={statusOptions}
              onChange={(v) => setSelectedStatus(v as string)}
              clearable
              style={{ width: 150 }}
            />
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Space>

        {/* 操作栏 */}
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleCreate}>
            新建订单
          </Button>
        </Space>

        {/* 表格 */}
        <Table
          data={orders as unknown as Record<string, unknown>[]}
          columns={columns as unknown as { prop: string; label: string; width?: number }[]}
          loading={loading}
          rowKey="id"
        />
        
        {/* 统计信息 */}
        <Space style={{ marginTop: 16, color: '#666' }}>
          共 {total} 条记录
          {selectedStatus && (
            <span>
              当前筛选状态：
              <StatusTag 
                status={selectedStatus} 
                label={PurchaseOrderStatus.getLabel(selectedStatus) || selectedStatus} 
              />
            </span>
          )}
        </Space>
      </Card>
      
      {/* 卡片视图演示 */}
      <Card title="📦 卡片视图（使用自定义组件）" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {orders.slice(0, 3).map(order => (
            <OrderCard 
              key={order.id}
              order={order} 
              onClick={(id) => handleView(id)}
            />
          ))}
        </Space>
        
        <Space style={{ marginTop: 16 }}>
          <Button type="link">查看更多...</Button>
        </Space>
      </Card>
    </Page>
  );
});
