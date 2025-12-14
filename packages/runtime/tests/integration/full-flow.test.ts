import { describe, it, expect, vi } from 'vitest';
import { 
  InMemoryRepo, 
  RepoFactory, 
  LocalEventBus, 
  HookRegistry, 
  ThreadLocalSecurityContext 
} from '../../src/index';

// Define a Domain Entity
class Order {
  id: string = '';
  status: string = 'created';
  constructor(public amount: number) {}
}

describe('Full Integration Flow', () => {
  it('should simulate a complete business transaction', async () => {
    // 1. Setup Infrastructure
    const bus = new LocalEventBus();
    const hooks = HookRegistry.global;
    
    // Register Repo
    const orderRepo = new InMemoryRepo<Order>(hooks);
    RepoFactory.register('Order', orderRepo);

    // 2. Register Subscribers & Hooks
    const eventHandler = vi.fn();
    bus.subscribe('OrderConfirmed', eventHandler);

    hooks.before('save:Order', (order: Order) => {
      if (order.amount < 0) throw new Error('Invalid amount');
    });

    // 3. Simulate Request Scope (Security)
    await ThreadLocalSecurityContext.run({ userId: 'user-1', tenantId: 'tenant-1' }, async () => {
      // 4. Simulate Application Service Logic
      const ctx = new ThreadLocalSecurityContext();
      const currentUser = ctx.getUserId();
      expect(currentUser).toBe('user-1');

      // Create Order
      const newOrder = new Order(100);
      
      // Save (triggers hooks)
      const savedOrder = await orderRepo.save(newOrder);
      expect(savedOrder.id).toBeDefined();

      // Confirm Order (business logic)
      savedOrder.status = 'confirmed';
      await orderRepo.save(savedOrder);

      // Publish Event
      await bus.publish({ constructor: { name: 'OrderConfirmed' }, orderId: savedOrder.id });
    });

    // 5. Verification
    expect(eventHandler).toHaveBeenCalled();
    const storedOrder = await orderRepo.findById((eventHandler.mock.calls[0][0] as any).orderId);
    expect(storedOrder?.status).toBe('confirmed');
  });
});
