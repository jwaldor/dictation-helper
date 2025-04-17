'use client';

import { useDocumentStore } from '@/store/documentStore';
import Card from './Card';
import { ChangeEvent } from 'react';

export function Document() {
  const { content, setContent } = useDocumentStore();

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  return (
    <Card heading="Document">
      <div className="flex flex-col gap-2">
        <textarea
          className="textarea textarea-bordered w-full h-48"
          value={content}
          onChange={handleChange}
          placeholder="Your document content here..."
        />
      </div>
    </Card>
  );
}
