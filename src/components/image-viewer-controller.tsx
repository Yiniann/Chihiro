"use client";

import { useCallback, useEffect, useMemo, useState, type PointerEvent, type WheelEvent } from "react";
import { createPortal } from "react-dom";

type ViewerImage = {
  src: string;
  alt: string;
};

type ViewerState = {
  images: ViewerImage[];
  index: number;
};

type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

type SwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
};

type PhotoMetaItem = {
  kind:
    | "caption"
    | "device"
    | "aperture"
    | "iso"
    | "shutter"
    | "focal"
    | "date"
    | "meta"
    | "alt";
  text: string;
};

const CONTENT_SELECTOR = ".reading-copy";
const MIN_ZOOM = 0.5;
const DEFAULT_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const WHEEL_ZOOM_STEP = 0.02;
const SWIPE_TRIGGER_DISTANCE = 72;
const GALLERY_SELECTOR = "[data-gallery-root]";
const IMAGE_VIEWER_DISABLED_SELECTOR = "[data-image-viewer-disabled]";
const PHOTO_META_FRAME_CLASS = "photo-meta-frame";
const PHOTO_META_BLOCK_CLASS = "photo-meta-frame--block";
const PHOTO_META_HOST_CLASS = "photo-meta-host";
const PHOTO_META_OVERLAY_CLASS = "photo-meta-overlay";
const MEDIA_LOADING_ATTRIBUTE = "data-media-loading";
const GALLERY_TRACK_CLASS = "content-gallery__track";
const GALLERY_ITEM_CLASS = "content-gallery__item";
const GALLERY_NAV_BUTTON_CLASS = "content-gallery__nav-button";
const GALLERY_DRAG_THRESHOLD = 6;

export function ImageViewerController() {
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panState, setPanState] = useState<PanState | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState | null>(null);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const currentImage = viewer?.images[viewer.index] ?? null;
  const hasMultipleImages = (viewer?.images.length ?? 0) > 1;
  const effectiveOffset =
    zoom > DEFAULT_ZOOM ? offset : { x: swipeOffsetX, y: 0 };

  const resetTransform = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setOffset({ x: 0, y: 0 });
    setPanState(null);
    setSwipeState(null);
    setSwipeOffsetX(0);
  }, []);

  const setConstrainedZoom = useCallback((nextZoom: number) => {
    const constrainedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

    setZoom(constrainedZoom);

    if (constrainedZoom <= DEFAULT_ZOOM) {
      setOffset({ x: 0, y: 0 });
      setPanState(null);
    }
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setConstrainedZoom(zoom + delta);
  }, [setConstrainedZoom, zoom]);

  const moveCurrentViewer = useCallback(
    (direction: -1 | 1) => {
      resetTransform();
      setViewer((current) => moveViewer(current, direction));
    },
    [resetTransform],
  );

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      return;
    }

    const enhance = () => {
      sanitizeGalleryPhotoMetadata(document);
      enhanceGalleryNavigation(document);
      enhanceGalleryDragging(document);
      enhanceGalleryPhotoMetadata(document);
      enhancePhotoMetadata(document);
      enhanceImageLoading(document);
    };
    const observer = new MutationObserver(enhance);

    enhance();
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleDragStart = (event: DragEvent) => {
      if (window.location.pathname.startsWith("/admin")) {
        return;
      }

      const target = event.target as Element | null;
      const image = target?.closest<HTMLImageElement>("img") ?? null;

      if (
        !image ||
        image.closest("[data-image-viewer]") ||
        image.closest(IMAGE_VIEWER_DISABLED_SELECTOR) ||
        (!image.closest(CONTENT_SELECTOR) && !image.closest(GALLERY_SELECTOR))
      ) {
        return;
      }

      event.preventDefault();
    };

    const handleClick = (event: MouseEvent) => {
      if (window.location.pathname.startsWith("/admin")) {
        return;
      }

      const target = event.target as Element | null;
      const galleryTrack = target?.closest<HTMLElement>(`.${GALLERY_TRACK_CLASS}`) ?? null;

      if (galleryTrack?.dataset.galleryDragging === "true") {
        event.preventDefault();
        event.stopPropagation();
        galleryTrack.dataset.galleryDragging = "false";
        return;
      }

      const contentRoot = target?.closest<HTMLElement>(CONTENT_SELECTOR) ?? null;
      const galleryRootFromTarget = target?.closest<HTMLElement>(GALLERY_SELECTOR) ?? null;
      const image =
        target?.closest<HTMLImageElement>("img") ??
        target
          ?.closest<HTMLElement>("[data-gallery-item]")
          ?.querySelector<HTMLImageElement>("img") ??
        target?.closest<HTMLElement>("figure")?.querySelector<HTMLImageElement>("img");

      if (
        (!contentRoot && !galleryRootFromTarget) ||
        !image?.src ||
        image.closest("[data-image-viewer]") ||
        image.closest(IMAGE_VIEWER_DISABLED_SELECTOR)
      ) {
        return;
      }

      const galleryRoot = image.closest<HTMLElement>(GALLERY_SELECTOR);
      const imageElements = galleryRoot
        ? Array.from(galleryRoot.querySelectorAll<HTMLImageElement>("img")).filter(
            (item) =>
              Boolean(item.src) &&
              !item.closest("[data-image-viewer]") &&
              !item.closest(IMAGE_VIEWER_DISABLED_SELECTOR),
          )
        : [image];
      const images = imageElements.map((item) => ({
        src: item.currentSrc || item.src,
        alt: item.alt || item.title || "图片",
      }));
      const index = Math.max(0, imageElements.includes(image) ? imageElements.indexOf(image) : 0);

      if (images.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      resetTransform();
      setViewer({ images, index });
    };

    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [resetTransform]);

  useEffect(() => {
    if (!viewer || !currentImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewer(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        moveCurrentViewer(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        moveCurrentViewer(1);
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(ZOOM_STEP);
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomBy(-ZOOM_STEP);
        return;
      }

      if (event.key === "0") {
        resetTransform();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [currentImage, moveCurrentViewer, resetTransform, viewer, zoomBy]);

  const imageCounter = useMemo(() => {
    if (!viewer || viewer.images.length < 2) {
      return null;
    }

    return `${viewer.index + 1} / ${viewer.images.length}`;
  }, [viewer]);

  if (!viewer || !currentImage || !portalTarget) {
    return null;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setConstrainedZoom(zoom + (event.deltaY < 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP));
  }

  function handlePointerDown(event: PointerEvent<HTMLImageElement>) {
    event.stopPropagation();

    if (zoom <= DEFAULT_ZOOM) {
      if (!hasMultipleImages) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      setSwipeState({
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      });
      setSwipeOffsetX(0);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setPanState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLImageElement>) {
    if (swipeState && swipeState.pointerId === event.pointerId && zoom <= DEFAULT_ZOOM) {
      const deltaX = event.clientX - swipeState.startX;
      const deltaY = event.clientY - swipeState.startY;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        setSwipeOffsetX(0);
        return;
      }

      event.stopPropagation();
      setSwipeOffsetX(deltaX);
      return;
    }

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    setOffset({
      x: panState.offsetX + event.clientX - panState.startX,
      y: panState.offsetY + event.clientY - panState.startY,
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLImageElement>) {
    if (swipeState?.pointerId === event.pointerId) {
      event.stopPropagation();

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const shouldMoveNext = swipeOffsetX <= -SWIPE_TRIGGER_DISTANCE;
      const shouldMovePrevious = swipeOffsetX >= SWIPE_TRIGGER_DISTANCE;

      setSwipeState(null);
      setSwipeOffsetX(0);

      if (shouldMoveNext) {
        moveCurrentViewer(1);
        return;
      }

      if (shouldMovePrevious) {
        moveCurrentViewer(-1);
      }

      return;
    }

    if (panState?.pointerId === event.pointerId) {
      event.stopPropagation();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setPanState(null);
    }
  }

  return createPortal(
    <div
      data-image-viewer
      className="image-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="图片查看器"
      onClick={() => setViewer(null)}
    >
      <div className="image-viewer__stage" onWheel={handleWheel}>
        <button
          type="button"
          className="image-viewer__close"
          aria-label="关闭图片"
          onClick={() => setViewer(null)}
        >
          ×
        </button>
        <div className="image-viewer__toolbar" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="image-viewer__tool"
            aria-label="缩小图片"
            onClick={() => zoomBy(-ZOOM_STEP)}
          >
            −
          </button>
          <button
            type="button"
            className="image-viewer__tool image-viewer__tool--label"
            aria-label="重置图片大小"
            onClick={resetTransform}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="image-viewer__tool"
            aria-label="放大图片"
            onClick={() => zoomBy(ZOOM_STEP)}
          >
            +
          </button>
        </div>
        {hasMultipleImages ? (
          <button
            type="button"
            className="image-viewer__nav image-viewer__nav--prev"
            data-direction="prev"
            aria-label="上一张图片"
            onClick={(event) => {
              event.stopPropagation();
              moveCurrentViewer(-1);
            }}
          />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          draggable={false}
          className="image-viewer__image"
          style={{
            transform: `translate3d(${effectiveOffset.x}px, ${effectiveOffset.y}px, 0) scale(${zoom})`,
            transition: panState ? "none" : "transform 140ms cubic-bezier(0.22, 1, 0.36, 1)",
            cursor: zoom > DEFAULT_ZOOM ? (panState ? "grabbing" : "grab") : "default",
          }}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => {
            event.stopPropagation();
            if (zoom === DEFAULT_ZOOM) {
              setConstrainedZoom(2);
            } else {
              resetTransform();
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDragStart={(event) => event.preventDefault()}
        />
        {hasMultipleImages ? (
          <button
            type="button"
            className="image-viewer__nav image-viewer__nav--next"
            data-direction="next"
            aria-label="下一张图片"
            onClick={(event) => {
              event.stopPropagation();
              moveCurrentViewer(1);
            }}
          />
        ) : null}
        {imageCounter ? <div className="image-viewer__counter">{imageCounter}</div> : null}
      </div>
    </div>,
    portalTarget,
  );
}

function enhanceImageLoading(root: ParentNode) {
  const images = Array.from(
    root.querySelectorAll<HTMLImageElement>(`${CONTENT_SELECTOR} img, ${GALLERY_SELECTOR} img`),
  );

  for (const image of images) {
    if (
      image.closest("[data-image-viewer]") ||
      image.closest(IMAGE_VIEWER_DISABLED_SELECTOR) ||
      !image.src
    ) {
      continue;
    }

    const loadingTarget = getImageLoadingTarget(image);
    const markLoaded = () => {
      loadingTarget.removeAttribute(MEDIA_LOADING_ATTRIBUTE);
      loadingTarget.removeAttribute("aria-busy");
    };

    if (image.complete) {
      markLoaded();
      continue;
    }

    loadingTarget.setAttribute(MEDIA_LOADING_ATTRIBUTE, "true");
    loadingTarget.setAttribute("aria-busy", "true");

    if (image.dataset.mediaLoadingBound === "true") {
      continue;
    }

    image.dataset.mediaLoadingBound = "true";

    image.addEventListener(
      "load",
      () => {
        markLoaded();
      },
      { once: true },
    );
    image.addEventListener(
      "error",
      () => {
        markLoaded();
      },
      { once: true },
    );
  }
}

function getImageLoadingTarget(image: HTMLImageElement) {
  return (
    image.closest<HTMLElement>(".content-gallery__item") ??
    image.closest<HTMLElement>(`.${PHOTO_META_FRAME_CLASS}`) ??
    image.closest<HTMLElement>("figure") ??
    image
  );
}

function enhancePhotoMetadata(root: ParentNode) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>(`${CONTENT_SELECTOR} img`));

  for (const image of images) {
    if (
      image.closest(GALLERY_SELECTOR) ||
      image.closest("[data-image-viewer]") ||
      image.closest(IMAGE_VIEWER_DISABLED_SELECTOR) ||
      image.closest(`.${PHOTO_META_FRAME_CLASS}`)
    ) {
      continue;
    }

    const photoMetaItems = getPhotoMetaItems(image);

    if (photoMetaItems.length === 0) {
      continue;
    }

    const currentFigure = image.closest<HTMLElement>("figure");

    if (currentFigure && !currentFigure.matches(".content-gallery__item")) {
      currentFigure.classList.add(PHOTO_META_FRAME_CLASS, PHOTO_META_BLOCK_CLASS);
      appendPhotoMetaOverlay(currentFigure, photoMetaItems);
      continue;
    }

    const wrapper = document.createElement("span");
    wrapper.className = PHOTO_META_FRAME_CLASS;

    if (image.parentElement?.matches(CONTENT_SELECTOR)) {
      wrapper.classList.add(PHOTO_META_BLOCK_CLASS);
    } else if (image.parentElement?.tagName === "P") {
      image.parentElement.classList.add(PHOTO_META_HOST_CLASS);
    }

    image.parentNode?.insertBefore(wrapper, image);
    wrapper.append(image);
    appendPhotoMetaOverlay(wrapper, photoMetaItems);
  }
}

function enhanceGalleryPhotoMetadata(root: ParentNode) {
  const galleryItems = Array.from(root.querySelectorAll<HTMLElement>(`${GALLERY_SELECTOR} .content-gallery__item`));

  for (const item of galleryItems) {
    const image = item.querySelector<HTMLImageElement>("img");

    if (!image) {
      continue;
    }

    const photoMetaItems = getPhotoMetaItems(image, false);

    if (photoMetaItems.length === 0) {
      item.querySelector(`:scope > .${PHOTO_META_OVERLAY_CLASS}`)?.remove();
      continue;
    }

    appendPhotoMetaOverlay(item, photoMetaItems);
  }
}

function enhanceGalleryNavigation(root: ParentNode) {
  const galleryRoots = Array.from(
    root.querySelectorAll<HTMLElement>(`${GALLERY_SELECTOR}:not(.content-gallery--editor)`),
  );

  for (const galleryRoot of galleryRoots) {
    const track = galleryRoot.querySelector<HTMLElement>(`.${GALLERY_TRACK_CLASS}`);
    const items = Array.from(galleryRoot.querySelectorAll<HTMLElement>(`.${GALLERY_ITEM_CLASS}`));

    if (!track || items.length < 2) {
      galleryRoot.classList.remove("content-gallery--navigable");
      galleryRoot.querySelectorAll(`:scope > .${GALLERY_NAV_BUTTON_CLASS}`).forEach((button) => button.remove());
      continue;
    }

    galleryRoot.classList.add("content-gallery--navigable");

    const previousButton = ensureGalleryNavButton(galleryRoot, "prev", "上一张图片", () => {
      scrollGalleryTrack(track, -1);
    });
    const nextButton = ensureGalleryNavButton(galleryRoot, "next", "下一张图片", () => {
      scrollGalleryTrack(track, 1);
    });

    if (track.dataset.galleryNavBound !== "true") {
      track.dataset.galleryNavBound = "true";
      track.addEventListener("scroll", () => {
        updateGalleryNavigationState(galleryRoot, track);
      }, { passive: true });
    }

    updateGalleryNavigationState(galleryRoot, track, previousButton, nextButton);
  }
}

function enhanceGalleryDragging(root: ParentNode) {
  const tracks = Array.from(
    root.querySelectorAll<HTMLElement>(`${GALLERY_SELECTOR}:not(.content-gallery--editor) .${GALLERY_TRACK_CLASS}`),
  );

  for (const track of tracks) {
    if (track.dataset.galleryDragBound === "true") {
      continue;
    }

    track.dataset.galleryDragBound = "true";
    track.dataset.galleryDragging = "false";

    let pointerId: number | null = null;
    let startX = 0;
    let startScrollLeft = 0;
    let pointerStartX = 0;
    let hasDragged = false;

    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const target = event.target as Element | null;

      if (target?.closest(`.${GALLERY_NAV_BUTTON_CLASS}`)) {
        return;
      }

      pointerId = event.pointerId;
      startX = event.clientX;
      pointerStartX = event.clientX;
      startScrollLeft = track.scrollLeft;
      hasDragged = false;
      track.dataset.galleryDragging = "false";
      track.dataset.galleryDragActive = "true";
    });

    track.addEventListener("pointermove", (event) => {
      if (pointerId !== event.pointerId || track.dataset.galleryDragActive !== "true") {
        return;
      }

      const deltaX = event.clientX - pointerStartX;

      if (!hasDragged && Math.abs(deltaX) >= GALLERY_DRAG_THRESHOLD) {
        hasDragged = true;
        track.dataset.galleryDragging = "true";
        startX = event.clientX;
        startScrollLeft = track.scrollLeft;
        track.setPointerCapture(event.pointerId);
      }

      if (!hasDragged) {
        return;
      }

      event.preventDefault();
      track.scrollLeft = startScrollLeft - (event.clientX - startX);
    });

    const finishDrag = (event: globalThis.PointerEvent) => {
      if (pointerId !== event.pointerId) {
        return;
      }

      if (track.hasPointerCapture(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
      }

      pointerId = null;
      track.dataset.galleryDragActive = "false";

      window.setTimeout(() => {
        track.dataset.galleryDragging = "false";
      }, 0);
    };

    track.addEventListener("pointerup", finishDrag);
    track.addEventListener("pointercancel", finishDrag);
  }
}

function ensureGalleryNavButton(
  galleryRoot: HTMLElement,
  direction: "prev" | "next",
  label: string,
  onClick: () => void,
) {
  const existingButton = galleryRoot.querySelector<HTMLButtonElement>(
    `:scope > .${GALLERY_NAV_BUTTON_CLASS}--${direction}`,
  );

  if (existingButton) {
    return existingButton;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = `${GALLERY_NAV_BUTTON_CLASS} ${GALLERY_NAV_BUTTON_CLASS}--${direction}`;
  button.setAttribute("aria-label", label);
  button.dataset.direction = direction;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  galleryRoot.append(button);
  return button;
}

function updateGalleryNavigationState(
  galleryRoot: HTMLElement,
  track: HTMLElement,
  previousButton = galleryRoot.querySelector<HTMLButtonElement>(`:scope > .${GALLERY_NAV_BUTTON_CLASS}--prev`),
  nextButton = galleryRoot.querySelector<HTMLButtonElement>(`:scope > .${GALLERY_NAV_BUTTON_CLASS}--next`),
) {
  const maxScrollLeft = track.scrollWidth - track.clientWidth;
  const canScroll = maxScrollLeft > 4;
  const isAtStart = track.scrollLeft <= 4;
  const isAtEnd = track.scrollLeft >= maxScrollLeft - 4;

  previousButton?.toggleAttribute("disabled", !canScroll || isAtStart);
  nextButton?.toggleAttribute("disabled", !canScroll || isAtEnd);
}

function scrollGalleryTrack(track: HTMLElement, direction: -1 | 1) {
  const items = Array.from(track.querySelectorAll<HTMLElement>(`:scope > .${GALLERY_ITEM_CLASS}`));

  if (items.length === 0) {
    return;
  }

  const currentIndex = getCurrentGalleryItemIndex(track, items);
  const targetIndex = clamp(currentIndex + direction, 0, items.length - 1);
  const targetItem = items[targetIndex];

  if (!targetItem) {
    return;
  }

  const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
  const centeredScrollLeft = targetItem.offsetLeft - (track.clientWidth - targetItem.offsetWidth) / 2;
  const targetScrollLeft = clamp(centeredScrollLeft, 0, maxScrollLeft);

  track.scrollBy({
    left: targetScrollLeft - track.scrollLeft,
    behavior: "smooth",
  });
}

function getCurrentGalleryItemIndex(track: HTMLElement, items: HTMLElement[]) {
  const viewportCenter = track.scrollLeft + track.clientWidth / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const distance = Math.abs(itemCenter - viewportCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestIndex;
}

function sanitizeGalleryPhotoMetadata(root: ParentNode) {
  const galleryRoots = Array.from(root.querySelectorAll<HTMLElement>(GALLERY_SELECTOR));

  for (const galleryRoot of galleryRoots) {
    const images = Array.from(galleryRoot.querySelectorAll<HTMLImageElement>("img"));

    for (const image of images) {
      image.removeAttribute("title");

      if (image.dataset.photoMeta && isGenericPhotoMeta(image.dataset.photoMeta)) {
        delete image.dataset.photoMeta;
      }

      if (image.dataset.photoCaption && isGenericPhotoMeta(image.dataset.photoCaption)) {
        delete image.dataset.photoCaption;
      }
    }

    const overlays = Array.from(galleryRoot.querySelectorAll<HTMLElement>(`.${PHOTO_META_OVERLAY_CLASS}`));

    for (const overlay of overlays) {
      if (isGenericPhotoMeta(overlay.textContent ?? "")) {
        overlay.remove();
      }
    }

    const figures = Array.from(galleryRoot.querySelectorAll<HTMLElement>("[data-photo-meta]"));

    for (const figure of figures) {
      if (isGenericPhotoMeta(figure.dataset.photoMeta ?? "")) {
        delete figure.dataset.photoMeta;
      }
    }
  }
}

function appendPhotoMetaOverlay(target: HTMLElement, items: PhotoMetaItem[]) {
  const existingOverlay = target.querySelector<HTMLElement>(`:scope > .${PHOTO_META_OVERLAY_CLASS}`);
  const overlay = existingOverlay ?? document.createElement("span");
  const signature = items.map((item) => `${item.kind}:${item.text}`).join("|");

  if (existingOverlay?.dataset.photoMetaSignature === signature) {
    return;
  }

  overlay.className = PHOTO_META_OVERLAY_CLASS;
  overlay.dataset.photoMetaSignature = signature;
  overlay.replaceChildren(
    ...items.map((item) => {
      const line = document.createElement("span");
      line.className = "photo-meta-overlay__item";
      line.dataset.kind = item.kind;

      const icon = document.createElement("span");
      icon.className = "photo-meta-overlay__icon";
      icon.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "photo-meta-overlay__text";
      text.textContent = item.text;

      line.append(icon, text);
      return line;
    }),
  );

  if (existingOverlay) {
    return;
  }

  target.append(overlay);
}

function getPhotoMetaItems(image: HTMLImageElement, includeAltFallback = true): PhotoMetaItem[] {
  const seen = new Set<string>();

  const items: Array<PhotoMetaItem | null> = [
    createPhotoMetaItem("caption", image.dataset.photoCaption),
    ...expandPhotoMetaValue(image.dataset.photoMeta),
    ...expandPhotoMetaValue(image.getAttribute("title")),
    includeAltFallback ? createPhotoMetaItem("alt", image.getAttribute("alt")) : null,
  ];

  return items.filter((item): item is PhotoMetaItem => {
    if (!item) {
      return false;
    }

    const key = item.text.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function createPhotoMetaItem(kind: PhotoMetaItem["kind"], value: string | null | undefined) {
  const text = value?.trim();

  if (!text || isGenericPhotoMeta(text)) {
    return null;
  }

  return { kind, text };
}

function expandPhotoMetaValue(value: string | null | undefined) {
  const text = value?.trim();

  if (!text || isGenericPhotoMeta(text)) {
    return [] as Array<PhotoMetaItem | null>;
  }

  const segments = text
    .split(/\s*[·•]\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    return [createPhotoMetaItem(classifyPhotoMetaKind(text), text)];
  }

  return segments.map((segment) => createPhotoMetaItem(classifyPhotoMetaKind(segment), segment));
}

function classifyPhotoMetaKind(value: string): PhotoMetaItem["kind"] {
  const text = value.trim();

  if (/^iso\s*\d+/i.test(text)) {
    return "iso";
  }

  if (/^f\/[\d.]+/i.test(text)) {
    return "aperture";
  }

  if (/^\d+\/\d+s$/i.test(text) || /^\d+(?:\.\d+)?s$/i.test(text)) {
    return "shutter";
  }

  if (/mm(?:\s*\(.*\))?$/i.test(text)) {
    return "focal";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{4}\/\d{2}\/\d{2}$/.test(text)) {
    return "date";
  }

  if (/\b(iphone|canon|nikon|fujifilm|sony|leica|hasselblad|pixel|xiaomi|huawei|lumix|olympus|ricoh)\b/i.test(text)) {
    return "device";
  }

  return "meta";
}

function isGenericPhotoMeta(value: string) {
  const text = value.trim();

  return (
    /^(图片|image|图册图片\s*\d+)$/i.test(text) ||
    /^img[_\s-]?\d+$/i.test(text) ||
    /^dscf?[_\s-]?\d+$/i.test(text) ||
    /^avatar\s*\d*$/i.test(text) ||
    /^[a-f0-9]{8,}$/i.test(text) ||
    /\.(avif|gif|jpe?g|png|webp)$/i.test(text)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function moveViewer(current: ViewerState | null, direction: -1 | 1) {
  if (!current || current.images.length === 0) {
    return current;
  }

  const nextIndex = (current.index + direction + current.images.length) % current.images.length;

  return {
    ...current,
    index: nextIndex,
  };
}
