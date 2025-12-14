import { describe, it, expect, beforeEach } from 'vitest';
import { RuntimeBootstrap } from '../../src/container/bootstrap';
import { DomainLogic, Action, Inject, Entity, Field } from '@ai-builder/dsl';
import type { Repo, EventBus } from '@ai-builder/dsl';

// 定义测试实体
@Entity()
class TestOrder {
  @Field({ label: 'ID', type: 'string' })
  id: string = '';

  @Field({ label: '金额', type: 'number' })
  amount: number = 0;
}

// 定义测试服务（使用依赖注入）
@DomainLogic()
class TestOrderService {
  @Inject('Repo<TestOrder>')
  private orderRepo!: Repo<TestOrder, any>;

  @Inject('EventBus')
  private eventBus!: EventBus;

  @Action()
  async createOrder(amount: number): Promise<TestOrder> {
    const order = new TestOrder();
    order.amount = amount;
    const saved = await this.orderRepo.save(order);
    
    await this.eventBus.publish({
      constructor: { name: 'OrderCreated' },
      orderId: saved.id
    });
    
    return saved;
  }

  @Action()
  async getOrder(id: string): Promise<TestOrder | null> {
    return this.orderRepo.findById(id);
  }
}

describe('RuntimeBootstrap with Dependency Injection', () => {
  let runtime: RuntimeBootstrap;

  beforeEach(() => {
    // 创建新的 metadataStore 实例（通过实例化服务类来触发装饰器）
    new TestOrderService(); // 触发装饰器元数据收集

    runtime = RuntimeBootstrap.create({
      mode: 'simulation',
      services: [TestOrderService],
      repos: {
        'TestOrder': 'InMemory'
      }
    });
  });

  it('should auto-inject dependencies', async () => {
    // 获取服务实例（依赖应该已自动注入）
    const service = runtime.get(TestOrderService);
    
    // 验证可以正常调用（说明 repo 和 eventBus 已注入）
    const order = await service.createOrder(100);
    
    expect(order.id).toBeDefined();
    expect(order.amount).toBe(100);

    // 验证可以查询
    const found = await service.getOrder(order.id);
    expect(found).toBeTruthy();
    expect(found?.amount).toBe(100);
  });

  it('should run in security context', async () => {
    const result = await runtime.runInContext(
      { userId: 'test-user', tenantId: 'test-tenant' },
      async () => {
        const service = runtime.get(TestOrderService);
        return service.createOrder(200);
      }
    );

    expect(result.amount).toBe(200);
  });
});

