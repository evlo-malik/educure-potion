'use client';

import * as React from 'react';

import type { TColumnElement } from '@udecode/plate-layout';

import { ResizableProvider } from '@udecode/plate-resizable';
import {
  type PlateElementProps,
  PlateElement,
  useElement,
  useReadOnly,
  withHOC,
} from '@udecode/plate/react';

import { cn } from '@/lib/utils';

export const ColumnElement = withHOC(
  ResizableProvider,
  function ColumnElement(props: PlateElementProps) {
    const readOnly = useReadOnly();
    const { width } = useElement<TColumnElement>();

    return (
      <PlateElement
        className={cn(!readOnly && 'rounded-lg border border-dashed p-1.5')}
        style={{ width: width ?? '100%' }}
        {...props}
      />
    );
  }
);
