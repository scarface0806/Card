declare module "lru-cache" {
  export default class LRU<K, V> {
    constructor(options: {
      max?: number;
      ttl?: number;
      [key: string]: any;
    });
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
  }
}
