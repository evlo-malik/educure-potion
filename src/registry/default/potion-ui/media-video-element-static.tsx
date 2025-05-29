import * as React from 'react';

import type { TCaptionElement } from '@udecode/plate-caption';
import type { TVideoElement } from '@udecode/plate-media';

import { type SlateElementProps, NodeApi, SlateElement } from '@udecode/plate';

import { cn } from '@/lib/utils';

export function MediaVideoElementStatic(
  props: SlateElementProps<TVideoElement & TCaptionElement & { width: number }>
) {
  const { align = 'center', caption, url, width } = props.element;

  return (
    <SlateElement className="py-2.5" {...props}>
      <div style={{ textAlign: align }}>
        <figure
          className="group relative m-0 inline-block cursor-default"
          style={{ width }}
        >
          <video
            className={cn('w-full max-w-full object-cover px-0', 'rounded-sm')}
            src={url}
            controls
          />
          {caption && <figcaption>{NodeApi.string(caption[0])}</figcaption>}
        </figure>
      </div>
      {props.children}
    </SlateElement>
  );
}
