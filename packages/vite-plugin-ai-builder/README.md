# @qwe8652591/vite-plugin

Vite plugin for ai-builder DSL transformation.

## Installation

```bash
pnpm add -D @qwe8652591/vite-plugin
```

## Usage

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aiBuilderPlugin } from '@qwe8652591/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    aiBuilderPlugin({
      debug: true, // 启用调试日志
    }),
  ],
});
```

## What it does

1. **Import Transformation**: Automatically replaces DSL imports with runtime renderer implementations
   - `@ai-builder/dsl/ui` → `@ai-builder/runtime-renderer/react`
   - `@qwe8652591/std-ui` → `@ai-builder/runtime-renderer/react`

2. **Code Simplification**: Simplifies `definePage` wrappers for development

3. **Alias Resolution**: Configures Vite resolve aliases for seamless imports

## Options

```typescript
interface AiBuilderPluginOptions {
  debug?: boolean; // 是否启用调试日志，默认 false
  importMappings?: Record<string, string>; // 自定义 import 映射
}
```

## Example

Input (`.view.tsx`):
```typescript
import { useState } from '@ai-builder/dsl/ui';
import { Button, Page } from '@qwe8652591/std-ui';

export default definePage({ title: '订单列表' }, () => {
  const [count, setCount] = useState(0);
  
  return (
    <Page title="订单">
      <Button onClick={() => setCount(count + 1)}>{count}</Button>
    </Page>
  );
});
```

Output (transformed):
```typescript
import { useState } from '@ai-builder/runtime-renderer/react';
import { Button, Page } from '@ai-builder/runtime-renderer/react';

export default function Page() {
  const [count, setCount] = useState(0);
  
  return (
    <Page title="订单">
      <Button onClick={() => setCount(count + 1)}>{count}</Button>
    </Page>
  );
}
```

## License

MIT





