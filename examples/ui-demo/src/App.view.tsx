/**
 * AI Builder UI Demo - 展示所有标准 UI 组件
 * 使用 DSL 标准协议进行开发
 */

// 1. 导入响应式原语（来自 @ai-builder/dsl/ui）
import { useState } from '@ai-builder/dsl/ui';

// 2. 导入标准 UI 组件协议（来自 @ai-builder/std-ui）
import {
  Page,
  Card,
  Button,
  Table,
  Form,
  FormItem,
  Input,
  Select,
  DatePicker,
  Modal,
  Tag,
  Row,
  Col,
  Descriptions,
  Message,
} from '@ai-builder/std-ui';

// 3. 导入辅助组件（Ant Design 特有，未来会抽象到标准协议）
import { Space } from '@ai-builder/std-ui';

interface Order extends Record<string, unknown> {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export default function App() {
  // 响应式状态
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Order[]>([]);

  // 模拟订单数据
  const orders: Order[] = [
    {
      id: '1',
      orderNo: 'ORD-20240101-0001',
      customerName: '张三',
      amount: 1580.00,
      status: 'completed',
      createdAt: '2024-01-01 10:00:00',
    },
    {
      id: '2',
      orderNo: 'ORD-20240101-0002',
      customerName: '李四',
      amount: 2340.50,
      status: 'processing',
      createdAt: '2024-01-01 11:30:00',
    },
    {
      id: '3',
      orderNo: 'ORD-20240101-0003',
      customerName: '王五',
      amount: 980.00,
      status: 'pending',
      createdAt: '2024-01-01 14:20:00',
    },
  ];

  // 表格列定义
  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo' as keyof Order,
      key: 'orderNo',
      width: 180,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName' as keyof Order,
      key: 'customerName',
      width: 120,
    },
    {
      title: '订单金额',
      dataIndex: 'amount' as keyof Order,
      key: 'amount',
      width: 120,
      formatter: (value: unknown) => `¥${(value as number).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status' as keyof Order,
      key: 'status',
      width: 100,
      formatter: (value: unknown) => {
        const statusMap = {
          pending: { color: 'orange', text: '待处理' },
          processing: { color: 'blue', text: '处理中' },
          completed: { color: 'green', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const status = statusMap[value as keyof typeof statusMap];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt' as keyof Order,
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      formatter: (_: unknown, record: Order) => (
        <Space size="small">
          <Button type="link" onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  // 处理函数
  const handleView = (record: Order) => {
    Message.info(`查看订单：${record.orderNo}`);
  };

  const handleEdit = (record: Order) => {
    Message.info(`编辑订单：${record.orderNo}`);
  };

  const handleSelectionChange = (keys: string[], rows: Order[]) => {
    setSelectedRows(rows);
    Message.success(`已选择 ${keys.length} 条订单`);
  };

  const handleSubmit = (values: unknown) => {
    console.log('表单提交:', values);
    Message.success('表单提交成功！');
  };

  return (
    <Page title="AI Builder UI 组件演示">
      {/* 基础按钮和计数器 */}
      <Card title="1. 响应式状态 & 按钮组件" style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" onClick={() => setCount(count + 1)}>
            点击次数: {count}
          </Button>
          <Button onClick={() => setCount(0)}>重置</Button>
          <Button type="dashed" onClick={() => setVisible(true)}>
            打开对话框
          </Button>
        </Space>
      </Card>

      {/* 栅格布局 */}
      <Card title="2. 栅格布局" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card shadow="hover">
              <h4>列 1</h4>
              <p>响应式栅格系统</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card shadow="hover">
              <h4>列 2</h4>
              <p>24 栅格布局</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card shadow="hover">
              <h4>列 3</h4>
              <p>灵活间距控制</p>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 表单组件 */}
      <Card title="3. 表单组件" style={{ marginBottom: 24 }}>
        <Form onSubmit={handleSubmit} labelWidth={100}>
          <FormItem label="客户姓名" name="customerName">
            <Input placeholder="请输入客户姓名" />
          </FormItem>
          <FormItem label="订单类型" name="orderType">
            <Select
              placeholder="请选择订单类型"
              options={[
                { label: '普通订单', value: 'normal' },
                { label: '紧急订单', value: 'urgent' },
                { label: '预约订单', value: 'reserved' },
              ]}
            />
          </FormItem>
          <FormItem label="交货日期" name="deliveryDate">
            <DatePicker placeholder="请选择交货日期" />
          </FormItem>
          <FormItem label="备注" name="remark">
            <Input type="textarea" placeholder="请输入备注信息" />
          </FormItem>
          <FormItem label="">
            <Space>
              <Button type="primary" onClick={() => {}}>
                提交
              </Button>
              <Button>取消</Button>
            </Space>
          </FormItem>
        </Form>
      </Card>

      {/* 数据表格 */}
      <Card title="4. 数据表格" style={{ marginBottom: 24 }}>
        <Table<Order>
          data={orders}
          columns={columns}
          rowKey="id"
          selection={{
            type: 'checkbox',
            selectedRowKeys: selectedRows.map((r: Order) => r.id),
          }}
          pagination={{
            current: 1,
            pageSize: 10,
            total: orders.length,
          }}
          onSelectionChange={handleSelectionChange}
        />
      </Card>

      {/* 描述列表 */}
      <Card title="5. 描述列表" style={{ marginBottom: 24 }}>
        <Descriptions
          title="订单详情"
          column={2}
          bordered
          items={[
            { label: '订单号', value: 'ORD-20240101-0001' },
            { label: '客户姓名', value: '张三' },
            { label: '订单金额', value: '¥1,580.00' },
            { label: '订单状态', value: <Tag color="green">已完成</Tag> },
            { label: '创建时间', value: '2024-01-01 10:00:00', span: 2 },
            { label: '备注', value: '这是一个普通订单', span: 2 },
          ]}
        />
      </Card>

      {/* 对话框 */}
      <Modal
        visible={visible}
        title="提示"
        onOk={() => {
          Message.success('确认操作');
          setVisible(false);
        }}
        onCancel={() => setVisible(false)}
      >
        <p>这是一个对话框示例</p>
        <p>点击次数: {count}</p>
      </Modal>
    </Page>
  );
}

