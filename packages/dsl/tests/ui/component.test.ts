import { describe, it, expect, expectTypeOf } from 'vitest';
import { definePage, defineComponent } from '../../src/ui/component';
import type { Component, PageMeta } from '../../src/ui/types';

describe('definePage 类型推导', () => {
  it('应该返回 Component 类型', () => {
    const page = definePage(
      {
        route: '/test',
        title: '测试页面'
      },
      () => {
        return () => <div>Test</div>;
      }
    );
    
    // 类型检查
    expectTypeOf(page).toMatchTypeOf<Component<{}>>();
  });
  
  it('应该支持 Props 类型推导', () => {
    interface PageProps {
      userId: string;
    }
    
    const page = definePage<PageProps>(
      {
        route: '/user/:id',
        title: '用户详情'
      },
      (props) => {
        expectTypeOf(props.userId).toBeString();
        return () => <div>{props.userId}</div>;
      }
    );
    
    expectTypeOf(page).toMatchTypeOf<Component<PageProps>>();
  });
  
  it('应该验证 PageMeta 接口', () => {
    // 完整元数据
    const meta: PageMeta = {
      route: '/orders',
      title: '订单列表',
      permission: 'order:list',
      menu: {
        parent: 'business',
        order: 1,
        icon: 'order'
      }
    };
    
    definePage(meta, () => {
      return () => <div>Orders</div>;
    });
    
    // 最小元数据
    const minMeta: PageMeta = {
      route: '/about',
      title: '关于我们'
    };
    
    definePage(minMeta, () => {
      return () => <div>About</div>;
    });
  });
  
  it('应该推导 setup 函数返回的渲染函数类型', () => {
    definePage(
      { route: '/test', title: '测试' },
      () => {
        const renderFn = () => <div>Content</div>;
        
        // 渲染函数应该返回 JSX
        expectTypeOf(renderFn).returns.toBeAny();
        
        return renderFn;
      }
    );
  });
  
  it('应该支持空 Props 的页面', () => {
    const page = definePage(
      { route: '/', title: '首页' },
      () => {
        return () => <div>Home</div>;
      }
    );
    
    expectTypeOf(page).toMatchTypeOf<Component<{}>>();
  });
});

describe('defineComponent 类型推导', () => {
  it('应该返回 Component 类型', () => {
    const comp = defineComponent(
      {},
      () => {
        return () => <div>Component</div>;
      }
    );
    
    expectTypeOf(comp).toMatchTypeOf<Component<{}>>();
  });
  
  it('应该推导 Props 类型', () => {
    interface ButtonProps {
      text: string;
      type?: 'primary' | 'default';
      disabled?: boolean;
    }
    
    const Button = defineComponent<ButtonProps>(
      {
        props: {
          text: { type: String, required: true },
          type: { type: String, default: 'default' },
          disabled: { type: Boolean, default: false }
        }
      },
      (props) => {
        // Props 类型应该正确推导
        expectTypeOf(props.text).toBeString();
        expectTypeOf(props.type).toEqualTypeOf<'primary' | 'default' | undefined>();
        expectTypeOf(props.disabled).toEqualTypeOf<boolean | undefined>();
        
        return () => <button>{props.text}</button>;
      }
    );
    
    expectTypeOf(Button).toMatchTypeOf<Component<ButtonProps>>();
  });
  
  it('应该支持复杂 Props 类型', () => {
    interface Order {
      id: string;
      amount: number;
      status: 'pending' | 'completed';
    }
    
    interface OrderCardProps {
      order: Order;
      showActions?: boolean;
      onEdit?: (id: string) => void;
    }
    
    const OrderCard = defineComponent<OrderCardProps>(
      {
        props: {
          order: { type: Object, required: true },
          showActions: { type: Boolean, default: true },
          onEdit: { type: Function }
        },
        emits: ['edit', 'delete']
      },
      (props) => {
        expectTypeOf(props.order).toMatchTypeOf<Order>();
        expectTypeOf(props.showActions).toEqualTypeOf<boolean | undefined>();
        expectTypeOf(props.onEdit).toEqualTypeOf<((id: string) => void) | undefined>();
        
        return () => (
          <div>
            <h3>{props.order.id}</h3>
            <p>金额: {props.order.amount}</p>
          </div>
        );
      }
    );
    
    expectTypeOf(OrderCard).toMatchTypeOf<Component<OrderCardProps>>();
  });
  
  it('应该支持泛型组件 Props', () => {
    interface ListProps<T> {
      items: T[];
      renderItem: (item: T) => any;
    }
    
    const List = defineComponent<ListProps<string>>(
      {
        props: {
          items: { type: Array, required: true },
          renderItem: { type: Function, required: true }
        }
      },
      (props) => {
        expectTypeOf(props.items).toMatchTypeOf<string[]>();
        expectTypeOf(props.renderItem).toBeFunction();
        
        return () => (
          <div>
            {props.items.map(item => props.renderItem(item))}
          </div>
        );
      }
    );
    
    expectTypeOf(List).toMatchTypeOf<Component<ListProps<string>>>();
  });
  
  it('应该支持无 Props 的组件', () => {
    const HelloWorld = defineComponent(
      {},
      () => {
        return () => <div>Hello World</div>;
      }
    );
    
    expectTypeOf(HelloWorld).toMatchTypeOf<Component<{}>>();
  });
  
  it('应该验证 emits 定义', () => {
    interface InputProps {
      value: string;
    }
    
    const Input = defineComponent<InputProps>(
      {
        props: {
          value: { type: String, required: true }
        },
        emits: ['change', 'blur', 'focus']
      },
      (props) => {
        return () => <input value={props.value} />;
      }
    );
    
    expectTypeOf(Input).toMatchTypeOf<Component<InputProps>>();
  });
  
  it('应该支持可选 Props', () => {
    interface CardProps {
      title?: string;
      description?: string;
    }
    
    const Card = defineComponent<CardProps>(
      {
        props: {
          title: { type: String },
          description: { type: String }
        }
      },
      (props) => {
        expectTypeOf(props.title).toEqualTypeOf<string | undefined>();
        expectTypeOf(props.description).toEqualTypeOf<string | undefined>();
        
        return () => (
          <div>
            {props.title && <h2>{props.title}</h2>}
            {props.description && <p>{props.description}</p>}
          </div>
        );
      }
    );
    
    expectTypeOf(Card).toMatchTypeOf<Component<CardProps>>();
  });
});

describe('definePage 运行时行为', () => {
  it('应该抛出编译期错误提示', () => {
    expect(() => {
      definePage(
        { route: '/test', title: '测试' },
        () => () => <div>Test</div>
      );
    }).toThrow(/compile-time DSL primitive/);
  });
});

describe('defineComponent 运行时行为', () => {
  it('应该抛出编译期错误提示', () => {
    expect(() => {
      defineComponent(
        {},
        () => () => <div>Test</div>
      );
    }).toThrow(/compile-time DSL primitive/);
  });
});





