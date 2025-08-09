
import { Global, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';


@Injectable()
export class PubsubService implements OnModuleDestroy {
  private pubSub: PubSub;

  constructor() {
    this.pubSub = new PubSub();
  }

  async publish<T>(trigger: string, payload: T): Promise<void> {
    await this.pubSub.publish(trigger, { [trigger]: payload });
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return (this.pubSub as any).asyncIterableIterator(triggers);
  }

  onModuleDestroy() {
    // Check if close method exists before calling it
    if (typeof (this.pubSub as any).close === 'function') {
      return (this.pubSub as any).close();
    }
    return Promise.resolve();
  }
}
