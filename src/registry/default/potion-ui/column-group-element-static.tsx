import * as React from 'react';

import { type SlateElementProps, SlateElement } from '@udecode/plate';

export function ColumnGroupElementStatic(props: SlateElementProps) {
  return (
    <SlateElement className="my-2" {...props}>
      <div className="flex size-full gap-4 rounded">{props.children}</div>
    </SlateElement>
  );
}
