'use client'

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance, Props } from 'tippy.js'
// import SlashCommandsList from './SlashCommandsList'
import React from 'react'

export interface SlashCommandItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  keywords: string[]
  action: (editor: any) => void
}

interface SlashCommandState {
  query: string
  range: { from: number; to: number } | null
  decorationSet: DecorationSet
}

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      char: '/',
    }
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('slashCommand')
    let popup: Instance<Props>[] | null = null
    let component: ReactRenderer | null = null

    const hideMenu = () => {
      if (popup) {
        popup.forEach(instance => instance.destroy())
        popup = null
      }
      if (component) {
        component.destroy()
        component = null
      }
    }

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init(): SlashCommandState {
            return {
              query: '',
              range: null,
              decorationSet: DecorationSet.empty
            }
          },
          apply(tr, oldState, oldDoc, newState): SlashCommandState {
            const { selection, doc } = newState
            const { from } = selection

            // Get text before cursor
            const $from = doc.resolve(from)
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 20),
              $from.parentOffset,
              null,
              '\ufffc'
            )

            // Check for slash command
            const match = textBefore.match(/\/([a-zA-Z0-9]*)?$/)

            if (match) {
              const query = match[1] || ''
              const range = {
                from: from - match[0].length,
                to: from
              }

              return {
                query,
                range,
                decorationSet: DecorationSet.empty
              }
            }

            return {
              query: '',
              range: null,
              decorationSet: DecorationSet.empty
            }
          }
        },
        view: () => ({
          update: (view, prevState) => {
            const state = pluginKey.getState(view.state)
            const prevPluginState = pluginKey.getState(prevState)

            if (state?.range && state.query !== undefined) {
              // Show menu
              if (!component) {
                component = new ReactRenderer(SlashCommandsList, {
                  props: {
                    query: state.query,
                    onSelect: (item: SlashCommandItem) => {
                      if (state.range) {
                        // Remove the slash command text
                        const tr = view.state.tr
                        tr.delete(state.range.from, state.range.to)
                        
                        // Apply the transaction first
                        view.dispatch(tr)
                        
                        // Then execute the command
                        setTimeout(() => {
                          item.action(this.editor)
                        }, 0)
                      }
                      hideMenu()
                    },
                    onEscape: () => {
                      hideMenu()
                    },
                    editor: this.editor
                  },
                  editor: this.editor,
                })

                popup = tippy('body', {
                  getReferenceClientRect: () => {
                    const { from } = view.state.selection
                    const start = view.coordsAtPos(from)
                    return new DOMRect(start.left, start.top, 0, 0)
                  },
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                  theme: 'light',
                  maxWidth: 320,
                  offset: [0, 8],
                })
              } else if (state.query !== prevPluginState?.query) {
                // Update query
                component.updateProps({ query: state.query })
              }
            } else {
              // Hide menu
              hideMenu()
            }
          },
          destroy: () => {
            hideMenu()
          }
        })
      })
    ]
  }
})

export default SlashCommandExtension
