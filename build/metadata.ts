import { readdirSync, readFileSync, statSync, type Stats } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import matter from 'gray-matter'
import type { PostMeta } from '@/src/types/post.ts'

export const markdownExtension = '.md'
const matterDatePattern =
  /^[a-z]+,\s+([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)\s+(\d{4}),\s+(1[0-2]|0?[1-9]):(\d{2}:\d{2})\s+([ap]m)$/i
const months =
  'january february march april may june july august september october november december'.split(
    ' ',
  )

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

function twoDigits(value: string | number): string {
  return String(value).padStart(2, '0')
}

function resolvePostDate(value: unknown, fallback: Date): string {
  const match = matterDatePattern.exec(text(value))
  if (!match) return fallback.toISOString()

  const [, monthName, day, year, hour, minutesAndSeconds, period] = match
  const month = months.indexOf(monthName.toLowerCase()) + 1
  const hours = (Number(hour) % 12) + (period.toLowerCase() === 'pm' ? 12 : 0)
  const date = new Date(
    `${year}-${twoDigits(month)}-${twoDigits(day)}T${twoDigits(hours)}:${minutesAndSeconds}Z`,
  )
  return (date.getUTCDate() === Number(day) ? date : fallback).toISOString()
}

function readFrontMatter(
  source: string,
  path: string,
): { fields: Record<string, unknown>; body: string } {
  // Only plain fences select YAML. Gray Matter also supports named engines.
  const opening = /^\uFEFF?---[ \t]*\r?\n/.exec(source)
  if (!opening || !/^---[ \t]*\r?$/m.test(source.slice(opening[0].length))) {
    return { fields: {}, body: source }
  }

  try {
    // Passing options disables Gray Matter's cache of whole articles.
    const { data, content } = matter(source, { language: 'yaml' })
    return { fields: data ?? {}, body: content }
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    throw contentError(
      path,
      'Front Matter',
      `Could not parse YAML: ${reason}`,
      cause,
    )
  }
}

export function readPost({ filePath, relativePath }: PostFile): {
  meta: PostMeta
  body: string
} {
  let source: string
  let times: Stats
  try {
    source = readFileSync(filePath, 'utf8')
    times = statSync(filePath)
  } catch (cause) {
    throw contentError(
      relativePath,
      'file',
      'Could not read the post or its timestamps.',
      cause,
    )
  }

  const { fields, body } = readFrontMatter(source, relativePath)
  const fileName = postFileName(relativePath)
  const [firstFolder, nested] = relativePath.split('/', 2)
  return {
    meta: {
      title: text(fields.title) || fileName,
      createdDate: resolvePostDate(
        fields['date created'],
        times.birthtimeMs ? times.birthtime : times.mtime,
      ),
      modifiedDate: resolvePostDate(fields['date modified'], times.mtime),
      fileName,
      description: text(fields.description),
      category: text(fields.category) || (nested ? firstFolder : '未分类'),
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
    if (left.createdDate !== right.createdDate) {
      return left.createdDate > right.createdDate ? -1 : 1
    }
    if (left.fileName === right.fileName) return 0
    return left.fileName < right.fileName ? -1 : 1
  })
}
