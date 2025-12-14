/**
 * 真实的 UI 组件使用示例
 * 
 * 这个文件展示了如何实际使用 @ai-builder/std-ui 的标准组件
 * 注意：这些组件标签在编译时会被替换为具体的 UI 库（Element Plus 或 Ant Design）
 */

import { definePage, useState, useComputed, onMounted } from '@ai-builder/dsl/ui';
import type { ColumnDefinition } from '@ai-builder/std-ui';
import {
  Page,
  Card,
  Row,
  Col,
  Button,
  Input,
  Table,
  Modal,
  Form,
  FormItem,
  Select,
  DatePicker,
  Descriptions,
  Tag,
  Breadcrumb,
} from '@ai-builder/std-ui';

// 订单数据类型
interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createTime: string;
}

// 订单表单类型
interface OrderForm {
  orderNo: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  orderDate: Date;
}

export default definePage(
  {
    route: '/examples/real-ui',
    title: '真实 UI 组件示例',
  },
  () => {
    // ============================================
    // 状态管理
    // ============================================
    
    const loading = useState(false);
    const orders = useState<Order[]>([]);
    const selectedOrders = useState<Order[]>([]);
    
    // 表单相关
    const dialogVisible = useState(false);
    const form = useState<OrderForm>({
      orderNo: '',
      customerName: '',
      amount: 0,
      status: 'pending',
      orderDate: new Date(),
    });
    
    // 搜索相关
    const searchKeyword = useState('');
    
    // 分页相关
    const currentPage = useState(1);
    const pageSize = useState(10);
    const total = useState(0);
    
    // ============================================
    // 计算属性
    // ============================================
    
    const filteredOrders = useComputed(() => {
      const keyword = searchKeyword.value.toLowerCase();
      if (!keyword) return orders.value;
      
      return orders.value.filter((order: Order) =>
        order.orderNo.toLowerCase().includes(keyword) ||
        order.customerName.toLowerCase().includes(keyword)
      );
    });
    
    const totalAmount = useComputed(() => {
      return selectedOrders.value.reduce((sum: number, order: Order) => sum + order.amount, 0);
    });
    
    // ============================================
    // 数据加载
    // ============================================
    
    const loadOrders = async () => {
      loading.value = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        orders.value = [
          {
            id: '1',
            orderNo: 'ORD-001',
            customerName: '张三',
            amount: 1299.00,
            status: 'completed',
            createTime: '2024-01-15 10:30:00',
          },
          {
            id: '2',
            orderNo: 'ORD-002',
            customerName: '李四',
            amount: 2599.00,
            status: 'processing',
            createTime: '2024-01-15 11:20:00',
          },
          {
            id: '3',
            orderNo: 'ORD-003',
            customerName: '王五',
            amount: 899.00,
            status: 'pending',
            createTime: '2024-01-15 14:10:00',
          },
        ];
        total.value = orders.value.length;
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(() => {
      loadOrders();
    });
    
    // ============================================
    // 事件处理
    // ============================================
    
    const handleCreate = () => {
      form.value = {
        orderNo: '',
        customerName: '',
        amount: 0,
        status: 'pending',
        orderDate: new Date(),
      };
      dialogVisible.value = true;
    };
    
    const handleSubmit = () => {
      // 创建新订单
      orders.value.push({
        id: String(Date.now()),
        orderNo: form.value.orderNo,
        customerName: form.value.customerName,
        amount: form.value.amount,
        status: form.value.status,
        createTime: new Date().toLocaleString(),
      });
      
      dialogVisible.value = false;
    };
    
    const handleSelectionChange = (selection: Order[]) => {
      selectedOrders.value = selection;
    };
    
    const handlePageChange = (page: number) => {
      currentPage.value = page;
    };
    
    // ============================================
    // 表格列定义
    // ============================================
    
    const columns: ColumnDefinition<Order>[] = [
      {
        prop: 'orderNo',
        label: '订单号',
        width: 120,
      },
      {
        prop: 'customerName',
        label: '客户名称',
        width: 150,
      },
      {
        prop: 'amount',
        label: '金额',
        width: 120,
        align: 'right',
        formatter: (row: Order) => `¥${row.amount.toFixed(2)}`,
      },
      {
        prop: 'status',
        label: '状态',
        width: 100,
      },
      {
        prop: 'createTime',
        label: '创建时间',
        width: 180,
      },
    ];
    
    // ============================================
    // 渲染函数 - 使用真实的 UI 组件
    // ============================================
    
    return () => (
      <Page loading={loading.value} title="订单管理">
        
        {/* 搜索区域 - 使用 Card */}
        <Card title="搜索条件" style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input
                value={searchKeyword.value}
                placeholder="请输入订单号或客户名称"
                clearable={true}
                onChange={(val: string) => { searchKeyword.value = val; }}
              />
            </Col>
            <Col span={4}>
              <Button type="primary" onClick={() => console.log('搜索')}>
                搜索
              </Button>
            </Col>
          </Row>
        </Card>
        
        {/* 统计信息 - 使用 Descriptions */}
        <Card title="统计信息" style={{ marginBottom: '16px' }}>
          <Descriptions
            column={3}
            items={[
              { label: '总订单数', content: String(total.value) },
              { label: '已选订单', content: String(selectedOrders.value.length) },
              { label: '选中金额', content: `¥${totalAmount.value.toFixed(2)}` },
            ]}
          />
        </Card>
        
        {/* 订单列表 - 使用 Table */}
        <Card
          title="订单列表"
          extra={
            <Button type="primary" onClick={handleCreate}>
              新建订单
            </Button>
          }
        >
          <Table<Order>
            data={filteredOrders.value}
            columns={columns}
            rowKey="id"
            selection={{
              type: 'checkbox',
              selectedRows: selectedOrders.value,
              onSelectionChange: handleSelectionChange,
            }}
            pagination={{
              current: currentPage.value,
              pageSize: pageSize.value,
              total: total.value,
              onChange: handlePageChange,
            }}
          />
        </Card>
        
        {/* 新建/编辑对话框 - 使用 Modal */}
        <Modal
          visible={dialogVisible.value}
          title="新建订单"
          onOk={handleSubmit}
          onCancel={() => { dialogVisible.value = false; }}
        >
          <Form<OrderForm>
            model={form.value}
            labelWidth="100px"
            rules={{
              orderNo: [{ required: true, message: '请输入订单号' }],
              customerName: [{ required: true, message: '请输入客户名称' }],
              amount: [{ required: true, message: '请输入金额' }],
            }}
          >
            <FormItem label="订单号" prop="orderNo">
              <Input
                value={form.value.orderNo}
                placeholder="请输入订单号"
                onChange={(val: string) => { form.value.orderNo = val; }}
              />
            </FormItem>
            
            <FormItem label="客户名称" prop="customerName">
              <Input
                value={form.value.customerName}
                placeholder="请输入客户名称"
                onChange={(val: string) => { form.value.customerName = val; }}
              />
            </FormItem>
            
            <FormItem label="订单状态" prop="status">
              <Select
                value={form.value.status}
                options={[
                  { label: '待处理', value: 'pending' },
                  { label: '处理中', value: 'processing' },
                  { label: '已完成', value: 'completed' },
                  { label: '已取消', value: 'cancelled' },
                ]}
                onChange={(val: string) => { 
                  form.value.status = val as OrderForm['status']; 
                }}
              />
            </FormItem>
            
            <FormItem label="订单日期" prop="orderDate">
              <DatePicker
                value={form.value.orderDate}
                type="date"
                format="YYYY-MM-DD"
                onChange={(val: Date | string | number | [Date, Date] | null) => { 
                  form.value.orderDate = val as Date; 
                }}
              />
            </FormItem>
            
            <FormItem label="金额" prop="amount">
              <Input
                value={String(form.value.amount)}
                type="number"
                placeholder="请输入金额"
                onChange={(val: string) => { 
                  form.value.amount = Number(val); 
                }}
              />
            </FormItem>
          </Form>
        </Modal>
        
        {/* 状态标签示例 - 使用 Tag */}
        <Card title="状态标签示例" style={{ marginTop: '16px' }}>
          <Tag type="success">已完成</Tag>
          <Tag type="warning">处理中</Tag>
          <Tag type="info">待处理</Tag>
          <Tag type="danger">已取消</Tag>
        </Card>
        
        {/* 面包屑导航示例 - 使用 Breadcrumb */}
        <Card title="导航示例" style={{ marginTop: '16px' }}>
          <Breadcrumb
            items={[
              { label: '首页', path: '/' },
              { label: '订单管理', path: '/orders' },
              { label: '订单列表', active: true },
            ]}
            separator="/"
          />
        </Card>
        
      </Page>
    );
  }
);

