import { QuartzTransformerPlugin } from "../types"
import { BuildCtx } from "../../util/ctx"
import { escapeHTML } from "../../util/escape"

const DOMAIN_TO_ICON: Record<string, string> = {
  "youtube.com": "youtube.svg",
  "youtu.be": "youtube.svg",
  "instagram.com": "instagram.svg",
  "x.com": "x.svg",
  "twitter.com": "x.svg",
  "reddit.com": "reddit.svg",
  "tiktok.com": "tiktok.svg",
  "sketchfab.com": "sketchfab.svg",
  "linkedin.com": "linkedin.svg",
  "fab.com": "fab.svg",
  "cgtrader.com": "cgtrader.svg",
  "discord.com": "discord.svg",
  "discord.gg": "discord.svg",
}

export const LINKTREE_RE =
  /<!--\s*linktree(?:\s*:\s*([^>]*?))?\s*-->\s*\r?\n((?:[ \t]*-[ \t]+\[[^\]]+\]\([^)\s]+\)[ \t]*\r?\n?)+)/i

const LIST_ITEM = /^[ \t]*-[ \t]+\[([^\]]+)\]\(([^)\s]+)\)[ \t]*$/

export function siteOrigin(baseUrl: string): string {
  return `https://${baseUrl.replace(/^https?:\/\//, "")}`
}

function isPdfUrl(url: string): boolean {
  try {
    const path = url.startsWith("/") || url.startsWith(".") ? url : new URL(url).pathname
    return /\.pdf$/i.test(path)
  } catch {
    return /\.pdf($|\?)/i.test(url)
  }
}

function iconForUrl(url: string): string | null {
  if (url.startsWith("mailto:")) return "email.svg"
  if (isPdfUrl(url)) return "download.svg"
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase()
    for (const [domain, icon] of Object.entries(DOMAIN_TO_ICON)) {
      if (host === domain || host.endsWith(`.${domain}`)) return icon
    }
  } catch {
    return null
  }
  return null
}

export function parseLinkItems(listBlock: string): { text: string; url: string }[] {
  return listBlock
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const m = line.match(LIST_ITEM)
      return m ? [{ text: m[1]!, url: m[2]! }] : []
    })
}

function resolveSiteHref(url: string, origin: string): string {
  if (!url.startsWith("/")) return url
  const path = /\.[a-z0-9]+$/i.test(url) ? url.toLowerCase() : url
  return `${origin}${path}`
}

export function matchLinktree(src: string) {
  const m = src.match(LINKTREE_RE)
  if (!m || m.index == null) return null
  return { rawLabel: (m[1] ?? "").trim(), listBlock: m[2]!, index: m.index }
}

export function renderLinktree(
  label: string,
  items: { text: string; url: string }[],
  origin: string,
  sidebar: boolean,
): string {
  const aria = escapeHTML(label)
  const navClass = sidebar ? "linktree project-sidebar-links" : "linktree"
  const buttons = items
    .map(({ text, url }) => {
      const icon = iconForUrl(url)
      const iconHtml = icon
        ? `<img class="linktree-icon" src="${escapeHTML(`${origin}/files/icons/${icon}`)}" alt="" width="40" height="40">`
        : ""
      const href = resolveSiteHref(url, origin)
      const downloadAttr = isPdfUrl(url)
        ? ` download="${escapeHTML(href.split("/").pop() ?? "download.pdf")}"`
        : ""
      return `<a class="linktree-btn" href="${escapeHTML(href)}"${downloadAttr}>${iconHtml}<span class="linktree-label">${escapeHTML(text)}</span></a>`
    })
    .join("\n")
  return `<nav class="${navClass}" aria-label="${aria}">\n${buttons}\n</nav>`
}

export const Linktree: QuartzTransformerPlugin = () => ({
  name: "Linktree",
  textTransform(ctx: BuildCtx, src: string) {
    const origin = siteOrigin(ctx.cfg.configuration.baseUrl ?? "")
    return src.replace(new RegExp(LINKTREE_RE, "gi"), (match, rawLabel: string | undefined, listBlock: string) => {
      const items = parseLinkItems(listBlock)
      if (items.length === 0) return match
      return `${renderLinktree((rawLabel ?? "").trim() || "Links", items, origin, false)}\n\n`
    })
  },
})
