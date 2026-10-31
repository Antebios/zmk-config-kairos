import { For, createEffect, createMemo } from "solid-js";
import { MANUAL_NAV, imageUrl, isPage, pageSource } from "../manual/pages";
import { pageSlugFromHref, renderMarkdown } from "../manual/render";
import { manualPage, setManualPage } from "../store";

// Pages link to each other, and to images, with the relative paths MkDocs needs.
function enhance(root: HTMLElement): void {
  for (const anchor of root.querySelectorAll("a")) {
    const href = anchor.getAttribute("href") ?? "";
    const slug = pageSlugFromHref(href);
    if (slug && isPage(slug)) {
      anchor.dataset.page = slug;
    } else {
      anchor.classList.add("external");
      anchor.title = href;
    }
    anchor.setAttribute("href", "#");
  }
  for (const image of root.querySelectorAll("img")) {
    const name = (image.getAttribute("src") ?? "").split("/").pop() ?? "";
    const url = imageUrl(name);
    if (url) image.src = url;
  }
}

export function Manual() {
  let article!: HTMLElement;
  const html = createMemo(() => renderMarkdown(pageSource(manualPage())));

  createEffect(() => {
    html();
    enhance(article);
  });

  // Links to other websites are inert so the web view can never leave the app.
  const onClick = (event: MouseEvent) => {
    const anchor = (event.target as Element).closest("a");
    if (!anchor) return;
    event.preventDefault();
    const slug = anchor.dataset.page;
    if (slug) {
      setManualPage(slug);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <section class="manual">
      <nav class="manual-nav" aria-label="Manual pages">
        <For each={MANUAL_NAV}>
          {(page) => (
            <button
              classList={{ active: manualPage() === page.slug }}
              aria-current={manualPage() === page.slug ? "page" : undefined}
              onClick={() => {
                setManualPage(page.slug);
                window.scrollTo({ top: 0 });
              }}
            >
              {page.title}
            </button>
          )}
        </For>
      </nav>
      <article
        class="manual-page"
        ref={article}
        innerHTML={html()}
        onClick={onClick}
      />
    </section>
  );
}
