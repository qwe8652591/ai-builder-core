import { describe, it, expect } from 'vitest';
import { DomainLogic, AppService } from '../../src/decorators/service';
import { Action, Rule } from '../../src/decorators/action';
import { metadataStore } from '../../src/utils/metadata';

describe('Service Decorators', () => {
  it('should register service metadata', () => {
    @DomainLogic()
    class OrderLogic {
      @Rule('Check stock')
      checkStock() { return true; }
    }

    @AppService()
    class OrderService {
      @Action({ transactional: true })
      createOrder() {}
    }

    new OrderLogic().checkStock();
    new OrderService().createOrder();

    const logicMeta = metadataStore.entities.get('OrderLogic');
    expect(logicMeta.type).toBe('DomainLogic');

    const serviceMeta = metadataStore.entities.get('OrderService');
    expect(serviceMeta.type).toBe('AppService');

    const logicFields = metadataStore.fields.get('OrderLogic');
    const checkStock = logicFields!.get('checkStock');
    expect(checkStock.isRule).toBe(true);

    const serviceFields = metadataStore.fields.get('OrderService');
    const createOrder = serviceFields!.get('createOrder');
    expect(createOrder.isAction).toBe(true);
    expect(createOrder.transactional).toBe(true);
  });
});






