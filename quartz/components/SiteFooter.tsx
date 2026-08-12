import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot } from "../util/path"

const SiteFooter: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const base = pathToRoot(fileData.slug!)
  const year = new Date().getFullYear()
  return (
    <footer class={classNames(displayClass, "site-footer")}>
      <p class="footer-copy">© {year} PolyTigr.</p>
      <ul>
        <li>
          <a href={`${base}/privacy`}>Privacy Policy</a>
        </li>
        <li>
          <a href={`${base}/license`}>License Terms</a>
        </li>
        <li>
          <a href="mailto:contact@polytigr.com">Contact</a>
        </li>
        <li>
          <a href="https://github.com/polytigr/polytigr.com">Source</a>
        </li>
      </ul>
      <p class="footer-made">
        Made with <a href="https://quartz.jzhao.xyz/">Quartz</a>
      </p>
    </footer>
  )
}

export default (() => SiteFooter) satisfies QuartzComponentConstructor
