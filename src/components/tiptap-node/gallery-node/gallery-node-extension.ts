import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { GalleryNodeView } from "@/components/tiptap-node/gallery-node/gallery-node"
import type { UploadFunction } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"

export type GalleryImage = {
  src: string
  alt?: string
  title?: string
  caption?: string
  meta?: string
}

export interface GalleryNodeOptions {
  accept?: string
  limit?: number
  maxSize?: number
  upload?: UploadFunction
  onError?: (error: Error) => void
  onSuccess?: (url: string) => void
  HTMLAttributes: Record<string, unknown>
}

const GALLERY_IMAGES_ATTRIBUTE = "data-gallery-images"

function normalizeGalleryImages(value: unknown): GalleryImage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return []
    }

    const src =
      typeof (item as { src?: unknown }).src === "string"
        ? (item as { src: string }).src.trim()
        : ""

    if (!src) {
      return []
    }

    const alt =
      typeof (item as { alt?: unknown }).alt === "string"
        ? (item as { alt: string }).alt
        : undefined
    const title =
      typeof (item as { title?: unknown }).title === "string"
        ? (item as { title: string }).title
        : undefined
    const caption =
      typeof (item as { caption?: unknown }).caption === "string"
        ? (item as { caption: string }).caption
        : undefined
    const meta =
      typeof (item as { meta?: unknown }).meta === "string"
        ? (item as { meta: string }).meta
        : undefined

    return [{ src, alt, title, caption, meta }]
  })
}

function parseGalleryImages(element: HTMLElement): GalleryImage[] {
  const rawImages = element.getAttribute(GALLERY_IMAGES_ATTRIBUTE)

  if (rawImages) {
    try {
      return normalizeGalleryImages(JSON.parse(rawImages))
    } catch {
      return normalizeGalleryImages(
        Array.from(element.querySelectorAll("img")).map((image) => ({
          src: image.getAttribute("src") ?? "",
          alt: image.getAttribute("alt") ?? undefined,
          title: image.getAttribute("title") ?? undefined,
          caption: image.getAttribute("data-photo-caption") ?? undefined,
          meta: image.getAttribute("data-photo-meta") ?? undefined,
        }))
      )
    }
  }

  return normalizeGalleryImages(
    Array.from(element.querySelectorAll("img")).map((image) => ({
      src: image.getAttribute("src") ?? "",
      alt: image.getAttribute("alt") ?? undefined,
      title: image.getAttribute("title") ?? undefined,
      caption: image.getAttribute("data-photo-caption") ?? undefined,
      meta: image.getAttribute("data-photo-meta") ?? undefined,
    }))
  )
}

function getGalleryPhotoMeta(image: GalleryImage) {
  return [image.caption, image.meta]
    .map((item) => item?.trim())
    .filter((item): item is string => (item ? !isGenericPhotoMeta(item) : false))
    .join(" · ")
}

function isGenericPhotoMeta(value: string) {
  const text = value.trim()

  return (
    /^(图片|image|图册图片\s*\d+)$/i.test(text) ||
    /^img[_\s-]?\d+$/i.test(text) ||
    /^dscf?[_\s-]?\d+$/i.test(text) ||
    /^avatar\s*\d*$/i.test(text) ||
    /^[a-f0-9]{8,}$/i.test(text) ||
    /\.(avif|gif|jpe?g|png|webp)$/i.test(text)
  )
}

function createGalleryItem(image: GalleryImage, index: number) {
  const photoMeta = getGalleryPhotoMeta(image)

  return [
    "figure",
    {
      class: "content-gallery__item",
      "data-gallery-item": `${index + 1}`,
      ...(photoMeta ? { "data-photo-meta": photoMeta } : {}),
    },
    [
      "img",
      {
        src: image.src,
        alt: image.alt ?? image.title ?? `图册图片 ${index + 1}`,
        ...(image.caption ? { "data-photo-caption": image.caption } : {}),
        ...(image.meta ? { "data-photo-meta": image.meta } : {}),
        loading: "lazy",
        decoding: "async",
        draggable: "false",
      },
    ],
    ...(photoMeta
      ? [
          [
            "figcaption",
            {
              class: "photo-meta-overlay",
            },
            photoMeta,
          ],
        ]
      : []),
  ]
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    gallery: {
      setGallery: (images: GalleryImage[]) => ReturnType
    }
  }
}

export const GalleryNode = Node.create<GalleryNodeOptions>({
  name: "gallery",

  group: "block",

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      accept: "image/*",
      limit: 12,
      maxSize: 0,
      upload: undefined,
      onError: undefined,
      onSuccess: undefined,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element: HTMLElement) => parseGalleryImages(element),
        renderHTML: (attributes: { images?: unknown }) => {
          const images = normalizeGalleryImages(attributes.images)

          return images.length > 0
            ? {
                [GALLERY_IMAGES_ATTRIBUTE]: JSON.stringify(images),
              }
            : {}
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const images = normalizeGalleryImages(node.attrs.images)

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "gallery",
        "data-gallery-root": "true",
        class: "content-gallery",
        "aria-label": "图册",
      }),
      [
        "div",
        {
          class: "content-gallery__track",
        },
        ...images.map((image, index) => createGalleryItem(image, index)),
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView)
  },

  addCommands() {
    return {
      setGallery:
        (images) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              images: normalizeGalleryImages(images),
            },
          })
        },
    }
  },
})

export default GalleryNode
