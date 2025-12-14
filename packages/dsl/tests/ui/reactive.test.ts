/**
 * 响应式 API 类型测试
 * 
 * 验证 useState, useComputed, useWatch 的类型推导正确性。
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import { useState, useComputed, useWatch } from '../../src/ui/reactive';
import type { ReactiveState, ComputedState } from '../../src/ui/types';

describe('useState 类型推导', () => {
  it('应该从初始值自动推导类型', () => {
    const count = useState(0);
    
    // 类型检查
    expectTypeOf(count).toMatchTypeOf<ReactiveState<number>>();
    expectTypeOf(count.value).toBeNumber();
    
    // 编译时错误（取消注释应该报错）:
    // count.value = 'string'; // ❌ 类型错误
  });
  
  it('应该支持显式泛型参数', () => {
    interface User {
      name: string;
      age: number;
    }
    
    const user = useState<User>({ name: 'Alice', age: 30 });
    
    // 类型检查
    expectTypeOf(user).toMatchTypeOf<ReactiveState<User>>();
    expectTypeOf(user.value).toMatchTypeOf<User>();
    expectTypeOf(user.value.name).toBeString();
    expectTypeOf(user.value.age).toBeNumber();
  });
  
  it('应该支持联合类型', () => {
    const status = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    
    // 类型检查
    expectTypeOf(status.value).toEqualTypeOf<'idle' | 'loading' | 'success' | 'error'>();
    
    // 编译时错误（取消注释应该报错）:
    // status.value = 'invalid'; // ❌ 类型错误
  });
  
  it('应该支持可选初始值', () => {
    const data = useState<string>();
    
    // 类型检查
    expectTypeOf(data).toMatchTypeOf<ReactiveState<string | undefined>>();
    expectTypeOf(data.value).toEqualTypeOf<string | undefined>();
  });
  
  it('应该支持数组类型', () => {
    const items = useState<number[]>([1, 2, 3]);
    
    // 类型检查
    expectTypeOf(items.value).toMatchTypeOf<number[]>();
    expectTypeOf(items.value[0]).toBeNumber();
  });
  
  it('应该支持嵌套对象类型', () => {
    interface Address {
      city: string;
      street: string;
    }
    
    interface User {
      name: string;
      address: Address;
    }
    
    const user = useState<User>({
      name: 'Bob',
      address: { city: 'Shanghai', street: 'Nanjing Road' }
    });
    
    // 类型检查
    expectTypeOf(user.value.address.city).toBeString();
  });
  
  it('应该支持泛型推导', () => {
    function createState<T>(initial: T) {
      return useState(initial);
    }
    
    const count = createState(100);
    expectTypeOf(count.value).toBeNumber();
    
    const text = createState('hello');
    expectTypeOf(text.value).toBeString();
  });
});

describe('useState 运行时行为', () => {
  it('应该抛出编译期错误提示', () => {
    expect(() => {
      useState(0);
    }).toThrow(/compile-time DSL primitive/);
  });
});

describe('useComputed 类型推导', () => {
  it('应该从 getter 返回值推导类型', () => {
    const count = useState(5);
    const doubled = useComputed(() => count.value * 2);
    
    // 类型检查
    expectTypeOf(doubled).toMatchTypeOf<ComputedState<number>>();
    expectTypeOf(doubled.value).toBeNumber();
  });
  
  it('应该支持复杂类型推导', () => {
    interface Item {
      name: string;
      price: number;
    }
    
    const items = useState<Item[]>([
      { name: 'Apple', price: 10 },
      { name: 'Banana', price: 5 }
    ]);
    
    const totalPrice = useComputed(() => 
      items.value.reduce((sum, item) => sum + item.price, 0)
    );
    
    // 类型检查
    expectTypeOf(totalPrice.value).toBeNumber();
  });
  
  it('应该推导联合类型', () => {
    const value = useState<number | null>(null);
    const displayValue = useComputed(() => 
      value.value === null ? 'N/A' : value.value.toString()
    );
    
    // 类型检查
    expectTypeOf(displayValue.value).toBeString();
  });
  
  it('应该支持嵌套计算属性', () => {
    const a = useState(10);
    const b = useState(20);
    const sum = useComputed(() => a.value + b.value);
    const average = useComputed(() => sum.value / 2);
    
    // 类型检查
    expectTypeOf(sum.value).toBeNumber();
    expectTypeOf(average.value).toBeNumber();
  });
  
  it('应该推导对象类型', () => {
    const firstName = useState('John');
    const lastName = useState('Doe');
    const fullName = useComputed(() => ({
      first: firstName.value,
      last: lastName.value,
      full: `${firstName.value} ${lastName.value}`
    }));
    
    // 类型检查
    expectTypeOf(fullName.value).toMatchTypeOf<{
      first: string;
      last: string;
      full: string;
    }>();
  });
  
  it('计算属性应该是只读的', () => {
    const count = useState(0);
    const doubled = useComputed(() => count.value * 2);
    
    // 类型检查：只读属性
    expectTypeOf(doubled.value).toBeNumber();
    
    // 编译时错误（取消注释应该报错）:
    // doubled.value = 10; // ❌ 只读属性不能赋值
  });
});

describe('useComputed 运行时行为', () => {
  it('应该抛出编译期错误提示', () => {
    expect(() => {
      const count = useState(0);
      useComputed(() => count.value * 2);
    }).toThrow(/compile-time DSL primitive/);
  });
});

describe('useWatch 类型推导', () => {
  it('应该正确推导监听源的类型', () => {
    const count = useState(5);
    
    // 监听响应式状态
    const stopWatch = useWatch(count, (newValue, oldValue) => {
      expectTypeOf(newValue).toBeNumber();
      expectTypeOf(oldValue).toBeNumber();
    });
    
    // 返回停止函数
    expectTypeOf(stopWatch).toBeFunction();
    expectTypeOf(stopWatch).returns.toBeVoid();
  });
  
  it('应该支持监听计算属性', () => {
    const count = useState(0);
    const doubled = useComputed(() => count.value * 2);
    
    useWatch(doubled, (newValue, oldValue) => {
      expectTypeOf(newValue).toBeNumber();
      expectTypeOf(oldValue).toBeNumber();
    });
  });
  
  it('应该支持监听 getter 函数', () => {
    interface User {
      name: string;
      age: number;
    }
    
    const user = useState<User>({ name: 'Alice', age: 30 });
    
    // 监听 getter 返回值
    useWatch(
      () => user.value.age,
      (newAge, oldAge) => {
        expectTypeOf(newAge).toBeNumber();
        expectTypeOf(oldAge).toBeNumber();
      }
    );
  });
  
  it('应该支持监听选项类型', () => {
    const count = useState(0);
    
    // 完整选项
    useWatch(count, () => {}, {
      immediate: true,
      deep: true
    });
    
    // 部分选项
    useWatch(count, () => {}, { immediate: true });
    useWatch(count, () => {}, { deep: true });
    
    // 无选项
    useWatch(count, () => {});
  });
  
  it('应该推导复杂类型的监听', () => {
    interface Product {
      id: string;
      name: string;
      price: number;
    }
    
    const products = useState<Product[]>([]);
    
    useWatch(products, (newProducts, oldProducts) => {
      expectTypeOf(newProducts).toMatchTypeOf<Product[]>();
      expectTypeOf(oldProducts).toMatchTypeOf<Product[]>();
    });
    
    // 监听派生值
    useWatch(
      () => products.value.length,
      (newLength, oldLength) => {
        expectTypeOf(newLength).toBeNumber();
        expectTypeOf(oldLength).toBeNumber();
      }
    );
  });
});

describe('useWatch 运行时行为', () => {
  it('应该抛出编译期错误提示', () => {
    expect(() => {
      const count = useState(0);
      useWatch(count, () => {});
    }).toThrow(/compile-time DSL primitive/);
  });
});



