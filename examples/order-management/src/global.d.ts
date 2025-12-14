/**
 * 全局类型声明
 * 
 * 这里只声明我们的虚拟 UI 组件，不支持原生 HTML 标签。
 * 强制开发者使用标准 UI 组件，确保代码可以被编译器正确转换。
 */

// 支持 JSX 语法
declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}

