## 1. Environment Variables Setup

**Set up environment variables:**
*   Copy the `.env.example` file to a new file named `.env`:
*   Open the `.env` file.
*   Replace the placeholder values (e.g., `your-key`) with the test api keys. 

---

## 2. Implementing the New Rich Text Editor

Your task is to replace the existing notes editor (`<EditableNote />`) with a new rich text editor component.

### A. Location for the New Editor

*   Since the new editor might consist of multiple files, create a dedicated directory for it:
    ```
    src/components/RichTextEditor/
    ```
*   Place all files related to the new rich text editor within this directory (e.g., `RichTextEditor.tsx`, `Toolbar.tsx`, `plugins/`, etc.).

### B. Integration Point

*   The component that needs to be modified is `src/components/DocumentView.tsx`.
*   **Find the section** within the `renderTabContent` function for `case 'notes'`:
    ```tsx
    // Inside src/components/DocumentView.tsx -> renderTabContent()

    case 'notes':
      if (localNotes) {
        return (
          // --- THIS IS WHAT YOU NEED TO REPLACE ---
          <EditableNote
            content={localNotes}
            onSave={async (newContent) => {
              // ... existing save logic ...
            }}
          />
          // --- END OF REPLACEMENT TARGET ---
        );
      }
      // ... (rest of the notes tab logic for loading/generation) ...
    ```

### C. Replacing the Component

1.  **Import your main rich text editor component** into `DocumentView.tsx`. Let's assume your main component is `src/components/RichTextEditor/RichTextEditor.tsx`.
    ```tsx
    import RichTextEditor from './RichTextEditor/RichTextEditor'; // Adjust path if needed
    ```
2.  **Replace `<EditableNote ... />`** with your `<RichTextEditor ... />`.
3.  **Ensure your new editor accepts the necessary props:**
    *   `content: string`: This prop will receive the current note content (`localNotes` state variable in `DocumentView.tsx`). Your editor should display this content initially.
    *   `onSave: (newContent: string) => void`: Your editor needs to call this function whenever the user saves the content (via auto-save). Pass the updated note content as the `newContent` argument. The existing `onSave` function in `DocumentView.tsx` already handles updating the database and state.
    *   Add any other props the editor might need.


### D. Cleanup 

*   Once the new rich text editor is fully integrated and working correctly, you can **delete the old editor component file:** `src/components/EditableNote.tsx`.


