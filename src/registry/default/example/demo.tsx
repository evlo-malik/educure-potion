import { Plate } from "@udecode/plate/react";

import { editorPlugins } from "@/registry/default/components/editor/plugins/editor-plugins";
import { useCreateEditor } from "@/registry/default/components/editor/use-create-editor";
import { DEMO_VALUES } from "@/registry/default/example/demo-values";
import { Editor, EditorContainer } from "@/registry/default/potion-ui/editor";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function Demo({ id }: { id: keyof typeof DEMO_VALUES }) {
  const editor = useCreateEditor({
    plugins: [...editorPlugins],
    value: DEMO_VALUES[id],
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate editor={editor}>
        <EditorContainer variant="demo">
          <Editor variant="demo" />
        </EditorContainer>
      </Plate>
    </DndProvider>
  );
}
