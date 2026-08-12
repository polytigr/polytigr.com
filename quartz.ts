import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import type { FullPageLayout } from "./quartz/cfg"
import Brand from "./quartz/components/Brand"
import SiteNav from "./quartz/components/SiteNav"
import SiteFooter from "./quartz/components/SiteFooter"
import PortfolioTagFilter from "./quartz/components/PortfolioTagFilter"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import { Linktree } from "./quartz/plugins/transformers/linktree"
import { ProjectLayout } from "./quartz/plugins/transformers/projectLayout"

const config = await loadQuartzConfig()
config.plugins.transformers.unshift(ProjectLayout(), Linktree())

const brand = Brand()
const nav = SiteNav()
const siteFooter = SiteFooter()
const portfolioTagFilter = PortfolioTagFilter()
const base = await loadQuartzLayout()

function withSiteChrome(layout: Partial<FullPageLayout>): Partial<FullPageLayout> {
  // Config header is theme toggle only (search + page-title disabled).
  // Order: brand | SiteNav | darkmode (toggle is the rightmost control).
  const rest = layout.header ?? []
  const afterBody = [...(layout.afterBody ?? []), portfolioTagFilter]
  return {
    ...layout,
    header: [brand, nav, ...rest],
    afterBody,
    footer: [siteFooter],
  }
}

const layoutWithChrome = {
  defaults: withSiteChrome(base.defaults),
  byPageType: Object.fromEntries(
    Object.entries(base.byPageType).map(([pageType, pageLayout]) => [
      pageType,
      withSiteChrome(pageLayout),
    ]),
  ),
}

// loadQuartzConfig() bakes layout into PageTypeDispatcher without the quartz.ts
// layout export — replace the dispatcher so Brand + SiteNav actually render.
config.plugins.emitters = config.plugins.emitters.map((emitter) =>
  emitter.name === "PageTypeDispatcher" ? PageTypeDispatcher(layoutWithChrome)! : emitter,
)

export default config
export const layout = layoutWithChrome
