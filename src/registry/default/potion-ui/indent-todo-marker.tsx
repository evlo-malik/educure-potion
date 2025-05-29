import type { SlateRenderElementProps } from '@udecode/plate';

import {
  useIndentTodoListElement,
  useIndentTodoListElementState,
} from '@udecode/plate-indent-list/react';

import { cn } from '@/lib/utils';

import { Checkbox } from './checkbox';

export const TodoMarker = ({
  element,
}: Omit<SlateRenderElementProps, 'children'>) => {
  const state = useIndentTodoListElementState({ element });
  const { checkboxProps } = useIndentTodoListElement(state);

  return (
    <div contentEditable={false}>
      <Checkbox
        style={{ left: -24, position: 'absolute', top: 4 }}
        {...checkboxProps}
      />
    </div>
  );
};

export const TodoLi = (props: SlateRenderElementProps) => {
  const { children, element } = props;

  return (
    <li
      className={cn(
        'list-none',
        (element.checked as boolean) && 'text-muted-foreground line-through'
      )}
    >
      {children}
    </li>
  );
};
