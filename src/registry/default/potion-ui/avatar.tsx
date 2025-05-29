"use client";

import * as React from "react";

import type { VariantProps } from "class-variance-authority";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva("relative flex shrink-0 overflow-hidden", {
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  variants: {
    size: {
      default: "size-10",
      lg: "size-12",
      profile: "size-20",
      settings: "size-20 md:size-28",
      sm: "size-6",
    },
    variant: {
      default: "rounded-full",
    },
  },
});

type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>;

type AvatarImageProps = {
  className?: string;
  onLoadingStatusChange?: (
    status: "idle" | "loading" | "loaded" | "error"
  ) => void;
  src: string;
  alt?: string;
};
function Avatar({ className, size, variant, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(avatarVariants({ size, variant }), className)}
      data-slot="avatar"
      {...props}
    />
  );
}

function AvatarImage({
  className,
  onLoadingStatusChange,
  src,
  alt = "",
  ...props
}: AvatarImageProps & React.ImgHTMLAttributes<HTMLImageElement>) {
  const handleLoad = () => {
    onLoadingStatusChange?.("loaded");
  };

  const handleError = () => {
    onLoadingStatusChange?.("error");
  };

  return (
    <AvatarPrimitive.Image
      asChild
      data-slot="avatar-image"
      onLoadingStatusChange={onLoadingStatusChange}
      src={src}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          "aspect-square w-full h-full object-cover select-none",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </AvatarPrimitive.Image>
  );
}

const avatarFallbackVariants = cva(
  "box-content flex size-full items-center justify-center",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "rounded-full bg-muted",
      },
    },
  }
);

type AvatarFallbackProps = React.ComponentProps<
  typeof AvatarPrimitive.Fallback
> &
  VariantProps<typeof avatarFallbackVariants>;

function AvatarFallback({ className, variant, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(avatarFallbackVariants({ variant }), className)}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
