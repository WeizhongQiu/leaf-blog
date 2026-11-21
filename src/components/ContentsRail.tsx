import { createEffect, createSignal, For, onCleanup, onMount } from 'solid-js'

const styles = /* css */ `
.contents-rail {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--rail-width);
  height: 100%;
  clip-path: inset(
    calc(var(--contents-rail-center, 50%) * var(--contents-rail-trim, 0))
    0
    calc((100% - var(--contents-rail-center, 50%)) * var(--contents-rail-trim, 0))
    0
  );
  pointer-events: none;
  transition: clip-path var(--contents-transition-duration, 340ms)
    cubic-bezier(0.16, 1, 0.3, 1);
}

.contents-rail-track,
.contents-rail-marker {
  stroke-linecap: round;
}

.contents-rail-track {
  stroke: #cec6b9;
}

.contents-rail-marker {
  stroke: var(--contents-marker);
  stroke-width: 2px;
}

.contents-rail-dot {
  fill: var(--contents-marker);
}

@media (prefers-reduced-motion: reduce) {
  .contents-rail {
    transition: none;
  }
}
`

interface Props {
  rows: number
  getList: () => HTMLOListElement
  position: number
  importantRows: number[]
  onPositionChange: (position: number, center: number) => void
}

export default function ContentsRail(props: Props) {
  let svg!: SVGSVGElement
  let marker!: SVGLineElement
  const [geometry, setGeometry] = createSignal({
    height: 0,
    rowHeight: 0,
    firstCenter: 0,
  })

  onMount(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const list = props.getList()

    let frame = 0
    let previousTime = 0
    let target = props.position
    let upperRow = target
    let lowerRow = target

    const draw = () => {
      const { height, rowHeight, firstCenter } = geometry()
      const position = (upperRow + lowerRow) / 2
      const middle = firstCenter + position * rowHeight
      const stretch = Math.min(10, (lowerRow - upperRow) * rowHeight)
      // The rounded caps add a pixel to each end.
      const halfLength = 7 + stretch / 2

      marker.setAttribute('y1', String(middle - halfLength))
      marker.setAttribute('y2', String(middle + halfLength))
      svg.style.setProperty(
        '--contents-rail-center',
        `${height ? (middle / height) * 100 : 50}%`,
      )
      props.onPositionChange(position, middle)
    }

    const snap = () => {
      window.cancelAnimationFrame(frame)
      frame = 0
      previousTime = 0
      upperRow = target
      lowerRow = target
      draw()
    }

    const animate = (time: number) => {
      const elapsed = previousTime ? Math.min(time - previousTime, 32) : 16
      previousTime = time
      const movingDown = target >= (upperRow + lowerRow) / 2
      const leading = Math.exp(-elapsed / 32)
      const trailing = Math.exp(-elapsed / 78)
      upperRow =
        target + (upperRow - target) * (movingDown ? trailing : leading)
      lowerRow =
        target + (lowerRow - target) * (movingDown ? leading : trailing)

      if (
        Math.abs(target - upperRow) < 0.001 &&
        Math.abs(target - lowerRow) < 0.001
      ) {
        snap()
      } else {
        draw()
        frame = window.requestAnimationFrame(animate)
      }
    }

    const measure = () => {
      const rail = svg.getBoundingClientRect()
      const entries = list.getBoundingClientRect()
      const rowHeight = entries.height / props.rows
      setGeometry({
        height: rail.height,
        rowHeight,
        firstCenter: entries.top - rail.top + rowHeight / 2,
      })
      draw()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    observer.observe(list)
    motion.addEventListener('change', snap)

    createEffect(() => {
      const next = props.position
      if (next === target) return

      target = next
      if (motion.matches) snap()
      else if (!frame) frame = window.requestAnimationFrame(animate)
    })

    onCleanup(() => {
      observer.disconnect()
      motion.removeEventListener('change', snap)
      window.cancelAnimationFrame(frame)
    })
  })

  return (
    <>
      <style>{styles}</style>
      <svg ref={svg} class="contents-rail" aria-hidden="true">
        <line
          class="contents-rail-track"
          x1="50%"
          x2="50%"
          y1={geometry().rowHeight / 2}
          y2={geometry().height - geometry().rowHeight / 2}
        />
        <line ref={marker} class="contents-rail-marker" x1="50%" x2="50%" />
        <For each={props.importantRows}>
          {(row) => (
            <circle
              class="contents-rail-dot"
              cx="50%"
              cy={geometry().firstCenter + row * geometry().rowHeight}
              r="2.25"
            />
          )}
        </For>
      </svg>
    </>
  )
}
