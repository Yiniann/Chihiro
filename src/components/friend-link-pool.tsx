"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bodies, Body, Engine, World } from "matter-js";

type FriendLinkPoolItem = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  avatarUrl: string | null;
};

type SimNode = {
  body: ReturnType<typeof Bodies.rectangle>;
  element: HTMLAnchorElement;
  width: number;
  height: number;
  driftSeed: number;
};

const WALL_THICKNESS = 160;
const ITEM_MIN_SPACING = 28;

export function FriendLinkPool({
  links,
}: {
  links: FriendLinkPoolItem[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<number, HTMLAnchorElement>());
  const dragRef = useRef<{
    pointerId: number | null;
    node: SimNode | null;
    offsetX: number;
    offsetY: number;
    moved: boolean;
    startX: number;
    startY: number;
    velocityX: number;
    velocityY: number;
  }>({
    pointerId: null,
    node: null,
    offsetX: 0,
    offsetY: 0,
    moved: false,
    startX: 0,
    startY: 0,
    velocityX: 0,
    velocityY: 0,
  });
  const pointerRef = useRef<{ x: number; y: number; vx: number; vy: number; active: boolean }>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    active: false,
  });
  const scrollRef = useRef<{ y: number; vy: number; lag: number }>({
    y: 0,
    vy: 0,
    lag: 0,
  });

  useEffect(() => {
    const container = containerRef.current;

    if (!container || links.length === 0) {
      return;
    }

    let disposed = false;
    let frameId = 0;
    let resizeFrameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let engine: ReturnType<typeof Engine.create> | null = null;
    let nodes: SimNode[] = [];
    let removeNodePointerListeners = () => {};

    const setItemRef = itemRefs.current;

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      const nextX = event.clientX - bounds.left;
      const nextY = event.clientY - bounds.top;
      const previous = pointerRef.current;
      const dragState = dragRef.current;

      if (dragState.pointerId === event.pointerId && dragState.node) {
        const node = dragState.node;
        const clampedX = clamp(
          nextX - dragState.offsetX,
          node.width / 2 + ITEM_MIN_SPACING,
          bounds.width - node.width / 2 - ITEM_MIN_SPACING,
        );
        const clampedY = clamp(
          nextY - dragState.offsetY,
          node.height / 2 + ITEM_MIN_SPACING,
          parseFloat(container.style.height) - node.height / 2 - ITEM_MIN_SPACING,
        );

        Body.setPosition(node.body, { x: clampedX, y: clampedY });
        Body.setVelocity(node.body, { x: 0, y: 0 });

        dragState.velocityX = nextX - previous.x;
        dragState.velocityY = nextY - previous.y;

        if (
          !dragState.moved &&
          Math.hypot(nextX - dragState.startX, nextY - dragState.startY) > 6
        ) {
          dragState.moved = true;
        }

        pointerRef.current = {
          x: nextX,
          y: nextY,
          vx: 0,
          vy: 0,
          active: false,
        };
        return;
      }

      pointerRef.current = {
        x: nextX,
        y: nextY,
        vx: nextX - previous.x,
        vy: nextY - previous.y,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      if (dragRef.current.pointerId !== null) {
        return;
      }

      pointerRef.current = {
        ...pointerRef.current,
        vx: 0,
        vy: 0,
        active: false,
      };
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dragState = dragRef.current;

      if (dragState.pointerId !== event.pointerId || !dragState.node) {
        return;
      }

      Body.setVelocity(dragState.node.body, {
        x: dragState.velocityX * 0.18,
        y: dragState.velocityY * 0.18,
      });

      if (dragState.moved) {
        dragState.node.element.dataset.dragSuppressUntil = String(Date.now() + 220);
      }

      dragRef.current = {
        pointerId: null,
        node: null,
        offsetX: 0,
        offsetY: 0,
        moved: false,
        startX: 0,
        startY: 0,
        velocityX: 0,
        velocityY: 0,
      };

      pointerRef.current = {
        ...pointerRef.current,
        vx: 0,
        vy: 0,
        active: false,
      };
    };

    const handleScroll = () => {
      const nextY = window.scrollY;
      const previousY = scrollRef.current.y;

      scrollRef.current = {
        y: nextY,
        vy: nextY - previousY,
        lag: clamp(scrollRef.current.lag + (nextY - previousY) * 0.65, -64, 64),
      };
    };

    const cleanupWorld = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }

      removeNodePointerListeners();
      removeNodePointerListeners = () => {};

      if (engine) {
        World.clear(engine.world, false);
        Engine.clear(engine);
        engine = null;
      }

      nodes = [];
    };

    const buildWorld = () => {
      cleanupWorld();

      const { width, height } = container.getBoundingClientRect();

      if (!width || !height) {
        return;
      }

      engine = Engine.create({
        gravity: { x: 0, y: 0, scale: 0 },
      });

      const walls = [
        Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width + WALL_THICKNESS * 2, WALL_THICKNESS, {
          isStatic: true,
        }),
        Bodies.rectangle(
          width / 2,
          height + WALL_THICKNESS / 2,
          width + WALL_THICKNESS * 2,
          WALL_THICKNESS,
          { isStatic: true },
        ),
        Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height + WALL_THICKNESS * 2, {
          isStatic: true,
        }),
        Bodies.rectangle(
          width + WALL_THICKNESS / 2,
          height / 2,
          WALL_THICKNESS,
          height + WALL_THICKNESS * 2,
          { isStatic: true },
        ),
      ];

      World.add(engine.world, walls);

      const horizontalGap = Math.max(18, width * 0.03);
      const verticalGap = Math.max(22, height * 0.045);
      const placementBoundsHeight = Math.max(height - 120, 240);
      const placedRects: Array<{ x: number; y: number; width: number; height: number }> = [];

      nodes = links.flatMap((link, index) => {
        const element = setItemRef.get(link.id);

        if (!element) {
          return [];
        }

        const rect = element.getBoundingClientRect();
        const itemWidth = rect.width || 320;
        const itemHeight = rect.height || 116;
        const driftSeed = index * 1.37;
        const minX = horizontalGap + itemWidth / 2 + ITEM_MIN_SPACING;
        const maxX = width - horizontalGap - itemWidth / 2 - ITEM_MIN_SPACING;
        const minY = 72 + itemHeight / 2;
        const maxY = Math.max(minY, placementBoundsHeight - itemHeight / 2 - verticalGap);

        let baseX = clamp(
          minX + ((randomFromSeed(driftSeed + 0.21) + 1) / 2) * Math.max(maxX - minX, 0),
          minX,
          maxX,
        );
        let baseY = clamp(
          minY + ((randomFromSeed(driftSeed + 0.53) + 1) / 2) * Math.max(maxY - minY, 0),
          minY,
          maxY,
        );

        for (let attempt = 0; attempt < 18; attempt += 1) {
          const candidateX = clamp(
            minX + ((randomFromSeed(driftSeed + 0.21 + attempt * 0.73) + 1) / 2) * Math.max(maxX - minX, 0),
            minX,
            maxX,
          );
          const candidateY = clamp(
            minY + ((randomFromSeed(driftSeed + 0.53 + attempt * 0.61) + 1) / 2) * Math.max(maxY - minY, 0),
            minY,
            maxY,
          );

          if (
            !placedRects.some((placedRect) =>
              rectanglesOverlap(
                candidateX,
                candidateY,
                itemWidth,
                itemHeight,
                placedRect.x,
                placedRect.y,
                placedRect.width,
                placedRect.height,
                ITEM_MIN_SPACING,
              ),
            )
          ) {
            baseX = candidateX;
            baseY = candidateY;
            break;
          }
        }

        placedRects.push({ x: baseX, y: baseY, width: itemWidth, height: itemHeight });
        const body = Bodies.rectangle(baseX, baseY, itemWidth, itemHeight, {
          frictionAir: 0.09,
          restitution: 0.94,
          friction: 0,
          frictionStatic: 0,
          chamfer: { radius: itemHeight / 2 },
        });

        Body.setInertia(body, Infinity);
        Body.setVelocity(body, {
          x: randomFromSeed(driftSeed + 0.81) * 0.07,
          y: randomFromSeed(driftSeed + 1.17) * 0.06,
        });

        World.add(engine.world, body);

        return [
          {
            body,
            element,
            width: itemWidth,
            height: itemHeight,
            driftSeed,
          },
        ];
      });

      const handleItemPointerDown = (event: PointerEvent) => {
        const currentTarget = event.currentTarget;

        if (!(currentTarget instanceof HTMLAnchorElement)) {
          return;
        }

        const node = nodes.find((entry) => entry.element === currentTarget);

        if (!node) {
          return;
        }

        const bounds = container.getBoundingClientRect();
        const pointerX = event.clientX - bounds.left;
        const pointerY = event.clientY - bounds.top;

        dragRef.current = {
          pointerId: event.pointerId,
          node,
          offsetX: pointerX - node.body.position.x,
          offsetY: pointerY - node.body.position.y,
          moved: false,
          startX: pointerX,
          startY: pointerY,
          velocityX: 0,
          velocityY: 0,
        };

        pointerRef.current = {
          x: pointerX,
          y: pointerY,
          vx: 0,
          vy: 0,
          active: false,
        };

        currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      };

      for (const node of nodes) {
        node.element.addEventListener("pointerdown", handleItemPointerDown);
      }
      removeNodePointerListeners = () => {
        for (const node of nodes) {
          node.element.removeEventListener("pointerdown", handleItemPointerDown);
        }
      };

      container.style.height = `${Math.max(height, estimatePoolHeight(nodes, width))}px`;

      const startedAt = performance.now();
      const tick = (now: number) => {
        if (disposed || !engine) {
          return;
        }

        const elapsed = (now - startedAt) / 1000;
        const poolWidth = width;
        const poolHeight = parseFloat(container.style.height);
        const scrollLag = scrollRef.current.lag;

        for (const node of nodes) {
          const { body, driftSeed, width: itemWidth, height: itemHeight } = node;
          const orbitX = Math.sin(elapsed * 0.4 + driftSeed) * 0.00014;
          const orbitY = Math.cos(elapsed * 0.3 + driftSeed * 0.7) * 0.00012;
          const tideX = Math.sin(elapsed * 0.19 + driftSeed * 0.33) * 0.00006;
          const tideY = Math.cos(elapsed * 0.24 + driftSeed * 0.41) * 0.000055;
          const wanderX = Math.sin(elapsed * 0.16 + driftSeed * 1.71) * 0.000045;
          const wanderY = Math.cos(elapsed * 0.18 + driftSeed * 1.29) * 0.000042;
          const edgePaddingX = itemWidth / 2 + horizontalGap * 0.55;
          const edgePaddingY = itemHeight / 2 + 40;
          const edgeForceX =
            body.position.x < edgePaddingX
              ? (edgePaddingX - body.position.x) * 0.0000022
              : body.position.x > poolWidth - edgePaddingX
                ? -(body.position.x - (poolWidth - edgePaddingX)) * 0.0000022
                : 0;
          const edgeForceY =
            body.position.y < edgePaddingY
              ? (edgePaddingY - body.position.y) * 0.000002
              : body.position.y > poolHeight - edgePaddingY
                ? -(body.position.y - (poolHeight - edgePaddingY)) * 0.000002
                : 0;
          const pointerPull = getPointerPull(
            pointerRef.current,
            body.position.x,
            body.position.y,
          );

          Body.applyForce(body, body.position, {
            x: orbitX + tideX + wanderX + edgeForceX + pointerPull.x,
            y: orbitY + tideY + wanderY + edgeForceY + pointerPull.y,
          });
        }

        scrollRef.current.vy *= 0.94;
        scrollRef.current.lag *= 0.9;

        for (let index = 0; index < nodes.length; index += 1) {
          const currentNode = nodes[index];

          for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
            const nextNode = nodes[nextIndex];
            const deltaX = nextNode.body.position.x - currentNode.body.position.x;
            const deltaY = nextNode.body.position.y - currentNode.body.position.y;
            const minDistance = (currentNode.width + nextNode.width) * 0.32;
            const distance = Math.hypot(deltaX, deltaY);

            if (!distance || distance >= minDistance) {
              continue;
            }

            const overlapRatio = (minDistance - distance) / minDistance;
            const forceX = (deltaX / distance) * overlapRatio * 0.00008;
            const forceY = (deltaY / distance) * overlapRatio * 0.00008;

            Body.applyForce(currentNode.body, currentNode.body.position, {
              x: -forceX,
              y: -forceY,
            });
            Body.applyForce(nextNode.body, nextNode.body.position, {
              x: forceX,
              y: forceY,
            });
          }
        }

        Engine.update(engine, 1000 / 60);

        for (const node of nodes) {
          const x = node.body.position.x - node.width / 2;
          const y = node.body.position.y - node.height / 2;
          const bobY = Math.sin(elapsed * 1.02 + node.driftSeed * 0.9) * 4.5;
          const floatAngle = Math.sin(elapsed * 0.64 + node.driftSeed) * 2;
          const scrollOffsetY = scrollLag * (0.22 + ((node.driftSeed % 1) + 1) * 0.04);
          const scrollOffsetX = scrollLag * 0.04 * Math.sin(node.driftSeed * 1.7);
          const scrollAngle = scrollLag * 0.02 * Math.cos(node.driftSeed * 1.3);

          node.element.style.transform = `translate3d(${x + scrollOffsetX}px, ${y + bobY + scrollOffsetY}px, 0) rotate(${floatAngle + scrollAngle}deg)`;
          node.element.style.opacity = "1";
        }

        frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);
    };

    const scheduleBuild = () => {
      if (resizeFrameId) {
        cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = requestAnimationFrame(buildWorld);
    };

    scheduleBuild();

    resizeObserver = new ResizeObserver(scheduleBuild);
    resizeObserver.observe(container);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    for (const element of setItemRef.values()) {
      resizeObserver.observe(element);
    }

    return () => {
      disposed = true;

      if (resizeFrameId) {
        cancelAnimationFrame(resizeFrameId);
      }

      resizeObserver?.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("scroll", handleScroll);
      cleanupWorld();
    };
  }, [links]);

  return (
    <section className="mt-0">
      <div
        ref={containerRef}
        className="relative min-h-[28rem] overflow-hidden rounded-[2.5rem] bg-transparent sm:min-h-[34rem] lg:min-h-[38rem]"
      >
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            ref={(element) => {
              if (element) {
                itemRefs.current.set(link.id, element);
              } else {
                itemRefs.current.delete(link.id);
              }
            }}
            onClick={(event) => {
              const suppressUntil = Number(event.currentTarget.dataset.dragSuppressUntil || 0);

              if (suppressUntil > Date.now()) {
                event.preventDefault();
              }
            }}
            className="surface-shell surface-shell-hover absolute left-0 top-0 inline-flex w-auto max-w-[calc(100vw-4rem)] rounded-full pl-0 pr-4 py-0 opacity-0 transition-[border-color,box-shadow,transform] duration-300 sm:max-w-[24rem] lg:max-w-[28rem]"
          >
            <div className="flex items-center gap-2.5">
              <PoolAvatar name={link.name} avatarUrl={link.avatarUrl} />

              <div className="min-w-0 max-w-[11rem] sm:max-w-[14rem] lg:max-w-[17rem]">
                <h2 className="break-words text-sm font-semibold tracking-tight text-primary">
                  {link.name}
                </h2>
                {link.description?.trim() ? (
                  <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-n-5">
                    {link.description.trim()}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PoolAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${name} avatar`}
        className="h-14 w-14 rounded-full object-cover ring-1 ring-n-2 dark:ring-white/14"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-n-1/80 text-sm font-semibold text-n-5 ring-1 ring-n-2 dark:bg-white/8 dark:text-n-5 dark:ring-white/14">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function randomFromSeed(seed: number) {
  const normalized = Math.sin(seed * 12.9898) * 43758.5453;
  return (normalized - Math.floor(normalized)) * 2 - 1;
}

function getPointerPull(
  pointer: { x: number; y: number; vx: number; vy: number; active: boolean },
  targetX: number,
  targetY: number,
) {
  if (!pointer.active) {
    return { x: 0, y: 0 };
  }

  const deltaX = pointer.x - targetX;
  const deltaY = pointer.y - targetY;
  const distance = Math.hypot(deltaX, deltaY);
  const influenceRadius = 420;

  if (!distance || distance > influenceRadius) {
    return { x: 0, y: 0 };
  }

  const normalizedInfluence = (influenceRadius - distance) / influenceRadius;
  const radialStrength = Math.pow(normalizedInfluence, 1.35) * 0.00085;
  const flowStrength = Math.pow(normalizedInfluence, 1.7) * 0.00006;

  return {
    x: (deltaX / distance) * radialStrength + pointer.vx * flowStrength,
    y: (deltaY / distance) * radialStrength + pointer.vy * flowStrength,
  };
}

function rectanglesOverlap(
  x1: number,
  y1: number,
  width1: number,
  height1: number,
  x2: number,
  y2: number,
  width2: number,
  height2: number,
  spacing: number,
) {
  const halfWidth1 = width1 / 2 + spacing / 2;
  const halfHeight1 = height1 / 2 + spacing / 2;
  const halfWidth2 = width2 / 2 + spacing / 2;
  const halfHeight2 = height2 / 2 + spacing / 2;

  return (
    Math.abs(x1 - x2) < halfWidth1 + halfWidth2 &&
    Math.abs(y1 - y2) < halfHeight1 + halfHeight2
  );
}

function estimatePoolHeight(nodes: SimNode[], width: number) {
  if (nodes.length === 0) {
    return 448;
  }

  const columnCount = width >= 1180 ? 4 : width >= 840 ? 3 : width >= 560 ? 2 : 1;
  const rows = Math.ceil(nodes.length / columnCount);
  const maxHeight = Math.max(...nodes.map((node) => node.height));
  return Math.max(448, rows * (maxHeight + 44) + 120);
}
