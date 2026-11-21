import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import matter from 'gray-matter'
import type { PostMeta } from '@/src/types/post.ts'

export const markdownExtension = '.md'

interface PostFile {
  filePath: string
  relativePath: string
}

export interface PostSource extends PostFile {
  meta: PostMeta
}

export function postFileName(path: string): string {
  return basename(path).slice(0, -markdownExtension.length)
}

function contentError(
  path: string,
  field: string,
  reason: string,
  cause?: unknown,
) {
  return new Error(`${path} [${field}] ${reason}`, { cause })
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function resolvePostDate(
  value: unknown,
  filePath: string,
  path: string,
): string {
  if (value == null || (typeof value === 'string' && !value.trim())) {
    try {
      return statSync(filePath).mtime.toISOString().slice(0, 10)
    } catch (cause) {
      throw contentError(
        path,
        'date',
        'Could not read the file modification date.',
        cause,
      )
    }
  }

  const date =
    value instanceof Date && Number.isFinite(value.getTime())
      ? value.toISOString().slice(0, 10)
      : text(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw contentError(path, 'date', 'Expected a date in YYYY-MM-DD format.')
  }
  return date
}

function readFrontMatter(source: string, path: string) {
  // Only plain fences select YAML. Gray Matter also supports named engines.
  const opening = /^\uFEFF?---[ \t]*\r?\n/.exec(source)
  if (!opening || !/^---[ \t]*\r?$/m.test(source.slice(opening[0].length))) {
    return { fields: {}, body: source }
  }

  let parsed: ReturnType<typeof matter>
  try {
    // Passing options disables Gray Matter's cache of whole articles.
    parsed = matter(source, { language: 'yaml' })
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    throw contentError(
      path,
      'Front Matter',
      `Could not parse YAML: ${reason}`,
      cause,
    )
  }

  const data: unknown = parsed.data
  if (
    typeof data !== 'object' ||
    data === null ||
    Object.getPrototypeOf(data) !== Object.prototype
  ) {
    throw contentError(path, 'Front Matter', 'Expected a YAML mapping.')
  }

  return { fields: data as Record<string, unknown>, body: parsed.content }
}

export function readPost({ filePath, relativePath }: PostFile): {
  meta: PostMeta
  body: string
} {
  let source: string
  try {
    source = readFileSync(filePath, 'utf8')
  } catch (cause) {
    throw contentError(relativePath, 'file', 'Could not read the post.', cause)
  }

  const { fields, body } = readFrontMatter(source, relativePath)
  const fileName = postFileName(relativePath)
  return {
    meta: {
      title: text(fields.title) || fileName,
      date: resolvePostDate(fields.date, filePath, relativePath),
      fileName,
      description: text(fields.description),
    },
    body,
  }
}

export function scanPosts(directory: string, aboutFile: string): PostSource[] {
  let paths: string[]
  try {
    paths = readdirSync(directory, { recursive: true, withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith(markdownExtension) &&
          relative(aboutFile, join(entry.parentPath, entry.name)) !== '',
      )
      .map((entry) =>
        relative(directory, join(entry.parentPath, entry.name))
          .split(sep)
          .join('/'),
      )
      .sort()
  } catch (cause) {
    throw contentError(
      directory,
      'directory',
      'Could not scan the posts directory. Check the path and read permissions.',
      cause,
    )
  }

  const pathsByFileName = new Map<string, string>()
  const posts = paths.map((path) => {
    const fileName = postFileName(path)
    if (!fileName || fileName === '.' || fileName === '..') {
      throw contentError(
        path,
        'fileName',
        'The file name must form a URL path segment.',
      )
    }

    const previous = pathsByFileName.get(fileName)
    if (previous !== undefined) {
      throw contentError(
        path,
        'fileName',
        `File name "${fileName}" is already used by ${previous}.`,
      )
    }

    pathsByFileName.set(fileName, path)
    const file = { filePath: join(directory, path), relativePath: path }
    return { ...file, meta: readPost(file).meta }
  })

  return posts.sort(({ meta: left }, { meta: right }) => {
    if (left.date !== right.date) return left.date > right.date ? -1 : 1
    if (left.fileName === right.fileName) return 0
    return left.fileName < right.fileName ? -1 : 1
  })
}
