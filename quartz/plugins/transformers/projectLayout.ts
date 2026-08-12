import YAML from "yaml"
import { QuartzTransformerPlugin } from "../types"
import { BuildCtx } from "../../util/ctx"
import { escapeHTML } from "../../util/escape"
import { matchLinktree, parseLinkItems, renderLinktree, siteOrigin } from "./linktree"

const EMBED_RE = /^[ \t]*!\[\[(files\/projects\/[^\]|#]+)(?:\|[^\]]*)?\]\][ \t]*$/
const SKETCHFAB_IFRAME_RE =
  /^[ \t]*<iframe\b[^>]*src="https:\/\/sketchfab\.com\/models\/[^"]+\/embed"[^>]*>\s*<\/iframe>[ \t]*$/i

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
        `<div class="project-sidebar-row"><span class="project-sidebar-label">${escapeHTML(label)}</span><span class="project-sidebar-value">${escapeHTML(value)}</span></div>`,
    )
    .join("\n")
  return `<div class="project-sidebar-specs">\n${body}\n</div>`
}

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
        mediaParts.push(`<img src="${escapeHTML(`${origin}/${m[1]}`)}" alt="">`)
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
    const lt = matchLinktree(afterTitle)
    if (lt) {
      desc = afterTitle.slice(0, lt.index).trim()
      const items = parseLinkItems(lt.listBlock)
      if (items.length > 0) {
        linktreeHtml = renderLinktree(lt.rawLabel || "Project links", items, origin, true)
      }
    }

    const descHtml = desc
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p class="project-sidebar-desc">${escapeHTML(p.replace(/\n/g, " "))}</p>`)
      .join("\n")

    const specs = buildSpecsHtml(fm)
    const sidebarParts = [
      title ? `<h1>${escapeHTML(title)}</h1>` : "",
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
