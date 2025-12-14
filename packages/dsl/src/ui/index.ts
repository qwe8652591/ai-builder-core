/**
 * UI DSL 主导出文件
 * 
 * 导出所有 UI DSL 的响应式原语、组件定义、生命周期钩子、路由和服务调用 API。
 * 
 * @packageDocumentation
 */

// 公共类型
export type {
  ReactiveState,
  ComputedState,
  WatchOptions,
  CleanupFunction,
  EffectCallback,
  DependencyList,
  PropDefinition,
  EmitDefinition,
  RenderFunction,
  SetupContext,
  ComponentOptions,
  Component,
  PageMeta,
  Router,
  Route,
  QueryOptions,
  QueryResult,
  MutationOptions,
  MutationResult,
} from './types';

export { ReactiveMarker, ComputedMarker } from './types';

// 响应式 API
export { useState, useComputed, useWatch } from './reactive';

// 组件定义 API
export { definePage, defineComponent } from './component';

// 生命周期 API
export {
  useEffect,
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount
} from './lifecycle';

// 生命周期 API (未来实现)
// export { useEffect, onMounted, onUnmounted, onBeforeMount, onBeforeUnmount } from './lifecycle';

// 组件定义 API (未来实现)
// export { definePage, defineComponent } from './component';

// 路由 API (未来实现)
// export { useRouter, useRoute, useParams } from './router';

// 服务调用 API (未来实现)
// export { useQuery, useMutation } from './query';

