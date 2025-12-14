/**
 * 采购订单列表页面
 */

import { definePage, useState, useEffect, useComputed } from '@ai-builder/dsl/ui';
import { Decimal } from '@ai-builder/dsl';
import { formatCurrency, formatDateTime } from '../utils/typeHelpers';
import {
  Page,
  Card,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
} from '@ai-builder/std-ui';
import { PurchaseOrderStatus } from '../domain/PurchaseOrder.model';
import {
  PurchaseOrderListItemDTO,
  PurchaseOrderStatusLabels,
  PurchaseOrderStatusColors,
} from '../application/dto/PurchaseOrderDTO';
import type { ColumnDefinition } from '@ai-builder/runtime-renderer/react';

export default definePage({
  meta: {
    title: '采购订单列表',
  },

  setup() {
    // 状态
    const [dataSource, setDataSource] = useState<PurchaseOrderListItemDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [pageNo, setPageNo] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // 查询条件
    const [orderNo, setOrderNo] = useState('');
    const [status, setStatus] = useState<PurchaseOrderStatus | undefined>(undefined);
    const [dateRange, setDateRange] = useState<[Date, Date] | undefined>(undefined);

    // 计算属性：状态选项
    const statusOptions = useComputed(() => {
      return Object.values(PurchaseOrderStatus).map((value) => ({
        label: PurchaseOrderStatusLabels[value],
        value,
      }));
    }, []);

    // 表格列定义
    const columns = useComputed<ColumnDefinition<PurchaseOrderListItemDTO>[]>(() => {
      return [
        {
          prop: 'orderNo',
          label: '订单编号',
          width: 150,
          fixed: 'left',
        },
        {
          prop: 'title',
          label: '订单标题',
          width: 200,
        },
        {
          prop: 'supplierName',
          label: '供应商',
          width: 180,
        },
        {
          prop: 'totalAmount',
          label: '订单金额',
          width: 120,
          align: 'right',
          formatter: (value: unknown) => formatCurrency(value),
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (value: unknown, record: PurchaseOrderListItemDTO) => (
            <Tag color={PurchaseOrderStatusColors[record.status]}>
              {record.statusLabel}
            </Tag>
          ),
        },
        {
          prop: 'createdBy',
          label: '创建人',
          width: 120,
        },
        {
          prop: 'createdAt',
          label: '创建时间',
          width: 180,
          formatter: (value: unknown) => formatDateTime(value),
        },
        {
          key: 'actions',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (_: unknown, record: PurchaseOrderListItemDTO) => (
            <Space size="small">
              <Button
                type="link"
                onClick={() => handleView(record.id)}
              >
                查看
              </Button>
              <Button
                type="link"
                onClick={() => handleEdit(record.id)}
                disabled={record.status !== PurchaseOrderStatus.DRAFT}
              >
                编辑
              </Button>
              <Button
                type="link"
                onClick={() => handleDelete(record.id)}
                disabled={
                  record.status !== PurchaseOrderStatus.DRAFT &&
                  record.status !== PurchaseOrderStatus.CANCELLED
                }
              >
                删除
              </Button>
            </Space>
          ),
        },
      ];
    }, []);

    // 加载数据
    const loadData = async () => {
      setLoading(true);
      try {
        // 模拟 API 调用
        const mockData: PurchaseOrderListItemDTO[] = [
          {
            id: '1',
            orderNo: 'PO20240101',
            title: '办公用品采购',
            supplierName: '办公用品供应商A',
            totalAmount: new Decimal(12500),
            status: PurchaseOrderStatus.PENDING,
            statusLabel: '待审批',
            createdBy: '张三',
            createdAt: new Date('2024-01-15'),
          },
          {
            id: '2',
            orderNo: 'PO20240102',
            title: '生产设备采购',
            supplierName: '设备供应商B',
            totalAmount: new Decimal(350000),
            status: PurchaseOrderStatus.APPROVED,
            statusLabel: '已审批',
            createdBy: '李四',
            createdAt: new Date('2024-01-16'),
            approvedBy: '王五',
            approvedAt: new Date('2024-01-17'),
          },
          {
            id: '3',
            orderNo: 'PO20240103',
            title: '原材料采购',
            supplierName: '原材料供应商C',
            totalAmount: new Decimal(85000),
            status: PurchaseOrderStatus.IN_PROGRESS,
            statusLabel: '执行中',
            createdBy: '张三',
            createdAt: new Date('2024-01-18'),
            approvedBy: '王五',
            approvedAt: new Date('2024-01-19'),
          },
        ];

        setDataSource(mockData);
        setTotal(mockData.length);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    // 查询
    const handleSearch = () => {
      setPageNo(1);
      loadData();
    };

    // 重置
    const handleReset = () => {
      setOrderNo('');
      setStatus(undefined);
      setDateRange(undefined);
      setPageNo(1);
      loadData();
    };

    // 新建
    const handleCreate = () => {
      // 跳转到新建页面
      window.location.href = '/purchase-order/create';
    };

    // 查看
    const handleView = (id: string) => {
      window.location.href = `/purchase-order/detail/${id}`;
    };

    // 编辑
    const handleEdit = (id: string) => {
      window.location.href = `/purchase-order/edit/${id}`;
    };

    // 删除
    const handleDelete = (id: string) => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除这条采购订单吗？',
        onOk: async () => {
          try {
            // 调用删除 API
            console.log('删除订单:', id);
            await loadData();
          } catch (error) {
            console.error('删除失败:', error);
          }
        },
      });
    };

    // 分页变化
    const handlePageChange = (page: number, size: number) => {
      setPageNo(page);
      setPageSize(size);
      loadData();
    };

    // 初始化
    useEffect(() => {
      loadData();
    }, []);

    return () => (
      <Page title="采购订单列表">
        <Card>
          {/* 查询表单 */}
          <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
            <Space>
              <Input
                placeholder="订单编号"
                value={orderNo}
                onChange={setOrderNo}
                style={{ width: '200px' }}
              />
              <Select
                placeholder="订单状态"
                value={status}
                options={statusOptions}
                onChange={(value) => setStatus(value as PurchaseOrderStatus | undefined)}
                clearable
                style={{ width: '150px' }}
              />
              <DatePicker
                type="daterange"
                placeholder={['开始日期', '结束日期']}
                value={dateRange}
                onChange={(value) => setDateRange(value as [Date, Date] | undefined)}
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
          <Space style={{ marginBottom: '16px' }}>
            <Button type="primary" onClick={handleCreate}>
              新建订单
            </Button>
          </Space>

          {/* 表格 */}
          <Table<PurchaseOrderListItemDTO>
            data={dataSource}
            columns={columns}
            loading={loading}
            pagination={{
              current: pageNo,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: handlePageChange,
            }}
            rowKey="id"
          />
        </Card>
      </Page>
    );
  },
});



