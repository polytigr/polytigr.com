# polytigr.com

Source for [polytigr.com](https://polytigr.com/), my public site: portfolio, store, CV, and tools.

The site is built with [Quartz v5](https://quartz.jzhao.xyz/) ([GitHub](https://github.com/jackyzha0/quartz)).

## Fork this

Fork the repo if you want a similar personal site.

1. Replace `content/` with your pages, images, and files.
2. Set your site name and `baseUrl` in `quartz.config.yaml`.
3. Put your domain in `CNAME`, or delete `CNAME` if you use `username.github.io`.
4. Push the `v5` branch. GitHub Actions builds the site and deploys it to GitHub Pages.

You can keep or remove the extra Quartz code in `quartz/` (linktree buttons, project pages, portfolio filters, nav).

## Preview locally

```bash
npm ci
npx quartz build --serve
```

## Layout

- `content/`: markdown, Bases, and files
- `quartz/`: Quartz engine plus site-specific code
- `quartz.config.yaml`: site config
