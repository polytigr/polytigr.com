import YAML from "yaml"
import { QuartzTransformerPlugin } from "../types"
import { BuildCtx } from "../../util/ctx"
import { renderLinktree } from "./linktree"

const EMBED_RE = /^[ \t]*!\[\[(files\/projects\/[^\]|#]+)(?:\|[^\]]*)?\]\][ \t]*$/
const SKETCHFAB_IFRAME_RE =
  /^[ \t]*<iframe\b[^>]*src="https:\/\/sketchfab\.com\/models\/[^"]+\/embed"[^>]*>\s*<\/iframe>[ \t]*$/i
const LINKTREE_RE =
  /<!--\s*linktree(?:\s*:\s*([^>]*?))?\s*-->\s*\r?\n((?:[ \t]*-[ \t]+\[[^\]]+\]\([^)\s]+\)[ \t]*\r?\n?)+)/i
const LIST_ITEM = /^[ \t]*-[ \t]+\[([^\]]+)\]\(([^)\s]+)\)[ \t]*$/

function isProjectNote(src: string): boolean {
  return /(?:^|\n)type:\s*project(?:\s|$)/m.test(src)
}

function splitFrontmatter(src: string): { fmRaw: string; body: string; fm: Record<string, unknown> } {
  if (!src.startsWith("---")) {
    return { fmRaw: "", body: src, fm: {} }
  }
  const end = src.indexOf("\n---", 3)
  if (end < 0) {
    return { fmRaw: "", body: src, fm: {} }
  }
  const fmRaw = src.slice(0, end + 4)
  const body = src.slice(end + 4).replace(/^\r?\n/, "")
  try {
    const data = YAML.parse(src.slice(3, end))
    const fm = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
    return { fmRaw, body, fm }
  } catch {
    return { fmRaw, body, fm: {} }
  }
}

function siteOrigin(baseUrl: string): string {
  return `https://${baseUrl.replace(/^https?:\/\//, "")}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function asString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  return null
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(asString).filter((v): v is string => Boolean(v))
  }
  const single = asString(value)
  return single ? [single] : []
}

function formatPrice(price: unknown): string | null {
  if (price == null || price === "") return "Free"
  if (typeof price === "number") {
    return price === 0 ? "Free" : `$${price}`
  }
  const raw = String(price).trim()
  if (!raw || raw === "0") return "Free"
  return raw.startsWith("$") ? raw : `$${raw}`
}

function buildSpecsHtml(fm: Record<string, unknown>): string {
  const rows: { label: string; value: string }[] = []
  const date = asString(fm.date)
  if (date) rows.push({ label: "Date", value: date })
  const field = asString(fm.field)
  if (field) rows.push({ label: "Field", value: field })
  const style = asString(fm.style)
  if (style) rows.push({ label: "Style", value: style })
  const software = asStringList(fm.software)
  if (software.length > 0) rows.push({ label: "Software", value: software.join(", ") })

  const downloadable = fm.downloadable === true || fm.downloadable === "true"
  if (downloadable) {
    const price = formatPrice(fm.price)
    if (price) rows.push({ label: "Price", value: price })
  }

  if (rows.length === 0) return ""
  const body = rows
    .map(
      ({ label, value }) =>
        `<div class="project-sidebar-row"><span class="project-sidebar-label">${escapeHtml(label)}</span><span class="project-sidebar-value">${escapeHtml(value)}</span></div>`,
    )
    .join("\n")
  return `<div class="project-sidebar-specs">\n${body}\n</div>`
}

function parseLinkItems(listBlock: string): { text: string; url: string }[] {
  return listBlock
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => {
      const m = line.match(LIST_ITEM)
      return m ? { text: m[1]!, url: m[2]! } : null
    })
    .filter((item): item is { text: string; url: string } => item !== null)
}

/**
 * Plain-MD project notes → media gallery + sidebar (title, desc, specs, linktree).
 * Authoring: embeds, # Title, prose, <!-- linktree --> list.
 */
export const ProjectLayout: QuartzTransformerPlugin = () => ({
  name: "ProjectLayout",
  textTransform(ctx: BuildCtx, src: string) {
    if (!isProjectNote(src)) {
      return src
    }

    const { fmRaw, body, fm } = splitFrontmatter(src)
    const lines = body.split(/\r?\n/)
    const mediaParts: string[] = []
    let i = 0
    const origin = siteOrigin(ctx.cfg.configuration.baseUrl ?? "")
    while (i < lines.length) {
      const line = lines[i]!
      if (line.trim() === "") {
        i++
        continue
      }
      const m = line.match(EMBED_RE)
      if (m) {
        mediaParts.push(`<img src="${escapeHtml(`${origin}/${m[1]}`)}" alt="">`)
        i++
        continue
      }
      if (SKETCHFAB_IFRAME_RE.test(line)) {
        mediaParts.push(line.trim())
        i++
        continue
      }
      break
    }

    const rest = lines.slice(i).join("\n").trim()
    if (mediaParts.length === 0 && !rest) {
      return src
    }

    const media =
      mediaParts.length > 0 ? `<div class="project-media">\n${mediaParts.join("\n")}\n</div>` : ""

    let title = ""
    let afterTitle = rest
    const titleMatch = rest.match(/^#\s+(.+?)(?:\s*\r?\n([\s\S]*))?$/)
    if (titleMatch) {
      title = titleMatch[1]!.trim()
      afterTitle = (titleMatch[2] ?? "").trim()
    }

    let desc = afterTitle
    let linktreeHtml = ""
    const lt = afterTitle.match(LINKTREE_RE)
    if (lt && lt.index != null) {
      desc = afterTitle.slice(0, lt.index).trim()
      const label = (lt[1] ?? "").trim() || "Project links"
      const items = parseLinkItems(lt[2]!)
      if (items.length > 0) {
        linktreeHtml = renderLinktree(label, items, origin, true)
      }
    }

    const descHtml = desc
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p class="project-sidebar-desc">${escapeHtml(p.replace(/\n/g, " "))}</p>`)
      .join("\n")

    const specs = buildSpecsHtml(fm)
    const sidebarParts = [
      title ? `<h1>${escapeHtml(title)}</h1>` : "",
      descHtml,
      specs,
      linktreeHtml,
    ].filter(Boolean)

    const aside =
      sidebarParts.length > 0
        ? `<aside class="project-sidebar">\n${sidebarParts.join("\n")}\n</aside>`
        : ""

    const out = [media, aside].filter(Boolean).join("\n\n")
    if (!out) {
      return src
    }
    return `${fmRaw}\n${out}\n`
  },
})

export default ProjectLayout
