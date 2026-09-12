"use client";

import { useCallback, useState } from "react";
import { buildFileName, randomFileStem, sanitizeFileName, slugPrefix } from "@/lib/filename";

export interface FileNameState {
  /** Name without extension (already sanitized: no spaces). */
  stem: string;
  /** Extension without the dot. */
  ext: string;
  /** stem + "." + ext — the exact name the file will be downloaded with. */
  fileName: string;
  /** Rename: user input, sanitized (spaces become "-"). */
  setName: (raw: string) => void;
  /** Replace the current name with a brand new random one. */
  randomize: () => string;
}

/**
 * Keeps the output file name of a tool in state.
 * Starts as a random name (date + time + random token) and can be renamed freely —
 * every rename is sanitized so a space can never end up in the name.
 */
export function useFileName(prefix: string, ext: string = "jpg", initial?: string): FileNameState {
  const [stem, setStem] = useState<string>(() =>
    sanitizeFileName(initial ?? randomFileStem(slugPrefix(prefix)))
  );

  const setName = useCallback((raw: string) => {
    setStem(sanitizeFileName(raw));
  }, []);

  const randomize = useCallback(() => {
    const next = randomFileStem(slugPrefix(prefix));
    setStem(next);
    return next;
  }, [prefix]);

  return { stem, ext, fileName: buildFileName(stem, ext), setName, randomize };
}
