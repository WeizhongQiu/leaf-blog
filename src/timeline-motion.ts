const duration = 420
const easing = 'cubic-bezier(.42, 0, .24, 1)'

function measure(viewport: HTMLElement) {
  const origin = viewport.getBoundingClientRect()
  return new Map(
    Array.from(
      viewport.querySelectorAll<HTMLElement>('[data-timeline-motion]'),
      (element) => {
        const { top, left, width, height } = element.getBoundingClientRect()
        return [
          element.dataset.timelineMotion!,
          {
            element,
            list: element.closest('.timeline-list'),
            top: top - origin.top,
            left: left - origin.left,
            width,
            height,
          },
        ] as const
      },
    ),
  )
}

const translate = (offset: number) => `translateY(${offset}px)`

export async function animateTimeline(
  viewport: HTMLElement,
  update: () => void,
  movingUp: boolean,
  signal: AbortSignal,
) {
  const before = measure(viewport)
  update()
  // Solid commits the final layout before the browser paints the next frame.
  await Promise.resolve()
  if (signal.aborted) return

  const after = measure(viewport)
  const animations: Animation[] = []
  const clippedLists = new Set<Element>()
  const overlay = document.createElement('div')
  const cleanUp = () => {
    for (const animation of animations) animation.cancel()
    overlay.remove()
    for (const list of clippedLists)
      list.removeAttribute('data-timeline-reveal')
  }
  const play = (
    element: HTMLElement,
    frames: Keyframe[],
    timing: KeyframeAnimationOptions = {},
  ) => {
    const animation = element.animate(frames, {
      duration,
      easing,
      fill: 'both',
      ...timing,
    })
    animations.push(animation)
  }
  const slide = (element: HTMLElement, from: number, to: number) => {
    if (Math.abs(from - to) > 0.1) {
      play(element, [
        { transform: translate(from) },
        { transform: translate(to) },
      ])
    }
  }

  signal.addEventListener('abort', cleanUp, { once: true })
  try {
    const retained = [...after].flatMap(([key, next]) => {
      const old = before.get(key)
      return old ? [{ old, next, shift: next.top - old.top }] : []
    })
    for (const { next, shift } of retained) slide(next.element, -shift, 0)

    const entering = [...after].filter(([key]) => !before.has(key))
    if (movingUp) entering.reverse()
    for (const [index, [, next]] of entering.entries()) {
      const list = next.list
      if (movingUp && list) {
        const last = list.lastElementChild as HTMLElement | null
        const end = after.get(last?.dataset.timelineMotion ?? '')
        const below =
          end &&
          retained.find(({ next }) => next.top >= end.top + end.height - 1)
        if (below && below.shift > 0) {
          // The list passes through the edge beneath its heading, last row first.
          list.setAttribute('data-timeline-reveal', '')
          clippedLists.add(list)
          slide(next.element, -below.shift, 0)
          continue
        }
      }

      const last = retained.at(-1)
      const enteringBottom = !movingUp && last && next.top > last.next.top
      slide(next.element, enteringBottom ? -last.shift : movingUp ? -6 : 6, 0)
      play(next.element, [{ opacity: 0 }, { opacity: 1 }], {
        delay: (enteringBottom ? 125 : 0) + Math.min(index * 16, 100),
        duration: 140,
        easing: 'ease-out',
      })
    }

    const exiting = [...before].filter(([key]) => !after.has(key))
    if (movingUp) exiting.reverse()
    if (exiting.length) {
      overlay.className = 'timeline-exit-layer'
      overlay.inert = true
      overlay.setAttribute('aria-hidden', 'true')
      viewport.append(overlay)
    }

    const departingBottom = document.createElement('div')
    departingBottom.className = 'timeline-exit-layer'
    const last = retained.at(-1)
    const collapsingLists = new Map<Element, HTMLElement>()
    let articleOrder = 0

    for (const [, old] of exiting) {
      const copy = old.element.cloneNode(true) as HTMLElement
      Object.assign(copy.style, {
        position: 'absolute',
        top: `${old.top}px`,
        left: `${old.left}px`,
        width: `${old.width}px`,
        height: `${old.height}px`,
      })
      const list = old.list
      const below =
        !movingUp &&
        list &&
        retained.find(({ old: item }) => item.top >= old.top + old.height - 1)
      if (list && below && below.shift < 0) {
        let layer = collapsingLists.get(list)
        if (!layer) {
          layer = document.createElement('div')
          layer.className = 'timeline-exit-layer'
          layer.style.clipPath = `inset(${old.top}px -0.25rem 0)`
          overlay.append(layer)
          collapsingLists.set(list, layer)
        }
        layer.append(copy)
        slide(copy, 0, below.shift)
        continue
      }

      const bottom = movingUp && last && old.top > last.old.top
      const layer = bottom ? departingBottom : overlay
      layer.append(copy)
      const delay = list ? Math.min(articleOrder++ * 18, 100) : 155
      play(
        copy,
        [
          { transform: translate(0), opacity: 1 },
          { transform: translate(-5), opacity: 0 },
        ],
        { delay, duration: 105, easing: 'ease-out' },
      )
    }

    if (departingBottom.childElementCount && last) {
      overlay.append(departingBottom)
      slide(departingBottom, 0, last.shift)
    }

    await Promise.allSettled(animations.map((animation) => animation.finished))
  } finally {
    signal.removeEventListener('abort', cleanUp)
    cleanUp()
  }
}
