# Slash Commands Implementation Guide

## Overview
Fitur Slash Commands telah diimplementasikan untuk memberikan pengalaman menulis yang lebih cepat dan intuitif dalam Rich Text Editor. User dapat mengetik "/" untuk membuka dropdown dengan berbagai opsi formatting.

## Technical Architecture

### Components
1. **SlashCommandDropdown.tsx** - Main dropdown component
2. **NoteEditor_new.tsx** - Editor yang sudah diupdate dengan slash commands

### Key Features Implemented

#### 1. Smart Detection
```typescript
const handleSlashCommand = (value: string, cursorPos: number) => {
  const textBeforeCursor = value.substring(0, cursorPos)
  const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
  
  // Check if slash is at beginning of line or after whitespace
  const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : '\n'
  const isValidSlashPosition = charBeforeSlash === '\n' || charBeforeSlash === ' ' || charBeforeSlash === '\t'
}
```

#### 2. Dynamic Positioning
```typescript
const calculateDropdownPosition = (textarea: HTMLTextAreaElement, cursorPos: number) => {
  const textBeforeCursor = content.substring(0, cursorPos)
  const lines = textBeforeCursor.split('\n')
  const currentLine = lines.length - 1
  const currentColumn = lines[lines.length - 1].length

  const rect = textarea.getBoundingClientRect()
  const lineHeight = 20
  const charWidth = 8

  return {
    top: rect.top + (currentLine * lineHeight) + lineHeight + 25,
    left: rect.left + (currentColumn * charWidth) + 10
  }
}
```

#### 3. Keyboard Navigation
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isVisible) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => prev < filteredCommands.length - 1 ? prev + 1 : 0)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : filteredCommands.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [isVisible, selectedIndex, filteredCommands, onSelect, onClose])
```

#### 4. Search Functionality
```typescript
const filteredCommands = allCommands.filter(command =>
  command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
  command.description.toLowerCase().includes(searchQuery.toLowerCase())
)
```

## Commands Available

### Text Formatting
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Inline Code**: `` `code` ``
- **Code Block**: ``` ```code``` ```

### Headings
- **H1**: `# Heading`
- **H2**: `## Heading`
- **H3**: `### Heading`

### Lists
- **Bullet List**: `- item`
- **Numbered List**: `1. item`
- **Checkbox**: `- [ ] task`

### Advanced
- **Quote**: `> quote`
- **Link**: `[text](url)`
- **Table**: Complete table markdown
- **Image**: `![alt](url)`
- **Divider**: `---`

## State Management

### Editor States
```typescript
// Slash command states
const [showSlashDropdown, setShowSlashDropdown] = useState(false)
const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
const [slashQuery, setSlashQuery] = useState('')
const [slashStartPos, setSlashStartPos] = useState(0)
```

### Command Selection Flow
1. User types "/" -> Detection triggered
2. Position calculated -> Dropdown positioned
3. User navigates/searches -> Commands filtered
4. User selects -> Text replaced -> Dropdown closed

## User Experience Enhancements

### Visual Design
- Clean dropdown with icons and descriptions
- Hover effects and selection highlighting
- Smooth slide-in animation
- Responsive design for all screen sizes

### Keyboard Shortcuts Display
```typescript
{command.shortcut && (
  <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
    {command.shortcut}
  </span>
)}
```

### Auto-scroll to Selected Item
```typescript
useEffect(() => {
  if (dropdownRef.current) {
    const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement
    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }
}, [selectedIndex])
```

## CSS Styling

### Custom Animations
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.slash-dropdown-enter {
  animation: slideIn 0.15s ease-out;
}
```

### Scrollbar Styling
```css
.slash-dropdown::-webkit-scrollbar {
  width: 4px;
}

.slash-dropdown::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}
```

## Testing Scenarios

### Edge Cases Handled
1. **Slash in middle of word** - Ignored
2. **Multiple slashes** - Only last one counts
3. **Backspace before slash** - Closes dropdown
4. **Click outside** - Closes dropdown
5. **Empty search results** - Handles gracefully

### Performance Optimizations
1. **Event delegation** for keyboard events
2. **Debounced search** (if needed for large command sets)
3. **Virtual scrolling** (if command list grows large)
4. **Memoization** of filtered commands

## Future Enhancements

### Possible Additions
1. **Custom Commands** - User-defined slash commands
2. **Command History** - Recently used commands
3. **Category Grouping** - Group commands by type
4. **Fuzzy Search** - Better search algorithm
5. **Command Preview** - Show preview of command result

### Integration Opportunities
1. **AI Commands** - `/ask`, `/summarize`, `/translate`
2. **Template Commands** - `/meeting-notes`, `/todo-list`
3. **Dynamic Commands** - Based on content context

## Conclusion

Fitur Slash Commands telah berhasil diimplementasikan dengan fokus pada:
- **User Experience**: Intuitif dan mudah digunakan
- **Performance**: Responsif dan smooth
- **Accessibility**: Full keyboard support
- **Extensibility**: Mudah menambah commands baru
- **Mobile-friendly**: Bekerja di semua device

Implementation ini mengikuti best practices React dan TypeScript, dengan proper state management dan event handling.
