import { createClient } from '../lib/supabase'
import { htmlToMarkdown } from '../lib/markdown-converter'

/**
 * Migration script to convert existing HTML notes to Markdown format
 * Run this script after deploying the new schema
 */
async function migrateNotesToMarkdown() {
  const supabase = createClient()
  
  console.log('Starting migration: Converting HTML notes to Markdown...')
  
  try {
    // Get all notes without format or with HTML format
    const { data: notes, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .or('format.is.null,format.eq.html')
    
    if (fetchError) {
      console.error('Error fetching notes:', fetchError)
      return
    }
    
    if (!notes || notes.length === 0) {
      console.log('No HTML notes found to migrate.')
      return
    }
    
    console.log(`Found ${notes.length} notes to migrate...`)
    
    let successCount = 0
    let errorCount = 0
    
    // Process notes in batches
    for (const note of notes) {
      try {
        // Convert HTML content to Markdown
        const markdownContent = htmlToMarkdown(note.content)
        
        // Update the note
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            content: markdownContent,
            format: 'markdown',
            updated_at: new Date().toISOString()
          })
          .eq('id', note.id)
        
        if (updateError) {
          console.error(`Error updating note ${note.id}:`, updateError)
          errorCount++
        } else {
          console.log(`✓ Migrated note: "${note.title}" (${note.id})`)
          successCount++
        }
        
        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error processing note ${note.id}:`, error)
        errorCount++
      }
    }
    
    console.log('\n--- Migration Complete ---')
    console.log(`✓ Successfully migrated: ${successCount} notes`)
    console.log(`✗ Failed migrations: ${errorCount} notes`)
    console.log(`Total processed: ${notes.length} notes`)
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

/**
 * Rollback function to convert Markdown notes back to HTML (if needed)
 */
async function rollbackMigration() {
  const supabase = createClient()
  
  console.log('Starting rollback: Converting Markdown notes back to HTML...')
  
  try {
    // This is a basic rollback - in practice, you'd want to store original HTML
    // or implement a more sophisticated HTML generation from Markdown
    console.log('Rollback functionality would need to be implemented based on requirements')
    console.log('Consider backing up data before running migrations')
  } catch (error) {
    console.error('Rollback failed:', error)
  }
}

// Export functions for use in other scripts
export { migrateNotesToMarkdown, rollbackMigration }

// If running directly
if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'migrate') {
    migrateNotesToMarkdown()
  } else if (command === 'rollback') {
    rollbackMigration()
  } else {
    console.log('Usage:')
    console.log('  npm run migrate-notes migrate   # Migrate HTML to Markdown')
    console.log('  npm run migrate-notes rollback  # Rollback migration')
  }
}
