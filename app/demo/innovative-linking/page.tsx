'use client';

import React from 'react';
import InnovativeNoteLinking from '@/components/InnovativeNoteLinking';
import { Note } from '@/lib/supabase';

export default function InnovativeLinkingDemo() {
  // Sample notes for demo
  const demoNotes: Note[] = [
    { id: '1', title: 'Getting Started', content: 'This is a demo of innovative note linking.', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 'demo', is_folder: false, sort_order: 0, parent_id: null },
    { id: '2', title: 'Advanced Features', content: 'Explore advanced features of the app.', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 'demo', is_folder: false, sort_order: 1, parent_id: null },
    { id: '3', title: 'Tips & Tricks', content: 'Useful tips and tricks for productivity.', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 'demo', is_folder: false, sort_order: 2, parent_id: null },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Innovative Note Linking Demo</h1>
      <p className="mb-4">This is a demonstration of the innovative note linking feature.</p>
      
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <InnovativeNoteLinking 
          notes={demoNotes} 
          currentNoteId="1"
          onNoteSelect={() => {}}
        />
      </div>
    </div>
  );
}
