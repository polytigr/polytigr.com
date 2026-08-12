import { QuartzTransformerPlugin } from "../types"
import { BuildCtx } from "../../util/ctx"

const DOMAIN_TO_ICON: Record<string, string> = {
  "youtube.com": "youtube.svg",
  "youtu.be": "youtube.svg",
  "instagram.com": "instagram.svg",
  "x.com": "x.svg",
  "twitter.com": "x.svg",
  "reddit.com": "reddit.svg",
  "tiktok.com": "tiktok.svg",
  "artstation.com": "artstation.png",
  "sketchfab.com": "sketchfab.svg",
  "itch.io": "itch.png",
  "linkedin.com": "linkedin.svg",
  "fab.com": "fab.svg",
  "cgtrader.com": "cgtrader.svg",
  "3dexport.com": "3dexport.png",
  "gumroad.com": "gumroad.png",
  "discord.com": "discord.svg",
  "discord.gg": "discord.svg",
  "superhivemarket.com": "superhive.png",
}

const LINKTREE_BLOCK =
  /<!--\s*linktree(?:\s*:\s*([^>]*?))?\s*-->\s*\r?\n((?:[ \t]*-[ \t]+\[[^\]]+\]\([^)\s]+\)[ \t]*\r?\n?)+)/gi

const LIST_ITEM = /^[ \t]*-[ \t]+\[([^\]]+)\]\(([^)\s]+)\)[ \t]*$/

function siteOrigin(baseUrl: string): string {
  const cleaned = baseUrl.replace(/^https?:\/\//, "")
  return `https://${cleaned}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function isPdfUrl(url: string): boolean {
  try {
    const path = url.startsWith("/") || url.startsWith(".")
      ? url
      : new URL(url).pathname
    return /\.pdf$/i.test(path)
  } catch {
    return /\.pdf($|\?)/i.test(url)
  }
}

function iconForUrl(url: string): string | null {
  if (url.startsWith("mailto:")) {
    return "email.svg"
  }
  if (isPdfUrl(url)) {
    return "download.svg"
  }
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase()
    for (const [domain, icon] of Object.entries(DOMAIN_TO_ICON)) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        return icon
      }
    }
  } catch {
    return null
  }
  return null
}

function resolveSiteHref(url: string, origin: string): string {
  if (!url.startsWith("/")) {
    return url
  }
  // Assets emitter slugifies file paths (lowercase). Match that so casing can't 404.
  const path = /\.[a-z0-9]+$/i.test(url) ? url.toLowerCase() : url
  return `${origin}${path}`
}

export function renderLinktree(
  label: string,
  items: { text: string; url: string }[],
  origin: string,
  sidebar: boolean,
): string {
  const aria = escapeHtml(label)
  const navClass = sidebar ? "linktree project-sidebar-links" : "linktree"
  const buttons = items
    .map(({ text, url }) => {
      const icon = iconForUrl(url)
      const iconHtml = icon
        ? `<img class="linktree-icon" src="${escapeHtml(`${origin}/files/icons/${icon}`)}" alt="" width="40" height="40">`
        : ""
      const href = resolveSiteHref(url, origin)
      const downloadAttr = isPdfUrl(url)
        ? ` download="${escapeHtml(href.split("/").pop() ?? "download.pdf")}"`
        : ""
      return `<a class="linktree-btn" href="${escapeHtml(href)}"${downloadAttr}>${iconHtml}<span class="linktree-label">${escapeHtml(text)}</span></a>`
    })
    .join("\n")
  return `<nav class="${navClass}" aria-label="${aria}">\n${buttons}\n</nav>`
}

export const Linktree: QuartzTransformerPlugin = () => ({
  name: "Linktree",
  textTransform(ctx: BuildCtx, src: string) {
    const origin = siteOrigin(ctx.cfg.configuration.baseUrl ?? "")
    return src.replace(LINKTREE_BLOCK, (match, rawLabel: string | undefined, listBlock: string) => {
      const items = listBlock
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0)
        .map((line) => {
          const m = line.match(LIST_ITEM)
          if (!m) {
            return null
          }
          return { text: m[1], url: m[2] }
        })
        .filter((item): item is { text: string; url: string } => item !== null)

      if (items.length === 0) {
        return match
      }

      const label = (rawLabel ?? "").trim() || "Links"
      // CommonMark needs a blank line after an HTML block before markdown resumes
      // (headings, wikilink embeds, etc.).
      return `${renderLinktree(label, items, origin, false)}\n\n`
    })
  },
})

export default Linktree
