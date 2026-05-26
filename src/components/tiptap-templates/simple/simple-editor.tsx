"use client"

import { Extension } from "@tiptap/core"
import { Code2, FileCode2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { JSONContent } from "@tiptap/react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import type { Editor } from "@tiptap/react"
import { keymap } from "@tiptap/pm/keymap"
import { NodeSelection, TextSelection } from "@tiptap/pm/state"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image as TiptapImage } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Placeholder } from "@tiptap/extension-placeholder"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { GalleryNode } from "@/components/tiptap-node/gallery-node/gallery-node-extension"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { ImagesIcon } from "@/components/tiptap-icons/images-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { CodeBlockLowlightWithControls } from "@/lib/code-block-lowlight-with-controls"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

const MainToolbarContent = ({
  editor,
  onHighlighterClick,
  onLinkClick,
  isMobile,
  showThemeToggle,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  showThemeToggle: boolean
}) => {
  return (
    <>
      <ToolbarGroup>
        <UndoRedoButton editor={editor} action="undo" />
        <UndoRedoButton editor={editor} action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu editor={editor} modal={false} levels={[2, 3, 4]} />
        <ListDropdownMenu
          editor={editor}
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton editor={editor} />
        <CodeBlockButton editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton editor={editor} type="bold" />
        <MarkButton editor={editor} type="italic" />
        <MarkButton editor={editor} type="strike" />
        <MarkButton editor={editor} type="underline" />
        {!isMobile ? <LinkPopover editor={editor} /> : <LinkButton onClick={onLinkClick} />}
        <MarkButton editor={editor} type="code" />
        {!isMobile ? (
          <ColorHighlightPopover editor={editor} />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton
          editor={editor}
          uploadOptions={{ limit: 1, outputType: "image" }}
        />
        <ImageUploadButton
          editor={editor}
          icon={ImagesIcon}
          label="添加图册"
          uploadOptions={{ limit: 12, outputType: "gallery" }}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton editor={editor} align="left" />
        <TextAlignButton editor={editor} align="center" />
        <TextAlignButton editor={editor} align="right" />
        <TextAlignButton editor={editor} align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton editor={editor} type="superscript" />
        <MarkButton editor={editor} type="subscript" />
      </ToolbarGroup>

      {showThemeToggle ? (
        <>
          <Spacer />
          {isMobile && <ToolbarSeparator />}
        </>
      ) : null}
    </>
  )
}

const MobileToolbarContent = ({
  editor,
  type,
  onBack,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent editor={editor} />
    ) : (
      <LinkContent editor={editor} />
    )}
  </>
)

const ImageAltEditor = ({ editor }: { editor: Editor }) => {
  const [mode, setMode] = useState<"image" | "gallery" | null>(null)
  const [altValue, setAltValue] = useState("")
  const [gallerySelection, setGallerySelection] = useState<{
    pos: number
    index: number
    alt: string
  } | null>(null)

  useEffect(() => {
    const syncFromSelection = () => {
      const active = editor.isActive("image")

      if (!active) {
        if (gallerySelection) {
          setMode("gallery")
          setAltValue(gallerySelection.alt)
        } else {
          setMode(null)
          setAltValue("")
        }
        return
      }

      const attributes = editor.getAttributes("image")
      setMode("image")
      setAltValue(typeof attributes.alt === "string" ? attributes.alt : "")
    }

    const handleGallerySelectionChange = (event: Event) => {
      const detail = (event as CustomEvent<{
        pos: number | null
        index: number
        alt: string
      } | null>).detail

      if (!detail || detail.pos === null) {
        setGallerySelection(null)
        if (!editor.isActive("image")) {
          setMode(null)
          setAltValue("")
        }
        return
      }

      setGallerySelection({
        pos: detail.pos,
        index: detail.index,
        alt: detail.alt,
      })

      if (!editor.isActive("image")) {
        setMode("gallery")
        setAltValue(detail.alt)
      }
    }

    syncFromSelection()
    editor.on("selectionUpdate", syncFromSelection)
    editor.on("transaction", syncFromSelection)
    document.addEventListener("chihiro:gallery-image-selection-change", handleGallerySelectionChange)

    return () => {
      editor.off("selectionUpdate", syncFromSelection)
      editor.off("transaction", syncFromSelection)
      document.removeEventListener("chihiro:gallery-image-selection-change", handleGallerySelectionChange)
    }
  }, [editor, gallerySelection])

  if (!mode) {
    return null
  }

  return (
    <div className="border-b border-zinc-200/80 bg-white/70 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <label className="flex flex-col gap-2">
        <span className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          图片描述
        </span>
        <input
          type="text"
          value={altValue}
          onChange={(event) => {
            const nextValue = event.target.value
            setAltValue(nextValue)

            if (mode === "image") {
              editor.commands.updateAttributes("image", {
                alt: nextValue.trim() ? nextValue : null,
              })
              return
            }

            if (!gallerySelection) {
              return
            }

            editor
              .chain()
              .command(({ tr, state }) => {
                const node = state.doc.nodeAt(gallerySelection.pos)

                if (!node || node.type.name !== "gallery") {
                  return false
                }

                const images = Array.isArray(node.attrs.images) ? [...node.attrs.images] : []

                if (!images[gallerySelection.index]) {
                  return false
                }

                images[gallerySelection.index] = {
                  ...images[gallerySelection.index],
                  alt: nextValue.trim() ? nextValue : undefined,
                }

                tr.setNodeMarkup(gallerySelection.pos, undefined, {
                  ...node.attrs,
                  images,
                })

                return true
              })
              .run()
          }}
          placeholder="描述这张图片的内容"
          className="h-11 rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600"
        />
      </label>
    </div>
  )
}

type SimpleEditorProps = {
  initialContent?: JSONContent | null
  initialContentHtml?: string | null
  contentFieldName?: string
  htmlFieldName?: string
  onDirtyChange?: (isDirty: boolean) => void
  showThemeToggle?: boolean
  placeholder?: string
  appearance?: "default" | "embedded"
  isCodeView?: boolean
  onCodeViewChange?: (isCodeView: boolean) => void
  showModeToggle?: boolean
}

const EMPTY_DOCUMENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

const IMAGE_UPLOAD_ACCEPT = "image/avif,image/gif,image/jpeg,image/png,image/svg+xml,image/webp"
const INITIAL_MEDIA_SELECTION_TYPES = new Set(["image", "gallery", "imageUpload"])

function formatHtmlForCodeView(html: string) {
  if (typeof window === "undefined") {
    return html
  }

  const parser = new DOMParser()
  const parsed = parser.parseFromString(html, "text/html")
  const voidTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ])
  const preserveInlineHtmlTags = new Set(["pre", "code"])

  function serializeNode(node: ChildNode, depth: number): string {
    const indent = "  ".repeat(depth)

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\s+/g, " ").trim() ?? ""
      return text ? `${indent}${text}` : ""
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ""
    }

    const element = node as HTMLElement
    const tagName = element.tagName.toLowerCase()
    const attributes = Array.from(element.attributes)
      .map((attribute) => ` ${attribute.name}="${attribute.value.replace(/"/g, "&quot;")}"`)
      .join("")

    if (voidTags.has(tagName)) {
      return `${indent}<${tagName}${attributes}>`
    }

    if (preserveInlineHtmlTags.has(tagName)) {
      return `${indent}<${tagName}${attributes}>${element.innerHTML}</${tagName}>`
    }

    const serializedChildren = Array.from(element.childNodes)
      .map((child) => serializeNode(child, depth + 1))
      .filter(Boolean)

    if (serializedChildren.length === 0) {
      return `${indent}<${tagName}${attributes}></${tagName}>`
    }

    const hasSingleTextChild =
      element.childNodes.length === 1 && element.childNodes[0]?.nodeType === Node.TEXT_NODE

    if (hasSingleTextChild) {
      return `${indent}<${tagName}${attributes}>${element.textContent?.trim() ?? ""}</${tagName}>`
    }

    return `${indent}<${tagName}${attributes}>\n${serializedChildren.join("\n")}\n${indent}</${tagName}>`
  }

  return Array.from(parsed.body.childNodes)
    .map((node) => serializeNode(node, 0))
    .filter(Boolean)
    .join("\n\n")
}

function normalizeInitialMediaSelection(editor: Editor) {
  const { state, view } = editor
  const { doc, selection } = state

  if (!(selection instanceof NodeSelection)) {
    return false
  }

  if (!INITIAL_MEDIA_SELECTION_TYPES.has(selection.node.type.name)) {
    return false
  }

  const candidatePositions = [
    Math.min(selection.to, doc.content.size),
    Math.max(selection.from - 1, 0),
    0,
  ]

  for (const position of candidatePositions) {
    try {
      const nextSelection = TextSelection.near(doc.resolve(position), 1)

      if (!selection.eq(nextSelection)) {
        view.dispatch(state.tr.setSelection(nextSelection))
        return true
      }
    } catch {
      // Keep trying nearby positions until we find a valid text selection.
    }
  }

  return false
}

const InlineCodeSelectAll = Extension.create({
  name: "inlineCodeSelectAll",

  addProseMirrorPlugins() {
    const selectCurrentInlineCode = () => {
      const { state, view } = this.editor
      const { selection } = state
      const { $from, $to } = selection

      if ($from.parent !== $to.parent || !$from.parent.isTextblock) {
        return false
      }

      const parent = $from.parent
      const fromOffset = $from.parentOffset
      const toOffset = $to.parentOffset
      const parentStart = $from.start()
      let offset = 0
      let segmentStart: number | null = null

      for (let index = 0; index < parent.childCount; index += 1) {
        const child = parent.child(index)
        const childStart = offset
        const childEnd = offset + child.nodeSize
        const hasCodeMark =
          child.isText && child.marks.some((mark) => mark.type.name === "code")

        if (hasCodeMark) {
          if (segmentStart === null) {
            segmentStart = childStart
          }
        } else if (segmentStart !== null) {
          if (
            fromOffset >= segmentStart &&
            fromOffset <= childStart &&
            toOffset >= segmentStart &&
            toOffset <= childStart
          ) {
            const nextSelection = TextSelection.create(
              state.doc,
              parentStart + segmentStart,
              parentStart + childStart,
            )

            if (!selection.eq(nextSelection)) {
              view.dispatch(state.tr.setSelection(nextSelection))
            }

            return true
          }

          segmentStart = null
        }

        offset = childEnd
      }

      if (
        segmentStart !== null &&
        fromOffset >= segmentStart &&
        fromOffset <= offset &&
        toOffset >= segmentStart &&
        toOffset <= offset
      ) {
        const nextSelection = TextSelection.create(
          state.doc,
          parentStart + segmentStart,
          parentStart + offset,
        )

        if (!selection.eq(nextSelection)) {
          view.dispatch(state.tr.setSelection(nextSelection))
        }

        return true
      }

      return false
    }

    return [
      keymap({
        "Mod-a": () => selectCurrentInlineCode(),
      }),
    ]
  },
})

const PhotoImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-photo-caption"),
        renderHTML: (attributes) =>
          attributes.caption ? { "data-photo-caption": attributes.caption } : {},
      },
      meta: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-photo-meta"),
        renderHTML: (attributes) =>
          attributes.meta ? { "data-photo-meta": attributes.meta } : {},
      },
    }
  },
})

export function SimpleEditor({
  initialContent = null,
  initialContentHtml = null,
  contentFieldName = "content",
  htmlFieldName = "contentHtml",
  onDirtyChange,
  showThemeToggle = false,
  placeholder = "开始写作。",
  appearance = "default",
  isCodeView: controlledCodeView,
  onCodeViewChange,
  showModeToggle = true,
}: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const [uncontrolledCodeView, setUncontrolledCodeView] = useState(false)
  const [codeValue, setCodeValue] = useState(() => initialContentHtml ?? "")
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [serializedContent, setSerializedContent] = useState("null")
  const [serializedHtml, setSerializedHtml] = useState("")
  const [isToolbarStuck, setIsToolbarStuck] = useState(false)
  const initialSignatureRef = useRef<string | null>(null)
  const shouldNormalizeInitialSelectionRef = useRef(true)
  const activeMobileView = isMobile ? mobileView : "main"
  const isCodeView = controlledCodeView ?? uncontrolledCodeView
  const toolbarBarRef = useRef<HTMLDivElement>(null)
  const toolbarSentinelRef = useRef<HTMLDivElement>(null)
  const codeInputRef = useRef<HTMLTextAreaElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
      handleDOMEvents: {
        focus: () => {
          if (!editor || !shouldNormalizeInitialSelectionRef.current) {
            return false
          }

          queueMicrotask(() => {
            normalizeInitialMediaSelection(editor)
            shouldNormalizeInitialSelectionRef.current = false
          })

          return false
        },
      },
    },
    extensions: [
      InlineCodeSelectAll,
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        heading: {
          levels: [1, 2, 3, 4],
        },
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      CodeBlockLowlightWithControls,
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder,
        showOnlyCurrent: false,
        includeChildren: false,
      }),
      Highlight.configure({ multicolor: true }),
      PhotoImage,
      GalleryNode.configure({
        accept: IMAGE_UPLOAD_ACCEPT,
        limit: 12,
        maxSize: MAX_FILE_SIZE,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      Typography,
      Superscript,
      Subscript,
      ImageUploadNode.configure({
        accept: IMAGE_UPLOAD_ACCEPT,
        maxSize: MAX_FILE_SIZE,
        limit: 1,
        outputType: "image",
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContent ?? initialContentHtml ?? EMPTY_DOCUMENT,
    onCreate({ editor }) {
      const nextContent = JSON.stringify(editor.getJSON())
      const nextHtml = editor.getHTML()

      initialSignatureRef.current = getEditorSignature(nextContent, nextHtml)
      setSerializedContent(nextContent)
      setSerializedHtml(nextHtml)
      onDirtyChange?.(false)
      queueMicrotask(() => {
        normalizeInitialMediaSelection(editor)
      })
    },
    onUpdate({ editor }) {
      const nextContent = JSON.stringify(editor.getJSON())
      const nextHtml = editor.getHTML()

      setSerializedContent(nextContent)
      setSerializedHtml(nextHtml)
      onDirtyChange?.(getEditorSignature(nextContent, nextHtml) !== initialSignatureRef.current)
    },
  })

  useEffect(() => {
    void toolbarRef.current
  }, [])

  useEffect(() => {
    if (!isCodeView) {
      return
    }

    const textarea = codeInputRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [codeValue, isCodeView])

  useEffect(() => {
    if (!isCodeView || !editor) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      setCodeValue((current) => {
        const formatted = formatHtmlForCodeView(editor.getHTML())
        return current === formatted ? current : formatted
      })
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [editor, isCodeView])

  useEffect(() => {
    if (appearance !== "embedded") {
      return
    }

    const element = toolbarBarRef.current
    const sentinel = toolbarSentinelRef.current

    if (!element || !sentinel) {
      return
    }

    const scrollParent = element.closest("main")
    const root = scrollParent instanceof Element ? scrollParent : null
    const stickyTop = Number.parseFloat(window.getComputedStyle(element).top || "0")
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsToolbarStuck(!entry.isIntersecting)
      },
      {
        root,
        threshold: [1],
        rootMargin: `-${stickyTop + 1}px 0px 0px 0px`,
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [appearance, isMobile])

  function toggleCodeView() {
    if (!editor) {
      return
    }

    if (!isCodeView) {
      syncCodeValue(formatHtmlForCodeView(editor.getHTML()))
      onCodeViewChange?.(true)
      if (controlledCodeView === undefined) {
        setUncontrolledCodeView(true)
      }
      return
    }

    onCodeViewChange?.(false)
    if (controlledCodeView === undefined) {
      setUncontrolledCodeView(false)
    }
  }

  function syncCodeValue(nextCodeValue: string) {
    setCodeValue(nextCodeValue)

    if (!editor || !isCodeView) {
      return
    }

    const nextHtml = nextCodeValue.trim() || "<p></p>"

    editor.commands.setContent(nextHtml)
    const nextContent = JSON.stringify(editor.getJSON())
    const renderedHtml = editor.getHTML()

    setSerializedContent(nextContent)
    setSerializedHtml(renderedHtml)
    onDirtyChange?.(getEditorSignature(nextContent, renderedHtml) !== initialSignatureRef.current)
  }

  return (
    <div className="simple-editor-shell" data-appearance={appearance}>
      {editor ? (
        <>
          <div ref={toolbarSentinelRef} aria-hidden="true" className="simple-editor-toolbar-sentinel" />
          <div
            ref={toolbarBarRef}
            className="simple-editor-toolbar-bar"
            data-stuck={isToolbarStuck ? "true" : "false"}
          >
            <Toolbar
              ref={toolbarRef}
              className="simple-editor-main-toolbar"
            >
              {!isCodeView && editor && activeMobileView === "main" ? (
                <MainToolbarContent
                  editor={editor}
                  onHighlighterClick={() => setMobileView("highlighter")}
                  onLinkClick={() => setMobileView("link")}
                  isMobile={isMobile}
                  showThemeToggle={showThemeToggle}
                />
              ) : !isCodeView && editor ? (
                <MobileToolbarContent
                  editor={editor}
                  type={activeMobileView === "highlighter" ? "highlighter" : "link"}
                  onBack={() => setMobileView("main")}
                />
              ) : null}
            </Toolbar>

            {showModeToggle ? (
              <div className="simple-editor-mode-toolbar">
                <ModeToggle isCodeView={isCodeView} onToggleCodeView={toggleCodeView} />
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="simple-editor-wrapper" data-appearance={appearance}>
        <input type="hidden" name={contentFieldName} value={serializedContent} />
        <input type="hidden" name={htmlFieldName} value={serializedHtml} />
        <EditorContext.Provider value={{ editor }}>
          {!isCodeView && editor ? <ImageAltEditor editor={editor} /> : null}

          {isCodeView ? (
            <div className="simple-editor-code-pane">
              <textarea
                ref={codeInputRef}
                value={codeValue}
                onChange={(event) => syncCodeValue(event.target.value)}
                wrap="soft"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                aria-label="Source code editor"
                className="simple-editor-code-input"
              />
            </div>
          ) : (
            <EditorContent
              editor={editor}
              role="presentation"
              className="simple-editor-content"
            />
          )}
        </EditorContext.Provider>
      </div>
    </div>
  )
}

function getEditorSignature(content: string, html: string) {
  return `${content}\n${html}`
}

function ModeToggle({
  isCodeView,
  onToggleCodeView,
}: {
  isCodeView: boolean
  onToggleCodeView: () => void
}) {
  return (
    <div className="simple-editor-mode-switch" aria-label="编辑模式切换">
      <Button
        type="button"
        variant={!isCodeView ? "primary" : "ghost"}
        onClick={() => {
          if (isCodeView) {
            onToggleCodeView()
          }
        }}
        size="small"
        className="simple-editor-mode-switch__button"
      >
        <FileCode2 className="tiptap-button-icon" />
        富文本
      </Button>
      <Button
        type="button"
        variant={isCodeView ? "primary" : "ghost"}
        onClick={() => {
          if (!isCodeView) {
            onToggleCodeView()
          }
        }}
        size="small"
        className="simple-editor-mode-switch__button"
      >
        <Code2 className="tiptap-button-icon" />
        源码
      </Button>
    </div>
  )
}
