import React, { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor';
console.log("MonacoEditor", monaco.editor);
export default function Editor() {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current) {
            const value = /* set from `myEditor.getModel()`: */ `function hello() {
                alert('Hello world!');
            }`;
            const editor = monaco.editor.create(editorRef.current, {
                // value: 'console.log("Hello, world!");',
                value,
                language: "javascript",
                automaticLayout: true,
            });
        }
    }, []);
  return (
    <div>Editor
        <div ref={editorRef} style={{ width: 500, height: 600, backgroundColor: 'red' }}></div>
    </div>
  )
}
