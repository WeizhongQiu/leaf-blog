import config from '../blog.config.json' with { type: 'json' }

interface PageVisibility {
  show?: boolean
}

interface BlogConfig {
  authorName: string
  showBackToTop?: boolean
  fontWeight?: string
  page: {
    homepage: { subtitle?: string }
    post: { directory: string; tocAutoHide?: boolean }
    timeline?: PageVisibility
    categories?: PageVisibility
    random?: PageVisibility
    about?: PageVisibility & { file?: string }
  }
}

const settings: BlogConfig = config
export const { authorName, page, showBackToTop = true } = settings
export const fontWeight = settings.fontWeight === 'normal' ? 'normal' : 'light'

export function isPageEnabled(
  name: 'timeline' | 'categories' | 'random' | 'about',
) {
  return page[name]?.show !== false
}
