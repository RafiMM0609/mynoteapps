// Type declarations for modules without official types

declare module 'turndown' {
  interface Options {
    headingStyle?: 'setext' | 'atx'
    hr?: string
    bulletListMarker?: '-' | '+' | '*'
    codeBlockStyle?: 'indented' | 'fenced'
    fence?: '```' | '~~~'
    emDelimiter?: '_' | '*'
    strongDelimiter?: '__' | '**'
    linkStyle?: 'inlined' | 'referenced'
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut'
    preformattedCode?: boolean
  }

  interface Rule {
    filter: string | string[] | ((node: HTMLElement) => boolean)
    replacement: (content: string, node?: HTMLElement) => string
  }

  class TurndownService {
    constructor(options?: Options)
    turndown(html: string): string
    addRule(key: string, rule: Rule): this
    keep(filter: string | string[] | ((node: HTMLElement) => boolean)): this
    remove(filter: string | string[] | ((node: HTMLElement) => boolean)): this
    escape(string: string): string
  }

  export = TurndownService
}

declare module '@uiw/react-md-editor' {
  import { ComponentProps } from 'react'
  
  interface MDEditorProps {
    value?: string
    onChange?: (value?: string) => void
    preview?: 'edit' | 'live' | 'preview'
    hideToolbar?: boolean
    height?: number
    className?: string
    'data-color-mode'?: 'light' | 'dark'
  }

  const MDEditor: React.FC<MDEditorProps>
  export default MDEditor
}
