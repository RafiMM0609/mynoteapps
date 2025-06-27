'use client';

import React, { useState } from 'react';
import { Note } from '@/lib/supabase';

interface InnovativeNoteLinkingProps {
  notes: Note[];
  currentNoteId: string;
  onNoteSelect: (note: Note) => void;
}

export default function InnovativeNoteLinking({ 
  notes, 
  currentNoteId, 
  onNoteSelect 
}: InnovativeNoteLinkingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter out current note and filter by search term if provided
  const filteredNotes = notes
    .filter(note => note.id !== currentNoteId)
    .filter(note => 
      searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="innovative-note-linking">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search notes..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="note-links-grid grid gap-3">
        {filteredNotes.length > 0 ? (
          filteredNotes.map(note => (
            <div 
              key={note.id}
              className="note-link-card border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onNoteSelect(note)}
            >
              <h3 className="font-medium text-blue-600">{note.title}</h3>
              {note.content && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {note.content.substring(0, 100)}
                  {note.content.length > 100 && '...'}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {searchTerm ? 'No matching notes found' : 'No other notes available'}
          </div>
        )}
      </div>
    </div>
  );
}
