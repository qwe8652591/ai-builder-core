import { EventBus } from '@ai-builder/dsl';

type Handler = (event: any) => Promise<void> | void;

export class LocalEventBus implements EventBus {
  private handlers = new Map<string, Set<Handler>>();
  private wildcardHandlers = new Set<Handler>(); // For '*'
  // For 'order.*', we store them in a list of regex patterns
  private patternHandlers = new Map<string, { regex: RegExp, handlers: Set<Handler> }>();

  async publish(event: any): Promise<void> {
    const topic = event.constructor.name; // Use class name as topic by default
    const promises: Promise<void>[] = [];

    // 1. Exact match
    if (this.handlers.has(topic)) {
      this.handlers.get(topic)!.forEach(h => promises.push(Promise.resolve(h(event))));
    }

    // 2. Wildcard '*'
    this.wildcardHandlers.forEach(h => promises.push(Promise.resolve(h(event))));

    // 3. Pattern match (e.g. 'Order.*' matches 'OrderCreated')
    this.patternHandlers.forEach(({ regex, handlers }) => {
      if (regex.test(topic)) {
        handlers.forEach(h => promises.push(Promise.resolve(h(event))));
      }
    });

    await Promise.all(promises);
  }

  subscribe(topic: string, handler: Handler): void {
    if (topic === '*') {
      this.wildcardHandlers.add(handler);
      return;
    }

    if (topic.includes('*')) {
      // Pattern subscription
      if (!this.patternHandlers.has(topic)) {
        // Convert 'Order.*' to /^Order\..+$/
        const regexStr = '^' + topic.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
        this.patternHandlers.set(topic, {
          regex: new RegExp(regexStr),
          handlers: new Set()
        });
      }
      this.patternHandlers.get(topic)!.handlers.add(handler);
      return;
    }

    // Exact match
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);
  }

  unsubscribe(topic: string, handler: Handler): void {
    if (topic === '*') {
      this.wildcardHandlers.delete(handler);
      return;
    }

    if (this.patternHandlers.has(topic)) {
      this.patternHandlers.get(topic)!.handlers.delete(handler);
      if (this.patternHandlers.get(topic)!.handlers.size === 0) {
        this.patternHandlers.delete(topic);
      }
      return;
    }

    if (this.handlers.has(topic)) {
      this.handlers.get(topic)!.delete(handler);
      if (this.handlers.get(topic)!.size === 0) {
        this.handlers.delete(topic);
      }
    }
  }
}






