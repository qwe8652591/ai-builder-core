/**
 * 采购订单表单页面（新建/编辑）
 */

import { definePage, useState, useEffect, useComputed } from '@ai-builder/dsl/ui';
import {
  Page,
  Card,
  Form,
  FormItem,
  Input,
  Select,
  Button,
  Space,
  Table,
  DatePicker,
  Modal,
  Message,
} from '@ai-builder/std-ui';
import { Decimal } from '@ai-builder/dsl';
import { SupplierInfo } from '../domain/PurchaseOrder.model';
import { 
  SupplierOptionDTO,
  MaterialOptionDTO,
  PurchaseOrderItemDTO
} from '../application/dto/PurchaseOrderDTO';
import { formatCurrency } from '../utils/typeHelpers';
import type { ColumnDefinition } from '@ai-builder/runtime-renderer/react';

export default definePage({
  meta: {
    title: '采购订单表单',
  },

  setup() {
    // 表单数据
    const [orderId, setOrderId] = useState<string | undefined>(undefined);
    const [title, setTitle] = useState('');
    const [supplierCode, setSupplierCode] = useState('');
    const [items, setItems] = useState<PurchaseOrderItemDTO[]>([]);
    const [remark, setRemark] = useState('');

    // UI 状态
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<PurchaseOrderItemDTO | undefined>(undefined);
    const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);

    // 明细表单数据
    const [itemMaterialCode, setItemMaterialCode] = useState('');
    const [itemQuantity, setItemQuantity] = useState('');
    const [itemUnitPrice, setItemUnitPrice] = useState('');
    const [itemRequiredDate, setItemRequiredDate] = useState<Date | undefined>(undefined);
    const [itemRemark, setItemRemark] = useState('');

    // 选项数据
    const [suppliers, setSuppliers] = useState<SupplierOptionDTO[]>([]);
    const [materials, setMaterials] = useState<MaterialOptionDTO[]>([]);

    // 计算属性：供应商选项
    const supplierOptions = useComputed(() => {
      return suppliers.map((s) => ({
        label: `${s.code} - ${s.name}`,
        value: s.code,
      }));
    }, [suppliers]);

    // 计算属性：物料选项
    const materialOptions = useComputed(() => {
      return materials.map((m) => ({
        label: `${m.code} - ${m.name}`,
        value: m.code,
      }));
    }, [materials]);

  // 计算属性：订单总额
  const totalAmount = useComputed(() => {
    if (!items || items.length === 0) {
      return Decimal.of(0);
    }
    return items.reduce(
      (sum, item) => sum.add(item.amount),
      Decimal.of(0)
    );
  }, [items]);

    // 计算属性：选中的供应商
    const selectedSupplier = useComputed(() => {
      return suppliers.find((s) => s.code === supplierCode);
    }, [supplierCode, suppliers]);

    // 明细表格列定义
    const itemColumns = useComputed<ColumnDefinition<PurchaseOrderItemDTO>[]>(() => {
      return [
        {
          prop: 'materialCode',
          label: '物料编码',
          width: 120,
        },
        {
          prop: 'materialName',
          label: '物料名称',
          width: 150,
        },
        {
          prop: 'specification',
          label: '规格型号',
          width: 120,
        },
        {
          prop: 'quantity',
          label: '数量',
          width: 100,
          align: 'right',
          formatter: (value) => (value as Decimal).toString(),
        },
        {
          prop: 'unit',
          label: '单位',
          width: 80,
        },
        {
          prop: 'unitPrice',
          label: '单价',
          width: 100,
          align: 'right',
          formatter: (value: unknown) => formatCurrency(value),
        },
        {
          prop: 'amount',
          label: '金额',
          width: 120,
          align: 'right',
          formatter: (value: unknown) => formatCurrency(value),
        },
        {
          prop: 'requiredDate',
          label: '需求日期',
          width: 120,
          formatter: (value) => {
            const date = value as Date;
            return date.toLocaleDateString('zh-CN');
          },
        },
        {
          key: 'actions',
          label: '操作',
          width: 150,
          fixed: 'right',
          formatter: (_: unknown, record: PurchaseOrderItemDTO, index: number) => (
            <Space size="small">
              <Button
                type="link"
                onClick={() => handleEditItem(record, index)}
              >
                编辑
              </Button>
              <Button
                type="link"
                onClick={() => handleDeleteItem(index)}
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
        // 加载供应商列表
        const mockSuppliers: SupplierOptionDTO[] = [
          {
            code: 'SUP001',
            name: '办公用品供应商A',
            contactPerson: '张经理',
            contactPhone: '13800138000',
          },
          {
            code: 'SUP002',
            name: '设备供应商B',
            contactPerson: '李经理',
            contactPhone: '13800138001',
          },
        ];
        setSuppliers(mockSuppliers);

        // 加载物料列表
        const mockMaterials: MaterialOptionDTO[] = [
          {
            code: 'MAT001',
            name: 'A4纸',
            specification: '80g 500张/包',
            unit: '包',
            latestPrice: new Decimal(25),
          },
          {
            code: 'MAT002',
            name: '圆珠笔',
            specification: '0.5mm 蓝色',
            unit: '支',
            latestPrice: new Decimal(2),
          },
          {
            code: 'MAT003',
            name: '订书机',
            specification: '标准型',
            unit: '个',
            latestPrice: new Decimal(15),
          },
        ];
        setMaterials(mockMaterials);

        // 如果是编辑模式，加载订单数据
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
          setOrderId(id);
          // 模拟加载订单数据
          setTitle('办公用品采购');
          setSupplierCode('SUP001');
          setRemark('年度采购计划');
          // ... 加载明细
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    // 添加明细
    const handleAddItem = () => {
      setEditingItem(undefined);
      setEditingItemIndex(undefined);
      setItemMaterialCode('');
      setItemQuantity('');
      setItemUnitPrice('');
      setItemRequiredDate(undefined);
      setItemRemark('');
      setShowItemModal(true);
    };

    // 编辑明细
    const handleEditItem = (item: PurchaseOrderItemDTO, index: number) => {
      setEditingItem(item);
      setEditingItemIndex(index);
      setItemMaterialCode(item.materialCode);
      setItemQuantity(item.quantity.toString());
      setItemUnitPrice(item.unitPrice.toString());
      setItemRequiredDate(item.requiredDate);
      setItemRemark(item.remark || '');
      setShowItemModal(true);
    };

    // 删除明细
    const handleDeleteItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    };

    // 保存明细
    const handleSaveItem = () => {
      // 验证
      if (!itemMaterialCode) {
        Message.error('请选择物料');
        return;
      }
      if (!itemQuantity || parseFloat(itemQuantity) <= 0) {
        Message.error('请输入正确的数量');
        return;
      }
      if (!itemUnitPrice || parseFloat(itemUnitPrice) < 0) {
        Message.error('请输入正确的单价');
        return;
      }
      if (!itemRequiredDate) {
        Message.error('请选择需求日期');
        return;
      }

      const material = materials.find((m) => m.code === itemMaterialCode);
      if (!material) {
        Message.error('物料不存在');
        return;
      }

      const qty = Decimal.of(itemQuantity);
      const price = Decimal.of(itemUnitPrice);
      
      const newItem: PurchaseOrderItemDTO = {
        id: editingItem?.id || `item_${Date.now()}`,
        materialCode: material.code,
        materialName: material.name,
        specification: material.specification,
        quantity: qty,
        unit: material.unit,
        unitPrice: price,
        amount: qty.mul(price),
        requiredDate: itemRequiredDate,
        remark: itemRemark,
      };

      const newItems = [...items];
      if (editingItemIndex !== undefined) {
        newItems[editingItemIndex] = newItem;
      } else {
        newItems.push(newItem);
      }
      setItems(newItems);
      setShowItemModal(false);
    };

    // 提交表单
    const handleSubmit = async () => {
      // 验证
      if (!title) {
        Message.error('请输入订单标题');
        return;
      }
      if (!supplierCode) {
        Message.error('请选择供应商');
        return;
      }
      if (items.length === 0) {
        Message.error('请添加订单明细');
        return;
      }

      setSubmitting(true);
      try {
        const supplier = suppliers.find((s) => s.code === supplierCode);
        if (!supplier) {
          throw new Error('供应商不存在');
        }

        const supplierInfo: SupplierInfo = {
          code: supplier.code,
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          contactPhone: supplier.contactPhone,
        };

        // 调用 API
        console.log('提交订单:', {
          id: orderId,
          title,
          supplier: supplierInfo,
          items,
          remark,
        });

        Message.success('保存成功');
        // 跳转回列表页
        setTimeout(() => {
          window.location.href = '/purchase-order/list';
        }, 1000);
      } catch (error) {
        console.error('提交失败:', error);
        Message.error('保存失败');
      } finally {
        setSubmitting(false);
      }
    };

    // 返回
    const handleBack = () => {
      window.location.href = '/purchase-order/list';
    };

    // 初始化
    useEffect(() => {
      loadData();
    }, []);

    return () => (
      <Page
        title={orderId ? '编辑采购订单' : '新建采购订单'}
        onBack={handleBack}
        loading={loading}
      >
        <Card title="基本信息">
          <Form labelWidth="120px">
            <FormItem label="订单标题">
              <Input
                value={title}
                onChange={setTitle}
                placeholder="请输入订单标题"
                style={{ width: '400px' }}
              />
            </FormItem>

            <FormItem label="供应商">
              <Select
                value={supplierCode}
                options={supplierOptions}
                onChange={(value) => setSupplierCode(value as string)}
                placeholder="请选择供应商"
                filterable
                style={{ width: '400px' }}
              />
            </FormItem>

            {selectedSupplier && (
              <FormItem label="联系信息">
                <Space direction="vertical">
                  <span>联系人: {selectedSupplier.contactPerson}</span>
                  <span>电话: {selectedSupplier.contactPhone}</span>
                </Space>
              </FormItem>
            )}

            <FormItem label="备注">
              <Input
                type="textarea"
                value={remark}
                onChange={setRemark}
                placeholder="请输入备注"
                maxLength={500}
                style={{ width: '600px' }}
              />
            </FormItem>
          </Form>
        </Card>

        <Card
          title="订单明细"
          extra={
            <Button type="primary" onClick={handleAddItem}>
              添加明细
            </Button>
          }
          style={{ marginTop: '16px' }}
        >
          <Table<PurchaseOrderItemDTO>
            data={items}
            columns={itemColumns}
            rowKey="id"
          />

          <Space
            style={{
              marginTop: '16px',
              fontSize: '16px',
              fontWeight: 'bold',
              justifyContent: 'flex-end',
              width: '100%',
            }}
          >
            <span>订单总额:</span>
            <span style={{ color: '#ff4d4f', fontSize: '20px' }}>
              ¥{totalAmount.toFixed(2)}
            </span>
          </Space>
        </Card>

        <Card style={{ marginTop: '16px' }}>
          <Space>
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              保存
            </Button>
            <Button onClick={handleBack}>
              返回
            </Button>
          </Space>
        </Card>

        {/* 明细编辑弹窗 */}
        <Modal
          visible={showItemModal}
          title={editingItem ? '编辑明细' : '添加明细'}
          onOk={handleSaveItem}
          onCancel={() => setShowItemModal(false)}
          width={600}
        >
          <Form labelWidth="100px">
            <FormItem label="物料">
              <Select
                value={itemMaterialCode}
                options={materialOptions}
                onChange={(code) => {
                  setItemMaterialCode(code as string);
                  const material = materials.find((m) => m.code === code);
                  if (material && material.latestPrice) {
                    setItemUnitPrice(material.latestPrice.toString());
                  }
                }}
                placeholder="请选择物料"
                filterable
                style={{ width: '100%' }}
              />
            </FormItem>

            <FormItem label="数量">
              <Input
                type="number"
                value={itemQuantity}
                onChange={setItemQuantity}
                placeholder="请输入数量"
                style={{ width: '100%' }}
              />
            </FormItem>

            <FormItem label="单价">
              <Input
                type="number"
                value={itemUnitPrice}
                onChange={setItemUnitPrice}
                placeholder="请输入单价"
                style={{ width: '100%' }}
              />
            </FormItem>

            <FormItem label="需求日期">
              <DatePicker
                value={itemRequiredDate}
                onChange={(value) => setItemRequiredDate(value as Date)}
                placeholder="请选择需求日期"
                style={{ width: '100%' }}
              />
            </FormItem>

            <FormItem label="备注">
              <Input
                type="textarea"
                value={itemRemark}
                onChange={setItemRemark}
                placeholder="请输入备注"
                maxLength={200}
                style={{ width: '100%' }}
              />
            </FormItem>
          </Form>
        </Modal>
      </Page>
    );
  },
});

