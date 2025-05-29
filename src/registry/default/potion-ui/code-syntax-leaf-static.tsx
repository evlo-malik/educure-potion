import * as React from 'react';

import type { SlateLeafProps } from '@udecode/plate';

import { SlateLeaf } from '@udecode/plate';

export function CodeSyntaxLeafStatic(props: SlateLeafProps) {
  const tokenClassName = props.leaf.className as string;

  return <SlateLeaf {...props} className={tokenClassName} />;
}
