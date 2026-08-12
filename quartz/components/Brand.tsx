import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot } from "../util/path"

const Brand: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg.pageTitle ?? "PolyTigr"
  const base = pathToRoot(fileData.slug!)
  return (
    <h2 class={classNames(displayClass, "page-title", "brand")}>
      <a href={base}>
        <img
          class="brand-logo"
          src={`${base}/files/brand/logo.webp`}
          alt=""
          width={32}
          height={32}
        />
        <span class="brand-name">{title}</span>
      </a>
    </h2>
  )
}

export default (() => Brand) satisfies QuartzComponentConstructor
