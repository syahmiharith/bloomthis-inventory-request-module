import { unstable_cache } from "next/cache";

export function cachedRead<T>(
  load: () => Promise<T>,
  keyParts: string[],
  options: { tags: string[] },
) {
  if (process.env.NODE_ENV === "test") {
    return load;
  }

  return unstable_cache(load, keyParts, options);
}
