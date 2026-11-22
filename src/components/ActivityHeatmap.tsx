import { createMemo, createSignal, For, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { useSmoothFragmentScroll } from '@/src/fragment-scroll.ts'
import type { PostMeta } from '@/src/types/post.ts'

const styles = /* css */ `
.activity-heatmap {
  margin-block-start: 2rem;
}

.activity-scroll {
  overflow-x: auto;
  padding-block-end: 0.2rem;
}

.activity-calendar {
  min-width: 36rem;
  --activity-gap: 3px;
}

.activity-months,
.activity-grid {
  display: grid;
  grid-template-columns: repeat(var(--activity-weeks), minmax(0, 1fr));
  gap: var(--activity-gap);
}

.activity-months {
  margin-block-end: 0.3rem;
  color: var(--muted);
  font-size: 0.68rem;
}

.activity-months span {
  white-space: nowrap;
}

.activity-grid {
  grid-template-rows: repeat(7, auto);
  grid-auto-flow: column;
}

.activity-day {
  aspect-ratio: 1;
  border-radius: 2px;
}

.activity-day[data-level='0'] { background: #eee7dc; }
.activity-day[data-level='1'] { background: #e6caaa; }
.activity-day[data-level='2'] { background: #ca9c72; }
.activity-day[data-level='3'] { background: #ae774e; }
.activity-day[data-level='4'] { background: #8a532c; }

.activity-grid a.activity-day:hover {
  outline: 1px solid var(--muted);
  outline-offset: 1px;
}

.activity-tooltip {
  position: fixed;
  z-index: 2;
  inset-block-start: var(--activity-tip-y);
  inset-inline-start: clamp(6.5rem, var(--activity-tip-x), calc(100% - 6.5rem));
  max-width: min(12rem, calc(100vw - 1rem));
  padding: 0.3rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 0.25rem;
  background: var(--paper);
  color: var(--ink);
  font-size: 0.8rem;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 8px));
}
`

const day = 86_400_000
const monthLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
})
const tooltipMonth = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  timeZone: 'UTC',
})

function dateKey(time: number) {
  return new Date(time).toISOString().slice(0, 10)
}

function formatDay(dayOfMonth: number) {
  const lastTwoDigits = dayOfMonth % 100
  const suffix =
    lastTwoDigits >= 11 && lastTwoDigits <= 13
      ? 'th'
      : (['th', 'st', 'nd', 'rd'][dayOfMonth % 10] ?? 'th')
  return `${dayOfMonth}${suffix}`
}

export default function ActivityHeatmap(props: {
  posts: PostMeta[]
  hrefForDate: (date: string) => string
}) {
  const [tooltip, setTooltip] = createSignal<{
    label: string
    x: number
    y: number
  }>()
  const smoothScroll = useSmoothFragmentScroll()

  const showAtPointer = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    const label = (event.target as HTMLElement).dataset.activityLabel
    setTooltip(
      label ? { label, x: event.clientX, y: event.clientY } : undefined,
    )
  }

  const showAtFocus = (event: FocusEvent) => {
    const cell = event.target as HTMLElement
    const label = cell.dataset.activityLabel
    if (!label) return
    const bounds = cell.getBoundingClientRect()
    setTooltip({ label, x: bounds.left + bounds.width / 2, y: bounds.top })
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const priorMonthLength = new Date(
    Date.UTC(year - 1, month + 1, 0),
  ).getUTCDate()
  const start = Date.UTC(year - 1, month, Math.min(today, priorMonthLength) + 1)
  const end = Date.UTC(year, month, today)

  const calendar = createMemo(() => {
    const counts = new Map<string, number>()
    for (const { createdDate } of props.posts) {
      const date = createdDate.slice(0, 10)
      counts.set(date, (counts.get(date) ?? 0) + 1)
    }

    const gridStart = start - ((new Date(start).getUTCDay() + 6) % 7) * day
    const weeks = Math.ceil(((end - gridStart) / day + 1) / 7)
    const labels: { week: number; text: string }[] = []
    let total = 0

    const days = Array.from({ length: weeks * 7 }, (_, index) => {
      const time = gridStart + index * day
      if (time < start || time > end) return null

      const date = new Date(time)
      const key = dateKey(time)
      const count = counts.get(key) ?? 0
      const week = Math.floor(index / 7) + 1
      if (time === start || date.getUTCDate() === 1) {
        labels.push({ week, text: monthLabel.format(date).toUpperCase() })
      }
      total += count
      const label = `${count} ${count === 1 ? 'post' : 'posts'} on ${tooltipMonth.format(date)} ${formatDay(date.getUTCDate())}`
      return { key, count, label }
    })

    return {
      weeks,
      days,
      label: `${dateKey(start)} 至 ${dateKey(end)}，共 ${total} 篇文章`,
      labels: labels.filter(
        ({ week }, i) =>
          week < weeks && (i > 0 || !labels[1] || labels[1].week - week >= 3),
      ),
    }
  })

  return (
    <section class="activity-heatmap" aria-label="发文热力图">
      <style>{styles}</style>
      <div class="activity-scroll" onScroll={() => setTooltip(undefined)}>
        <div
          class="activity-calendar"
          style={{ '--activity-weeks': calendar().weeks }}
        >
          <div class="activity-months" aria-hidden="true">
            <For each={calendar().labels}>
              {(label) => (
                <span
                  style={{ 'grid-column': String(label.week), 'grid-row': '1' }}
                >
                  {label.text}
                </span>
              )}
            </For>
          </div>
          <div
            class="activity-grid"
            role="group"
            aria-label={calendar().label}
            onPointerOver={showAtPointer}
            onPointerMove={showAtPointer}
            onPointerLeave={() => setTooltip(undefined)}
            onFocusIn={showAtFocus}
            onFocusOut={() => setTooltip(undefined)}
          >
            <For each={calendar().days}>
              {(cell) => (
                <Show keyed when={cell} fallback={<span />}>
                  {(entry) => {
                    const attributes = {
                      class: 'activity-day',
                      'data-level': Math.min(entry.count, 4),
                      'data-activity-label': entry.label,
                      'aria-label': entry.label,
                      lang: 'en',
                    }
                    return entry.count ? (
                      <a
                        {...attributes}
                        href={props.hrefForDate(entry.key)}
                        target="_self"
                        onClick={(event) => {
                          setTooltip(undefined)
                          smoothScroll(event)
                        }}
                      />
                    ) : (
                      <time {...attributes} dateTime={entry.key} />
                    )
                  }}
                </Show>
              )}
            </For>
          </div>
        </div>
      </div>
      <Show when={tooltip()}>
        {(tip) => (
          <Portal>
            <div
              class="activity-tooltip"
              aria-hidden="true"
              lang="en"
              style={{
                '--activity-tip-x': `${tip().x}px`,
                '--activity-tip-y': `${tip().y}px`,
              }}
            >
              {tip().label}
            </div>
          </Portal>
        )}
      </Show>
    </section>
  )
}
