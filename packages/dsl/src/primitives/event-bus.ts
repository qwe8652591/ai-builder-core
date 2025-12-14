/**
 * 事件处理器类型
 */
export type EventHandler<E> = (event: E) => Promise<void> | void;

/**
 * 事件总线接口
 */
export interface EventBus {
  publish(event: any): Promise<void>;
  subscribe<E>(eventType: { new(...args: any[]): E } | string, handler: EventHandler<E>): void;
  unsubscribe<E>(eventType: { new(...args: any[]): E } | string, handler: EventHandler<E>): void;
}

export declare const EventBus: EventBus;






