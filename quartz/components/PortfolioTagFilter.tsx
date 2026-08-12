import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const PortfolioTagFilter: QuartzComponent = (_props: QuartzComponentProps) => {
  return null
}

PortfolioTagFilter.css = `
.portfolio-tag-filters {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 1rem 0;
}
.portfolio-tag-filters[hidden] {
  display: none;
}
.portfolio-tag-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.5rem;
  align-items: center;
  justify-content: center;
}
.portfolio-tag-filters-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gray);
  margin-right: 0.25rem;
}
.portfolio-tag-chip {
  appearance: none;
  border: 1px solid var(--lightgray);
  background: transparent;
  color: var(--darkgray);
  font-family: var(--bodyFont);
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0.28rem 0.65rem;
  border-radius: 2px;
  cursor: pointer;
  line-height: 1.2;
}
.portfolio-tag-chip:hover {
  border-color: var(--secondary);
  color: var(--secondary);
}
.portfolio-tag-chip.is-active {
  background: var(--secondary);
  border-color: var(--secondary);
  color: var(--light);
}
.portfolio-tag-chip[data-tag=""] {
  font-weight: 600;
}
.bases-card[hidden] {
  display: none !important;
}
body[data-slug="portfolio"] .bases-card-meta {
  display: none !important;
}
body[data-slug="store"] .bases-card-row[data-facet-row] {
  display: none !important;
}
`

PortfolioTagFilter.afterDOMLoaded = `
function portfolioNorm(value) {
  return String(value || "").trim().toLowerCase().replaceAll(" ", "-")
}

function portfolioFacetsFromDom(card) {
  const byGroup = { field: [], style: [], software: [] }
  card.querySelectorAll(".bases-card-row").forEach((row) => {
    const label = portfolioNorm(row.querySelector(".bases-card-label")?.textContent)
    let group = null
    if (label === "field") group = "field"
    else if (label === "style") group = "style"
    else if (label === "software") group = "software"
    if (!group) return
    row.dataset.facetRow = "1"
    row.querySelectorAll(".bases-card-value .bases-text").forEach((el) => {
      const raw = String(el.textContent || "").trim()
      if (!raw) return
      byGroup[group].push(raw)
    })
  })
  return byGroup
}

function portfolioCollectFacets(cards) {
  const groups = {
    field: new Map(),
    style: new Map(),
    software: new Map(),
  }
  cards.forEach((card) => {
    const facets = portfolioFacetsFromDom(card)
    const keys = []
    ;["field", "style", "software"].forEach((group) => {
      facets[group].forEach((raw) => {
        const key = group + ":" + portfolioNorm(raw)
        keys.push(key)
        groups[group].set(key, raw)
      })
    })
    card.dataset.facets = keys.join(" ")
  })
  return [
    { key: "field", label: "Field", items: [...groups.field].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label)) },
    { key: "style", label: "Style", items: [...groups.style].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label)) },
    { key: "software", label: "Software", items: [...groups.software].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label)) },
  ].filter((g) => g.items.length > 0)
}

function portfolioApplyFilter(root, selected) {
  const cards = root.querySelectorAll(".bases-card")
  const byGroup = {}
  selected.forEach((key) => {
    const i = key.indexOf(":")
    if (i < 1) return
    ;(byGroup[key.slice(0, i)] ||= []).push(key)
  })
  const groups = Object.values(byGroup)
  let visible = 0
  cards.forEach((card) => {
    const facets = (card.dataset.facets || "").split(/\\s+/).filter(Boolean)
    const show = groups.length === 0 || groups.every((keys) => keys.some((t) => facets.includes(t)))
    card.hidden = !show
    if (show) visible++
  })
  const meta = root.querySelector(".bases-view-meta")
  if (meta) {
    const total = cards.length
    meta.textContent = selected.size === 0
      ? "Showing " + total + " of " + total + " entries"
      : "Showing " + visible + " of " + total + " entries"
  }
}

function portfolioReadQuery(selected, chips) {
  const known = new Set(chips.map((btn) => btn.dataset.tag).filter(Boolean))
  const params = new URLSearchParams(window.location.search)
  ;["field", "style", "software"].forEach((group) => {
    params.getAll(group).forEach((raw) => {
      String(raw).split(",").forEach((value) => {
        const key = group + ":" + portfolioNorm(value)
        if (known.has(key)) selected.add(key)
      })
    })
  })
}

function portfolioWriteQuery(selected, chips) {
  const url = new URL(window.location.href)
  const groups = new Set()
  chips.forEach((btn) => {
    const tag = btn.dataset.tag || ""
    const i = tag.indexOf(":")
    if (i > 0) groups.add(tag.slice(0, i))
  })
  groups.forEach((group) => url.searchParams.delete(group))
  selected.forEach((key) => {
    const i = key.indexOf(":")
    if (i < 1) return
    const group = key.slice(0, i)
    if (!groups.has(group)) return
    url.searchParams.append(group, key.slice(i + 1))
  })
  history.replaceState({}, "", url)
}

function portfolioBuildFilters(page, groups) {
  let bar = page.querySelector(".portfolio-tag-filters")
  if (!bar) {
    bar = document.createElement("div")
    bar.className = "portfolio-tag-filters"
    bar.setAttribute("role", "group")
    bar.setAttribute("aria-label", "Filter portfolio")
    const anchor = page.querySelector(".bases-cards-wrapper") || page.querySelector(".bases-view-container") || page
    anchor.parentElement
      ? anchor.parentElement.insertBefore(bar, anchor)
      : page.prepend(bar)
  }
  bar.replaceChildren()
  const totalItems = groups.reduce((n, g) => n + g.items.length, 0)
  if (totalItems === 0) {
    bar.hidden = true
    return bar
  }
  bar.hidden = false

  const selected = new Set()
  const chips = []

  function syncChips() {
    chips.forEach((btn) => {
      const tag = btn.dataset.tag || ""
      const active = tag === "" ? selected.size === 0 : selected.has(tag)
      btn.classList.toggle("is-active", active)
      btn.setAttribute("aria-pressed", active ? "true" : "false")
    })
    portfolioApplyFilter(page, selected)
    portfolioWriteQuery(selected, chips)
  }

  const allRow = document.createElement("div")
  allRow.className = "portfolio-tag-filter-row"
  const all = document.createElement("button")
  all.type = "button"
  all.className = "portfolio-tag-chip is-active"
  all.dataset.tag = ""
  all.textContent = "All"
  all.setAttribute("aria-pressed", "true")
  all.addEventListener("click", () => {
    selected.clear()
    syncChips()
  })
  allRow.appendChild(all)
  chips.push(all)
  bar.appendChild(allRow)

  groups.forEach((group) => {
    const row = document.createElement("div")
    row.className = "portfolio-tag-filter-row"
    row.setAttribute("role", "group")
    row.setAttribute("aria-label", group.label)

    const label = document.createElement("span")
    label.className = "portfolio-tag-filters-label"
    label.textContent = group.label
    row.appendChild(label)

    group.items.forEach((item) => {
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "portfolio-tag-chip"
      btn.dataset.tag = item.key
      btn.textContent = item.label
      btn.setAttribute("aria-pressed", "false")
      btn.addEventListener("click", () => {
        if (selected.has(item.key)) selected.delete(item.key)
        else selected.add(item.key)
        syncChips()
      })
      row.appendChild(btn)
      chips.push(btn)
    })
    bar.appendChild(row)
  })

  portfolioReadQuery(selected, chips)
  syncChips()
  return bar
}

function portfolioInitTagFilters() {
  const slug = document.body?.dataset?.slug
  if (slug !== "portfolio" && slug !== "store") return
  document.querySelectorAll(".bases-page").forEach((page) => {
    const cards = page.querySelectorAll(".bases-card")
    if (cards.length === 0) return
    portfolioBuildFilters(page, portfolioCollectFacets(cards))
  })
}

document.addEventListener("nav", portfolioInitTagFilters)
document.addEventListener("render", portfolioInitTagFilters)
portfolioInitTagFilters()
`

export default (() => PortfolioTagFilter) satisfies QuartzComponentConstructor
