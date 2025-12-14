import { describe, it, expect } from 'vitest';
import { Entity, Field } from '../../src/decorators/entity';
import { Composition, Association } from '../../src/decorators/relation';
import { metadataStore } from '../../src/utils/metadata';

describe('Relation Decorators', () => {
  it('should register relation metadata', () => {
    @Entity()
    class User {
      @Field({ label: 'ID' })
      id: number = 1;
    }

    @Entity()
    class Order {
      @Association({ target: () => User, type: 'ManyToOne', label: 'User' })
      user!: User;
    }

    new Order();

    const fields = metadataStore.fields.get('Order');
    const userRelation = fields!.get('user');

    expect(userRelation).toBeDefined();
    expect(userRelation.isRelation).toBe(true);
    expect(userRelation.relationType).toBe('Association');
    expect(userRelation.type).toBe('ManyToOne');
    expect(userRelation.target()).toBe(User);
  });
});






