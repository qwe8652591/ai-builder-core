import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  useEffect,
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount
} from '../../src/ui/lifecycle';
import type { CleanupFunction } from '../../src/ui/types';

describe('useEffect 类型推导', () => {
  it('应该接受无返回值的副作用函数', () => {
    useEffect(() => {
      console.log('副作用');
    });
  });
  
  it('应该接受返回清理函数的副作用', () => {
    useEffect(() => {
      const timer = setInterval(() => {}, 1000);
      
      return () => {
        clearInterval(timer);
      };
    });
  });
  
  it('应该接受使用 onCleanup 的副作用', () => {
    useEffect((onCleanup) => {
      const subscription = { unsubscribe: () => {} };
      
      onCleanup(() => {
        subscription.unsubscribe();
      });
      
      expectTypeOf(onCleanup).toBeFunction();
      expectTypeOf(onCleanup).parameter(0).toMatchTypeOf<CleanupFunction>();
    });
  });
  
  it('应该支持异步副作用函数', () => {
    useEffect(async () => {
      await fetch('/api/data');
      console.log('数据加载完成');
    });
  });
  
  it('应该支持异步副作用并返回清理函数', () => {
    useEffect(async () => {
      const data = await fetch('/api/data');
      console.log(data);
      
      // 异步函数不能直接返回清理函数，需要使用 onCleanup
      // return () => {}; // 这会导致类型错误
    });
  });
  
  it('应该支持异步副作用使用 onCleanup', () => {
    useEffect(async (onCleanup) => {
      const controller = new AbortController();
      
      onCleanup(() => {
        controller.abort();
      });
      
      await fetch('/api/data', { signal: controller.signal });
    });
  });
  
  it('应该接受空依赖数组', () => {
    useEffect(() => {
      console.log('只执行一次');
    }, []);
  });
  
  it('应该接受依赖数组', () => {
    const userId = 'user123';
    const count = 42;
    
    useEffect(() => {
      console.log('用户或计数变化');
    }, [userId, count]);
  });
  
  it('应该接受只读依赖数组', () => {
    const deps = [1, 2, 3] as const;
    
    useEffect(() => {
      console.log('依赖变化');
    }, deps);
  });
  
  it('应该支持复杂的副作用场景', () => {
    interface User {
      id: string;
      name: string;
    }
    
    const user: User = { id: '1', name: 'Alice' };
    
    useEffect((onCleanup) => {
      let cancelled = false;
      
      onCleanup(() => {
        cancelled = true;
      });
      
      // 模拟异步操作
      setTimeout(() => {
        if (!cancelled) {
          console.log('加载用户数据:', user.name);
        }
      }, 100);
    }, [user.id]);
  });
});

describe('清理函数类型验证', () => {
  it('清理函数应该不接受参数', () => {
    const cleanup: CleanupFunction = () => {
      console.log('清理');
    };
    
    expectTypeOf(cleanup).toBeFunction();
    expectTypeOf(cleanup).parameters.toEqualTypeOf<[]>();
    expectTypeOf(cleanup).returns.toBeVoid();
  });
  
  it('清理函数不应该返回值', () => {
    useEffect(() => {
      return () => {
        // 正确：无返回值
      };
    });
    
    // 编译时错误（取消注释应该报错）:
    // useEffect(() => {
    //   return () => {
    //     return 'value'; // ❌ 不能返回值
    //   };
    // });
  });
  
  it('onCleanup 应该接受 CleanupFunction', () => {
    useEffect((onCleanup) => {
      const cleanup: CleanupFunction = () => {
        console.log('清理');
      };
      
      onCleanup(cleanup);
    });
  });
  
  it('应该支持多次调用 onCleanup', () => {
    useEffect((onCleanup) => {
      onCleanup(() => console.log('清理 1'));
      onCleanup(() => console.log('清理 2'));
      onCleanup(() => console.log('清理 3'));
    });
  });
});

describe('onMounted 类型推导', () => {
  it('应该接受无返回值的回调', () => {
    onMounted(() => {
      console.log('组件已挂载');
    });
  });
  
  it('应该接受返回清理函数的回调', () => {
    onMounted(() => {
      const timer = setInterval(() => {}, 1000);
      
      return () => {
        clearInterval(timer);
      };
    });
  });
  
  it('应该支持异步回调', () => {
    onMounted(async () => {
      await fetch('/api/init');
      console.log('初始化完成');
    });
  });
  
  it('应该支持异步回调返回清理函数', () => {
    onMounted(async () => {
      const data = await fetch('/api/init');
      console.log(data);
      
      return () => {
        console.log('清理');
      };
    });
  });
  
  it('应该用于 DOM 操作', () => {
    interface ChartInstance {
      destroy: () => void;
    }
    
    onMounted(() => {
      const chart: ChartInstance = {
        destroy: () => console.log('销毁图表')
      };
      
      return () => {
        chart.destroy();
      };
    });
  });
});

describe('onUnmounted 类型推导', () => {
  it('应该接受无返回值的回调', () => {
    onUnmounted(() => {
      console.log('组件即将卸载');
    });
  });
  
  it('应该支持异步回调', () => {
    onUnmounted(async () => {
      await saveState();
      console.log('状态已保存');
    });
  });
  
  it('应该用于资源清理', () => {
    const timer = setInterval(() => {}, 1000);
    
    onUnmounted(() => {
      clearInterval(timer);
    });
  });
  
  it('应该用于取消订阅', () => {
    interface Subscription {
      unsubscribe: () => void;
    }
    
    const subscription: Subscription = {
      unsubscribe: () => console.log('取消订阅')
    };
    
    onUnmounted(() => {
      subscription.unsubscribe();
    });
  });
});

describe('onBeforeMount 类型推导', () => {
  it('应该接受无返回值的回调', () => {
    onBeforeMount(() => {
      console.log('组件即将挂载');
    });
  });
  
  it('应该支持异步回调', () => {
    onBeforeMount(async () => {
      await prepareData();
      console.log('数据准备完成');
    });
  });
  
  it('应该用于预加载数据', () => {
    interface Data {
      items: string[];
    }
    
    onBeforeMount(async () => {
      const data: Data = await loadInitialData();
      console.log('预加载数据:', data.items.length);
    });
  });
});

describe('onBeforeUnmount 类型推导', () => {
  it('应该接受无返回值的回调', () => {
    onBeforeUnmount(() => {
      console.log('组件即将卸载');
    });
  });
  
  it('应该支持异步回调', () => {
    onBeforeUnmount(async () => {
      await cleanup();
      console.log('清理完成');
    });
  });
  
  it('应该用于卸载前确认', () => {
    const hasUnsavedChanges = true;
    
    onBeforeUnmount(() => {
      if (hasUnsavedChanges) {
        const confirmed = confirm('有未保存的更改，确定离开吗？');
        if (!confirmed) {
          throw new Error('User cancelled');
        }
      }
    });
  });
});

describe('生命周期钩子运行时行为', () => {
  it('useEffect 应该抛出编译期错误提示', () => {
    expect(() => {
      useEffect(() => {});
    }).toThrow(/compile-time DSL primitive/);
  });
  
  it('onMounted 应该抛出编译期错误提示', () => {
    expect(() => {
      onMounted(() => {});
    }).toThrow(/compile-time DSL primitive/);
  });
  
  it('onUnmounted 应该抛出编译期错误提示', () => {
    expect(() => {
      onUnmounted(() => {});
    }).toThrow(/compile-time DSL primitive/);
  });
  
  it('onBeforeMount 应该抛出编译期错误提示', () => {
    expect(() => {
      onBeforeMount(() => {});
    }).toThrow(/compile-time DSL primitive/);
  });
  
  it('onBeforeUnmount 应该抛出编译期错误提示', () => {
    expect(() => {
      onBeforeUnmount(() => {});
    }).toThrow(/compile-time DSL primitive/);
  });
});

// 辅助函数（仅用于类型测试）
function saveState(): Promise<void> {
  return Promise.resolve();
}

function prepareData(): Promise<void> {
  return Promise.resolve();
}

function cleanup(): Promise<void> {
  return Promise.resolve();
}

function loadInitialData(): Promise<{ items: string[] }> {
  return Promise.resolve({ items: [] });
}





