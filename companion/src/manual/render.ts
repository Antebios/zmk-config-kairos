import { marked } from "marked";

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false, gfm: true });
}

const PAGE_LINK = /^([a-z0-9-]+)\.md(?:#.*)?$/;

// The slug a relative link to another manual page points at, if it is one.
export function pageSlugFromHref(href: string): string | undefined {
  return PAGE_LINK.exec(href)?.[1];
}
