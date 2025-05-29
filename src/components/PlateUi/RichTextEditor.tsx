"use client";

import { useRef } from "react";
import { TElement, getNodeString } from "@udecode/plate-common";
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

export default function RichTextEditor({
  content,
  onSave,
}: RichEditorNoteProps) {
  const editor = useCreateEditor({
    plugins: [...editorPlugins],
  });

  const initialValue = deserializePlainText(content);
  editor.children = initialValue;

  const lastSaved = useRef(content);

  const debouncedSave = useDebouncedCallback(() => {
    const plainText = editor.children.map(getNodeString).join("\n").trim();
    if (plainText !== lastSaved.current) {
      onSave(plainText);
      lastSaved.current = plainText;
    }
  }, 2000);

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
