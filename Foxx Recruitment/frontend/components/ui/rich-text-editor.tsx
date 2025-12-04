"use client";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    return (
        <div className="bg-white">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="h-64 mb-12" // mb-12 to account for toolbar and height
            />
        </div>
    );
}
