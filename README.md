# Public Service AI Observatory

An independent static journal edited by Arc Benedict Itegbe. It documents how public servants use AI and automation, with evidence labels, costs, limits and replication packs. The Think Tank is the contributor community. Views on the site are personal and are not official positions.

The site is plain HTML, CSS and JavaScript. A small Node script turns one Markdown file per case, tool or diary note into pages. Links are relative, so the same files work at the root of a server or under a project path such as `/Public-service-ai-observatory/`.

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm run build
npm run check
npm run preview
```

`npm run build` writes the site to `dist/`. `npm run check` fails if a page has a broken relative link, a skipped heading, an unlabelled form control, a missing alternative text, or a video frame that loads before a click.

`npm run preview` serves the built site at [http://127.0.0.1:8741/Public-service-ai-observatory/](http://127.0.0.1:8741/Public-service-ai-observatory/). Set `PORT` if you need another port.

## Add a case, a tool or a diary note

1. Copy the template and remove the underscore from the filename.
   - Cases: `content/cases/_template.md` to `content/cases/your-case-id.md`
   - Tools: `content/tools/_template.md` to `content/tools/your-tool.md`
   - Diary: `content/diary/_template.md` to `content/diary/yyyy-mm-dd-short-title.md`
2. Files whose names start with `_` are not published.
3. Fill in the front matter. A case summary should be about 35 words. The build stops if a case summary is shorter than 30 words or longer than 40.
4. Write the body in Markdown. Use a root path for an internal link, such as `[Methodology](/methodology/)`. The build rewrites it to a relative link.
5. Run `npm run build` and `npm run check`.

The founder’s byline is `Arc Benedict Itegbe, founder and editor`. Do not add an official title. Do not invent an impact figure, a partner logo or a testimonial. Label synthetic or proposed work as E0. The evidence labels are E0 Proposed, E1 Described, E2 Measured and E3 Replicated.

Ordinary pages (About, Join, and the rest) live in `content/pages/`. The homepage, the case library, the diary index and the weekly compendium are assembled by `scripts/build.mjs`.

## Add a weekly compendium edition

The weekly compendium page, the Weekly Audio Overviews section on Watch, and the latest-video area on the homepage all read one file: `content/compendium/editions.json`. The build sorts editions newest first, so a new object can sit anywhere in the `editions` array.

1. Copy the PDF to `assets/compendium/posts-compendium-YYYY-MM-DD.pdf`. The build publishes that folder at `assets/compendium/` on the site.
2. Add one object to `editions`:

```json
{
  "date": "YYYY-MM-DD",
  "week": "YYYY-Www",
  "title": "Posts Compendium for Weekly Audio Review",
  "theme": "A short line taken from that edition.",
  "pdf": "posts-compendium-YYYY-MM-DD.pdf",
  "audio": {
    "title": "Episode title",
    "youtubeId": "xxxxxxxxxxx",
    "url": "https://youtu.be/xxxxxxxxxxx",
    "date": "YYYY-MM-DD",
    "duration": "M:SS"
  }
}
```

Leave out `audio` when that week has no OraquulTV episode. Leave out `week` only when the PDF does not give a week label. Take `title` and `theme` from the edition. Do not add a personal name. The build rejects one.

3. Run `npm run build` and `npm run check`.

The playlist and channel addresses are the `series` object in the same file. Change them there if the OraquulTV address changes. Each episode is a card drawn by the site. The YouTube player loads only after a click, and it does not autoplay.

## Publish on GitHub Pages

The workflow in `.github/workflows/pages.yml` builds `dist/` and deploys it with GitHub Actions.

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main`, or run the “Deploy GitHub Pages” workflow by hand.

The published address will be `https://<user>.github.io/<repository>/`. Relative links follow that path. You do not set a base URL in the Markdown. This repository is served at `https://oraquul.github.io/Public-service-ai-observatory/`. The not-found page looks for the folder name `/Public-service-ai-observatory/` when it builds a home link. The repository name is case-sensitive in that path.

`dist/` is not committed. Actions builds it on each deploy.

## Forms

The join, contact and newsletter forms post to `https://formspree.io/f/mvkzbdqq`. No API key is stored in the repository. A submission is a request, not an approval and not a newsletter subscription unless that separate box was ticked. The privacy page is marked as a draft.

## First published case

`content/cases/case-ng-001.md` is the rehearsal article “An export-enquiry assistant that knows when to stop”. It is a simulated case built on synthetic data. The NEPC-themed scenario is fictional.
