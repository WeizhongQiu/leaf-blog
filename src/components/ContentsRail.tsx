import { createEffect, For, onCleanup, onMount } from 'solid-js'

const styles = /* css */ `
.contents-rail {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--rail-width);
  height: 100%;
  pointer-events: none;
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
`

interface Props {
  rows: number
  position: number
  importantRows: number[]
  onPositionChange: (position: number, center: number) => void
}

export default function ContentsRail(props: Props) {
  let svg!: SVGSVGElement
  let marker!: SVGLineElement

  onMount(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let rowHeight = 0
    let frame = 0
    let previousTime = 0
    let target = props.position
    let upperRow = target
    let lowerRow = target

    const draw = () => {
      const position = (upperRow + lowerRow) / 2
      const middle = (position + 0.5) * rowHeight
      const stretch = Math.min(10, (lowerRow - upperRow) * rowHeight)
      // The rounded caps add a pixel to each end.
      const halfLength = 7 + stretch / 2

      marker.setAttribute('y1', String(middle - halfLength))
      marker.setAttribute('y2', String(middle + halfLength))
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
      rowHeight = svg.getBoundingClientRect().height / props.rows
      draw()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
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
          y1={`${50 / props.rows}%`}
          y2={`${100 - 50 / props.rows}%`}
        />
        <line ref={marker} class="contents-rail-marker" x1="50%" x2="50%" />
        <For each={props.importantRows}>
          {(row) => (
            <circle
              class="contents-rail-dot"
              cx="50%"
              cy={`${((row + 0.5) / props.rows) * 100}%`}
              r="2.25"
            />
          )}
        </For>
      </svg>
    </>
  )
}
