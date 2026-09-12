/**
 * Tiny in-memory handoff so a photo scanned on one page can be opened in the
 * right tool on another page (client-side only, nothing is uploaded anywhere).
 */
let stash: File[] = [];

export function stashFiles(files: File[]): void {
  stash = stash.concat(files);
}

export function takeStashedFiles(): File[] {
  if (stash.length === 0) return [];
  const files = stash;
  stash = [];
  return files;
}
