/**
 * TypeScript 类型扩展
 * 为第三方库添加缺失的类型定义
 */

import type { ModalFuncProps } from 'antd';
import type React from 'react';

declare module '@ai-builder/std-ui' {
  /**
   * Modal 组件的静态方法
   */
  export interface ModalStatic extends React.FC<import('@ai-builder/ui-types/components').ModalProps> {
    confirm: (config: ModalFuncProps) => {
      destroy: () => void;
      update: (config: ModalFuncProps) => void;
    };
    info: (config: ModalFuncProps) => {
      destroy: () => void;
      update: (config: ModalFuncProps) => void;
    };
    success: (config: ModalFuncProps) => {
      destroy: () => void;
      update: (config: ModalFuncProps) => void;
    };
    error: (config: ModalFuncProps) => {
      destroy: () => void;
      update: (config: ModalFuncProps) => void;
    };
    warning: (config: ModalFuncProps) => {
      destroy: () => void;
      update: (config: ModalFuncProps) => void;
    };
  }
}

