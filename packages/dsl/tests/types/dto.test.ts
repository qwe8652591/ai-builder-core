import { describe, it, expect } from 'vitest';
import { CreateCommand, UpdateCommand, DetailView } from '../../src/types/dto';

class User {
  id: number = 1;
  username: string = 'test';
  email: string = 'test@example.com';
  createdAt: Date = new Date();
  
  someMethod() { return true; }
}

describe('Type System', () => {
  it('should derive CreateCommand correctly', () => {
    // 运行时验证无意义，这是纯类型测试
    // 我们通过构造对象来验证类型兼容性
    
    const cmd: CreateCommand<User> = {
      username: 'newuser',
      email: 'new@example.com'
    };

    // @ts-expect-error - id should be excluded
    const fail: CreateCommand<User> = { id: 1, username: 'fail', email: 'fail@example.com' };
    
    expect(cmd.username).toBe('newuser');
    expect('id' in cmd).toBe(false);
    expect('createdAt' in cmd).toBe(false);
  });

  it('should derive UpdateCommand correctly', () => {
    const cmd: UpdateCommand<User> = {
      id: 123,
      username: 'updated'
    };

    expect(cmd.id).toBe(123);
    // email is optional
  });

  it('should derive DetailView correctly', () => {
    const view: DetailView<User> = {
      id: 1,
      username: 'view',
      email: 'view@example.com',
      createdAt: new Date()
    };

    expect(view.id).toBe(1);
    // @ts-expect-error - method should be excluded
    const _ = view.someMethod;
    expect((view as any).someMethod).toBeUndefined();
  });
});

