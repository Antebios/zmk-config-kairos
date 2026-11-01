// The pages are the MkDocs sources, so the in-app manual and the website never differ.
const sources = import.meta.glob("../../docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const images = import.meta.glob("../../docs/img/*", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface ManualPage {
  slug: string;
  title: string;
}

// Same order and titles as `nav` in mkdocs.yml; docs.test.ts keeps them equal.
export const MANUAL_NAV: ManualPage[] = [
  { slug: "index", title: "Home" },
  { slug: "install", title: "Install and run" },
  { slug: "views", title: "The three views" },
  { slug: "reading-keys", title: "Reading a key" },
  { slug: "window-controls", title: "Window controls" },
  { slug: "live-sync", title: "Live layer sync" },
  { slug: "command-line", title: "Command line" },
  { slug: "keybindings", title: "Key bindings" },
  { slug: "hyprland", title: "Hyprland" },
  { slug: "reference", title: "Layer and combo reference" },
  { slug: "troubleshooting", title: "Troubleshooting" },
  { slug: "development", title: "Development" },
  { slug: "roadmap", title: "Roadmap" },
];

export const FIRST_PAGE = MANUAL_NAV[0].slug;

export function isPage(slug: string): boolean {
  return MANUAL_NAV.some((page) => page.slug === slug);
}

export function pageSource(slug: string): string {
  const key = `../../docs/${slug}.md`;
  return (
    sources[key] ??
    `# Page not found\n\nThere is no manual page called \`${slug}\`.`
  );
}

export function imageUrl(fileName: string): string | undefined {
  return images[`../../docs/img/${fileName}`];
}
