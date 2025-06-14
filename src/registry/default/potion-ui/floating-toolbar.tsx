"use client";

import * as React from "react";

import { AIChatPlugin } from "@udecode/plate-ai/react";
import {
  type FloatingToolbarState,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloatingToolbar,
  useFloatingToolbarState,
} from "@udecode/plate-floating";
import { LinkPlugin } from "@udecode/plate-link/react";
import { BlockSelectionPlugin } from "@udecode/plate-selection/react";
import {
  useComposedRef,
  useEditorRef,
  useEventEditorValue,
  usePluginOption,
} from "@udecode/plate/react";

import { cn } from "@/lib/utils";
import { Toolbar } from "./toolbar";

export const FloatingToolbar = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    state?: FloatingToolbarState;
  }> &
    React.ComponentProps<typeof Toolbar>
>(function FloatingToolbar({ children, state, ...props }, ref) {
  const editor = useEditorRef();
  const focusedEditorId = useEventEditorValue("focus");
  const isFloatingLinkOpen = !!usePluginOption(LinkPlugin, "mode");
  const aiOpen = usePluginOption(AIChatPlugin, "open");
  const isSelectingSomeBlocks = usePluginOption(
    BlockSelectionPlugin,
    "isSelectingSome"
  );

  const floatingToolbarState = useFloatingToolbarState({
    editorId: editor.id,
    focusedEditorId,
    hideToolbar: aiOpen || isFloatingLinkOpen || isSelectingSomeBlocks,
    ...state,
    floatingOptions: {
      middleware: [
        offset({
          crossAxis: -24,
          mainAxis: 12,
        }),
        shift({ padding: 50 }),
        flip({
          fallbackPlacements: [
            "top-start",
            "top-end",
            "bottom-start",
            "bottom-end",
          ],
          padding: 12,
        }),
      ],
      placement: "top-start",
      ...state?.floatingOptions,
    },
  });

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  const composedRef = useComposedRef<HTMLDivElement>(floatingRef, ref);

  if (hidden) return null;

  return (
    <div ref={clickOutsideRef}>
      <Toolbar
        ref={composedRef}
        className={cn(
          "absolute z-50 animate-zoom rounded-lg bg-popover p-1 whitespace-nowrap opacity-100 shadow-toolbar print:hidden",
          "scrollbar-hide max-w-[80vw] overflow-x-auto"
        )}
        {...rootProps}
        {...props}
      >
        {children}
      </Toolbar>
    </div>
  );
});
