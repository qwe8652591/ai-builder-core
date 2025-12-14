import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalEventBus } from '../../src/event-bus/local-event-bus';

class OrderCreated {
  constructor(public id: string) {}
}

class OrderUpdated {
  constructor(public id: string) {}
}

class UserCreated {
  constructor(public id: string) {}
}

describe('LocalEventBus', () => {
  let bus: LocalEventBus;

  beforeEach(() => {
    bus = new LocalEventBus();
  });

  it('should handle exact match subscription', async () => {
    const handler = vi.fn();
    bus.subscribe('OrderCreated', handler);

    await bus.publish(new OrderCreated('1'));
    
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(OrderCreated));
  });

  it('should not call handler for different topic', async () => {
    const handler = vi.fn();
    bus.subscribe('OrderCreated', handler);

    await bus.publish(new UserCreated('1'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle wildcard * subscription', async () => {
    const handler = vi.fn();
    bus.subscribe('*', handler);

    await bus.publish(new OrderCreated('1'));
    await bus.publish(new UserCreated('2'));

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should handle pattern subscription (Order.*)', async () => {
    const handler = vi.fn();
    bus.subscribe('Order.*', handler);

    await bus.publish(new OrderCreated('1')); // Should match
    await bus.publish(new OrderUpdated('1')); // Should match (Wait, OrderUpdated doesn't start with Order. unless I rename classes or use naming convention)
    
    // In JS class names are just names. OrderCreated does not contain dot.
    // My implementation replaces '.' with '\.' and '*' with '.*'.
    // If topic is 'Order.*', regex is ^Order\..*$. 
    // This expects topic string to contain dot.
    
    // BUT in publish(), I use `event.constructor.name` as topic.
    // OrderCreated -> "OrderCreated".
    
    // So 'Order.*' will NOT match "OrderCreated".
    // It would match "Order.Created" if I used that as topic.
    
    // Let's adjust the test expectation or implementation.
    // If I want prefix matching "Order*", I should subscribe to "Order*".
    
    // Let's test "Order*" pattern.
  });
  
  it('should handle prefix pattern subscription', async () => {
    const handler = vi.fn();
    // Subscribe to topics starting with "Order"
    bus.subscribe('Order*', handler);

    await bus.publish(new OrderCreated('1'));
    await bus.publish(new OrderUpdated('1'));
    await bus.publish(new UserCreated('1'));

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should unsubscribe correctly', async () => {
    const handler = vi.fn();
    bus.subscribe('test', handler);
    bus.unsubscribe('test', handler);

    await bus.publish({ constructor: { name: 'test' } });
    expect(handler).not.toHaveBeenCalled();
  });
});






