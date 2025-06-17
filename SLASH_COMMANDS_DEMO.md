# Slash Commands Demo

Ini adalah demo untuk fitur Slash Commands yang baru diimplementasikan.

## Cara Menggunakan

1. **Buka Editor**: Klik "Edit Note" pada salah satu catatan
2. **Ketik "/"**: Di editor, ketik karakter "/" di awal baris atau setelah spasi
3. **Pilih Command**: Dropdown akan muncul dengan berbagai opsi formatting
4. **Navigasi**: Gunakan arrow keys untuk navigasi, Enter untuk pilih, Escape untuk tutup
5. **Search**: Ketik setelah "/" untuk mencari command tertentu

## Fitur Slash Commands

### Text Formatting
- `/bold` - **Bold text**
- `/italic` - *Italic text*
- `/code` - `Inline code`
- `/codeblock` - Code block

### Headings
- `/heading1` - # Heading 1
- `/heading2` - ## Heading 2  
- `/heading3` - ### Heading 3

### Lists
- `/bulletlist` - • Bullet list
- `/numberlist` - 1. Numbered list
- `/checkbox` - ☐ Task list

### Advanced
- `/quote` - > Blockquote
- `/link` - [Link](url)
- `/table` - Table
- `/image` - ![Image](url)
- `/divider` - Horizontal line

## Keyboard Shortcuts

- **Arrow Keys**: Navigate commands
- **Enter**: Select command
- **Escape**: Close dropdown
- **Type**: Search commands
- **Backspace**: Close if cursor before "/"

## User Experience Features

- ✅ **Smart Detection**: Only shows when "/" is at line start or after space
- ✅ **Visual Feedback**: Hover effects and selection highlighting
- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Search**: Type to filter commands
- ✅ **Icons**: Visual command icons
- ✅ **Descriptions**: Helpful command descriptions
- ✅ **Shortcuts**: Shows keyboard shortcuts where available
- ✅ **Smooth Animation**: Elegant slide-in animation
- ✅ **Click Outside**: Closes when clicking outside
- ✅ **Auto-positioning**: Smart positioning near cursor

## Technical Implementation

- **React Hooks**: useState, useEffect, useRef
- **TypeScript**: Full type safety
- **Tailwind CSS**: Responsive design
- **Heroicons**: Consistent iconography
- **Keyboard Events**: Proper event handling
- **Position Calculation**: Dynamic dropdown positioning

Fitur ini membuat pengalaman menulis menjadi lebih cepat dan intuitif!
