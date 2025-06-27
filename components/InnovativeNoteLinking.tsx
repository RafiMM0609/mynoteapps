'use client';

import React, { useState, useEffect } from 'react';
import { Note } from '@/lib/supabase';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

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
  const [activeCard, setActiveCard] = useState<string | null>(null);
  
  // Use our mobile optimization hook
  const { 
    isMobile, 
    touchActive,
    swipeGesture,
    attachTouchHandlers,
    containerRef
  } = useMobileOptimization({
    enableSwipeGestures: true,
    swipeThreshold: 40
  });
  
  // Filter out current note and filter by search term if provided
  const filteredNotes = notes
    .filter(note => note.id !== currentNoteId)
    .filter(note => 
      searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
  // Attach touch handlers to container
  useEffect(() => {
    const element = containerRef.current as HTMLDivElement;
    if (element) {
      const cleanup = attachTouchHandlers(element);
      return cleanup;
    }
  }, [attachTouchHandlers]);
  
  // Touch feedback for better mobile UX
  const handleTouchStart = (noteId: string) => {
    setActiveCard(noteId);
  };
  
  const handleTouchEnd = () => {
    setActiveCard(null);
  };

  return (
    <div 
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`innovative-note-linking ${isMobile ? 'is-mobile' : ''}`}
    >
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search notes..."
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isMobile ? 'text-base p-3' : ''
          }`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="note-links-grid grid gap-3">
        {filteredNotes.length > 0 ? (
          filteredNotes.map(note => (
            <div 
              key={note.id}
              className={`note-link-card border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                isMobile ? 'touch-target p-4' : ''
              } ${activeCard === note.id ? 'bg-gray-50' : ''}`}
              onClick={() => onNoteSelect(note)}
              onTouchStart={() => handleTouchStart(note.id)}
              onTouchEnd={handleTouchEnd}
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
