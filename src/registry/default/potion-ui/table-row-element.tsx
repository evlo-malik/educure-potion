'use client';

import * as React from 'react';

import {
  type PlateElementProps,
  PlateElement,
  useSelected,
} from '@udecode/plate/react';

export function TableRowElement(props: PlateElementProps) {
  const selected = useSelected();

  return (
    <PlateElement
      {...props}
      as="tr"
      className="h-full"
      data-selected={selected ? 'true' : undefined}
    />
  );
}
