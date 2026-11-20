export function postPath(fileName: string) {
  return `/posts/${encodeURIComponent(fileName)}`
}
