"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// Potion-only
// import { trpc } from '@/lib/trpc/react';
import { nanoid } from "@udecode/plate";
import { setMediaNode } from "@udecode/plate-media";
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  PlaceholderPlugin,
  usePlaceholderPopoverState,
  VideoPlugin,
} from "@udecode/plate-media/react";
import { useEditorPlugin } from "@udecode/plate/react";
import { useFilePicker } from "use-file-picker";

// Potion-only
// import { useDocumentId } from '@/lib/navigation/routes';
import { useUploadFile } from "../components/editor/uploadthing-app";

import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const MEDIA_CONFIG: Record<
  string,
  {
    accept: string[];
    buttonText: string;
    embedText: string;
  }
> = {
  [AudioPlugin.key]: {
    accept: ["audio/*"],
    buttonText: "Upload Audio",
    embedText: "Embed audio",
  },
  [FilePlugin.key]: {
    accept: ["*"],
    buttonText: "Choose a file",
    embedText: "Embed file",
  },
  [ImagePlugin.key]: {
    accept: ["image/*"],
    buttonText: "Upload file",
    embedText: "Embed image",
  },
  [VideoPlugin.key]: {
    accept: ["video/*"],
    buttonText: "Upload video",
    embedText: "Embed video",
  },
};

export interface MediaPopoverProps {
  children: React.ReactNode;
}

export const MediaPlaceholderPopover = ({ children }: MediaPopoverProps) => {
  const { api, editor, getOption, tf } = useEditorPlugin(PlaceholderPlugin);

  const {
    id,
    element,
    mediaType,
    readOnly,
    selected,
    setIsUploading,
    setProgresses,
    setUpdatedFiles,
    size,
  } = usePlaceholderPopoverState();
  const [open, setOpen] = useState(false);

  // Potion-only
  // const documentId = useDocumentId();
  // const createFile = trpc.file.createFile.useMutation();

  const currentMedia = MEDIA_CONFIG[mediaType];

  // const mediaConfig = api.placeholder.getMediaConfig(mediaType as MediaKeys);
  const multiple = getOption("multiple") ?? true;

  const { isUploading, progress, uploadedFile, uploadFile, uploadingFile } =
    useUploadFile({
      onUploadComplete() {
        try {
          // Potion-only
          // createFile.mutate({
          //   id: file.key,
          //   appUrl: file.appUrl,
          //   documentId: documentId,
          //   size: file.size,
          //   type: file.type,
          //   url: file.url,
          // });
        } catch (error) {
          console.error(error, "error");
        }
      },
    });

  const replaceCurrentPlaceholder = useCallback(
    (file: File) => {
      setUpdatedFiles([file]);
      void uploadFile(file);
      api.placeholder.addUploadingFile(element.id as string, file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [element.id]
  );

  /** Open file picker */
  const { openFilePicker } = useFilePicker({
    accept: currentMedia.accept,
    multiple,
    onFilesSelected: ({ plainFiles: updatedFiles }) => {
      const firstFile = updatedFiles[0];
      const restFiles = updatedFiles.slice(1);

      replaceCurrentPlaceholder(firstFile);

      restFiles.length > 0 && tf.insert.media(restFiles);
    },
  });

  // React dev mode will call useEffect twice
  const isReplaced = useRef(false);
  /** Paste and drop */
  useEffect(() => {
    if (isReplaced.current) return;

    isReplaced.current = true;
    const currentFiles = api.placeholder.getUploadingFile(element.id as string);

    if (!currentFiles) return;

    replaceCurrentPlaceholder(currentFiles);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReplaced]);

  useEffect(() => {
    if (!uploadedFile) return;

    const path = editor.api.findPath(element);

    setMediaNode(
      editor,
      {
        id: nanoid(),
        initialHeight: size?.height,
        initialWidth: size?.width,
        isUpload: true,
        name: mediaType === FilePlugin.key ? uploadedFile.name : "",
        placeholderId: element.id as string,
        type: mediaType!,
        url: uploadedFile.url,
      },
      { at: path }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFile, element.id, size]);

  const [embedValue, setEmbedValue] = useState("");

  const onEmbed = useCallback(
    (value: string) => {
      setMediaNode(editor, {
        type: mediaType,
        url: value,
      });
    },
    [editor, mediaType]
  );

  useEffect(() => {
    setOpen(selected);
  }, [selected, setOpen]);

  useEffect(() => {
    if (isUploading) {
      setOpen(false);
    }
  }, [isUploading]);

  useEffect(() => {
    setProgresses({ [uploadingFile?.name ?? ""]: progress });
    setIsUploading(isUploading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, progress, isUploading, uploadingFile]);

  if (readOnly) return <>{children}</>;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        variant="media"
        className="flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Tabs className="w-full shrink-0" defaultValue="account">
          <TabsList className="px-2" onMouseDown={(e) => e.preventDefault()}>
            <TabsTrigger value="account">Upload</TabsTrigger>
            <TabsTrigger value="password">Embed link</TabsTrigger>
          </TabsList>
          <TabsContent className="w-[300px] px-3 py-2" value="account">
            <Button variant="brand" className="w-full" onClick={openFilePicker}>
              {currentMedia.buttonText}
            </Button>
            <div className="mt-3 text-xs text-muted-foreground">
              The maximum size per file is 5MB
            </div>
          </TabsContent>

          <TabsContent
            className="w-[300px] px-3 pt-2 pb-3 text-center"
            value="password"
          >
            <Input
              value={embedValue}
              onChange={(e) => setEmbedValue(e.target.value)}
              placeholder="Paste the link..."
            />

            <Button
              variant="brand"
              className="mt-2 w-full max-w-[300px]"
              onClick={() => onEmbed(embedValue)}
            >
              {currentMedia.embedText}
            </Button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
