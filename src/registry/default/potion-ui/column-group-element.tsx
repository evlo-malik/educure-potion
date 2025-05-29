'use client';

import * as React from 'react';

import { type PlateElementProps, PlateElement } from '@udecode/plate/react';

export function ColumnGroupElement(props: PlateElementProps) {
  return (
    <PlateElement className="mb-1" {...props}>
      <div className="flex size-full gap-4 rounded">{props.children}</div>
    </PlateElement>
  );
}
