import * as React from 'react';

import type { TColumnElement } from '@udecode/plate-layout';

import { type SlateElementProps, SlateElement } from '@udecode/plate';

export function ColumnElementStatic(props: SlateElementProps<TColumnElement>) {
  const { width } = props.element;

  return (
    <SlateElement
      className="border border-transparent p-1.5"
      style={{ width: width ?? '100%' }}
      {...props}
    />
  );
}
