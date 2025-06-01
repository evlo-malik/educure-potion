"use client";

import { useEffect, useRef, useState } from "react";
import { TElement } from "@udecode/plate-common";
import { useDebouncedCallback } from "use-debounce";
import { Plate } from "@udecode/plate/react";
import { editorPlugins } from "@/registry/default/components/editor/plugins/editor-plugins";
import { useCreateEditor } from "@/registry/default/components/editor/use-create-editor";
import { Editor, EditorContainer } from "@/registry/default/potion-ui/editor";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface RichEditorNoteProps {
  content: string;
  onSave: (newContent: string) => void;
}

const deserializePlainText = (text: string): TElement[] => [
  {
    type: "p",
    children: [{ text }],
  },
];

const parseContent = (content: string): TElement[] => {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.log("Error", e);
  }
  return deserializePlainText(content);
};

export default function RichTextEditor({
  content,
  onSave,
}: RichEditorNoteProps) {
  const [initialValue] = useState(() => parseContent(content));
  const editor = useCreateEditor({ plugins: [...editorPlugins] });

  const lastSaved = useRef(content);

  const debouncedSave = useDebouncedCallback(() => {
    const plainText = JSON.stringify(editor.children);
    if (plainText !== lastSaved.current) {
      onSave(plainText);
      lastSaved.current = plainText;
    }
  }, 2000);

  useEffect(() => {
    editor.children = initialValue;
  }, [editor, initialValue]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate
        editor={editor}
        onValueChange={() => {
          debouncedSave();
        }}
      >
        <EditorContainer>
          <Editor />
        </EditorContainer>
      </Plate>
    </DndProvider>
  );
}
