import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot } from "../util/path"

const LINKS = [
  { href: "", label: "PolyTigr" },
  { href: "store", label: "Store" },
  { href: "portfolio", label: "Portfolio" },
  { href: "cv", label: "CV" },
]

const SiteNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const base = pathToRoot(fileData.slug!)
  return (
    <nav class={classNames(displayClass, "site-nav")} aria-label="Site">
      <button
        type="button"
        class="site-nav-toggle"
        aria-expanded="false"
        aria-controls="site-nav-menu"
        aria-label="Open menu"
      >
        <svg class="site-nav-icon-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <svg class="site-nav-icon-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <ul id="site-nav-menu" class="site-nav-list">
        {LINKS.map((link) => (
          <li>
            <a href={link.href ? `${base}/${link.href}` : base}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Event delegation — SPA micromorph replaces header nodes and drops per-node listeners.
SiteNav.afterDOMLoaded = `
(function () {
  if (window.__polytigrSiteNavBound) return
  window.__polytigrSiteNavBound = true

  function siteNavCloseAll() {
    document.querySelectorAll("nav.site-nav.is-open").forEach((nav) => {
      nav.classList.remove("is-open")
      const btn = nav.querySelector(".site-nav-toggle")
      if (!btn) return
      btn.setAttribute("aria-expanded", "false")
      btn.setAttribute("aria-label", "Open menu")
    })
  }

  document.addEventListener("click", (e) => {
    const t = e.target
    if (!(t instanceof Element)) return
    const btn = t.closest(".site-nav-toggle")
    if (btn) {
      e.preventDefault()
      e.stopPropagation()
      const nav = btn.closest("nav.site-nav")
      if (!nav) return
      const willOpen = !nav.classList.contains("is-open")
      siteNavCloseAll()
      if (willOpen) {
        nav.classList.add("is-open")
        btn.setAttribute("aria-expanded", "true")
        btn.setAttribute("aria-label", "Close menu")
      }
      return
    }
    if (t.closest(".site-nav-list a") || !t.closest("nav.site-nav")) {
      siteNavCloseAll()
    }
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") siteNavCloseAll()
  })

  document.addEventListener("nav", siteNavCloseAll)
})()
`

export default (() => SiteNav) satisfies QuartzComponentConstructor
