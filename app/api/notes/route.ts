import { NextRequest, NextResponse } from 'next/server'
import { getAllNotes, createNote } from '@/lib/notes'

// GET /api/notes - Get all notes
export async function GET() {
  try {
    const notes = await getAllNotes()
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()
    
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const newNote = await createNote(title, content)
    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
