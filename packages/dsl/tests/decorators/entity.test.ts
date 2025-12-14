import { describe, it, expect } from 'vitest';
import { Entity, Field } from '../../src/decorators/entity';
import { metadataStore } from '../../src/utils/metadata';

describe('Entity Decorators', () => {
  it('should register entity metadata', () => {
    @Entity({ table: 'test_users', comment: 'Test User Table' })
    class TestUser {
      @Field({ label: 'ID' })
      id: number = 1;

      @Field({ label: 'Name' })
      name: string = 'test';
    }

    // 触发实例化以执行 addInitializer (注册字段元数据)
    new TestUser();

    // 验证 Entity 元数据
    const entityMeta = metadataStore.entities.get('TestUser');
    expect(entityMeta).toBeDefined();
    expect(entityMeta.table).toBe('test_users');
    expect(entityMeta.comment).toBe('Test User Table');

    // 验证 Field 元数据
    const fields = metadataStore.fields.get('TestUser');
    expect(fields).toBeDefined();
    
    const idMeta = fields!.get('id');
    expect(idMeta).toBeDefined();
    expect(idMeta.label).toBe('ID');

    const nameMeta = fields!.get('name');
    expect(nameMeta).toBeDefined();
    expect(nameMeta.label).toBe('Name');
  });

  it('should maintain type inference', () => {
    @Entity({ table: 'posts' })
    class Post {
      @Field({ label: 'Title' })
      title: string = '';
    }

    const post = new Post();
    // TypeScript check: accessing property should work
    expect(post.title).toBe('');
    
    // Type assertion to ensure compiler sees it as Post
    const p: Post = post;
    expect(p).toBeInstanceOf(Post);
  });
});






