import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import {
  DISCLAIMER,
  EVIDENCE_LEVELS,
  FOOTER,
  NAV,
  PILLARS,
  escapeHtml,
  evidenceLabel,
  formatDate,
  parseFrontMatter,
  pillarName,
  readingMinutes,
  relativeHref,
  rewriteRootLinks,
  slugify,
  words,
} from "./lib.mjs";
import { contactForm, joinForm, newsletterForm } from "./forms.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const content = path.join(root, "content");

marked.setOptions({ gfm: true, breaks: false });

function loadDir(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .map((name) => {
      const raw = fs.readFileSync(path.join(directory, name), "utf8");
      const parsed = parseFrontMatter(raw);
      return {
        slug: name.replace(/\.md$/, ""),
        file: path.join(directory, name),
        ...parsed,
      };
    });
}

function requireFields(item, fields) {
  for (const field of fields) {
    if (!item.data[field]) {
      throw new Error(`${item.file} is missing front matter: ${field}`);
    }
  }
}

function addHeadingIds(html) {
  const used = new Set();
  return html.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    let id = slugify(inner) || "section";
    let n = 2;
    while (used.has(id)) {
      id = `${slugify(inner) || "section"}-${n}`;
      n += 1;
    }
    used.add(id);
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
}

function wrapTables(html) {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, (block, offset) => {
    const before = html.slice(Math.max(0, offset - 160), offset);
    const fixed = block.replace(/<th(?![^>]*\bscope=)>/g, '<th scope="col">');
    if (before.includes('class="table-wrap"')) return fixed;
    return `<div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable table">${fixed}</div>`;
  });
}

function applySlots(html) {
  return html
    .replace(/<p>\s*\{\{join-form\}\}\s*<\/p>/g, joinForm())
    .replace(/<p>\s*\{\{contact-form\}\}\s*<\/p>/g, contactForm())
    .replace(/<p>\s*\{\{newsletter-form\}\}\s*<\/p>/g, newsletterForm())
    .replaceAll("{{join-form}}", joinForm())
    .replaceAll("{{contact-form}}", contactForm())
    .replaceAll("{{newsletter-form}}", newsletterForm());
}

function renderMarkdown(markdown, fromUrl) {
  let html = marked.parse(markdown);
  html = applySlots(html);
  html = addHeadingIds(html);
  html = wrapTables(html);
  html = rewriteRootLinks(html, fromUrl);
  return html;
}

function tocFrom(html) {
  const items = [];
  const pattern = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  let match;
  while ((match = pattern.exec(html))) {
    items.push({
      id: match[1],
      text: match[2].replace(/<[^>]+>/g, ""),
    });
  }
  return items;
}

function layout({ url, title, description, nav, body }) {
  const fullTitle =
    nav === "home" ? title : `${title} · Public Service AI Observatory`;
  const css = relativeHref(url, "assets/site.css");
  const script = relativeHref(url, "assets/site.js");
  const icon = relativeHref(url, "assets/favicon.svg");
  const home = relativeHref(url, "");

  const navItems = NAV.map((item) => {
    const current = item.key === nav ? ' aria-current="page"' : "";
    return `<li><a href="${relativeHref(url, item.href)}"${current}>${item.label}</a></li>`;
  }).join("");

  const footerItems = FOOTER.map(
    (item) =>
      `<li><a href="${relativeHref(url, item.href)}">${item.label}</a></li>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="Arc Benedict Itegbe">
  <meta name="theme-color" content="#173F35">
  <link rel="icon" href="${icon}" type="image/svg+xml">
  <link rel="stylesheet" href="${css}">
  <script>document.documentElement.classList.add("js")</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="shell identity">
      <p class="eyebrow">An independent journal</p>
      <a class="wordmark" href="${home}">Public Service AI Observatory</a>
      <div class="wordmark-rule" aria-hidden="true"></div>
      <p class="tagline">Evidence for better public service</p>
    </div>
    <div class="nav-bar">
      <div class="shell nav-row">
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
        <nav id="site-nav" class="site-nav" aria-label="Primary">
          <ul>${navItems}</ul>
        </nav>
      </div>
    </div>
  </header>
  <main id="main">
    ${body}
  </main>
  <footer class="site-footer">
    <div class="shell">
      <p class="footer-name">Public Service AI Observatory and Think Tank</p>
      <p class="disclaimer">${escapeHtml(DISCLAIMER)}</p>
      <nav aria-label="Footer">
        <ul>${footerItems}</ul>
      </nav>
      <p class="footer-meta">Founded and edited by Arc Benedict Itegbe. Core cases stay free to read. No third-party logos are shown.</p>
    </div>
  </footer>
  <script src="${script}" defer></script>
</body>
</html>
`;
}

function writePage(url, html) {
  const file = url
    ? path.join(dist, url, "index.html")
    : path.join(dist, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function sortByDate(items) {
  return [...items].sort((a, b) => (a.data.date < b.data.date ? 1 : -1));
}

function caseCard(item, fromUrl, level = 3) {
  const pillarIds = item.data.pillars.split(/\s+/).filter(Boolean);
  const search = [
    item.data.title,
    item.data.summary,
    item.data.tags || "",
    item.data.country || "",
    pillarIds.map(pillarName).join(" "),
    item.data.evidence,
    evidenceLabel(item.data),
  ]
    .join(" ")
    .toLowerCase();
  const flag =
    item.data.simulation === "true"
      ? `<p class="card-flag">${escapeHtml(item.data.simulationNote)}</p>`
      : "";
  return `<article class="case-card" data-case data-pillar="${escapeHtml(pillarIds.join(" "))}" data-evidence="${escapeHtml(item.data.evidence)}" data-search="${escapeHtml(search)}">
    <p class="card-kicker">${escapeHtml(pillarName(item.data.pillar))}</p>
    <p><span class="evidence">${escapeHtml(evidenceLabel(item.data))}</span></p>
    <h${level}><a href="${relativeHref(fromUrl, `cases/${item.slug}/`)}">${escapeHtml(item.data.title)}</a></h${level}>
    <p>${escapeHtml(item.data.summary)}</p>
    ${flag}
    <p class="card-meta">${escapeHtml(item.data.author)} · ${escapeHtml(formatDate(item.data.date))} · ${item.minutes} minute read</p>
  </article>`;
}

function filterForm(fromUrl) {
  const pillarOptions = PILLARS.map(
    (pillar) =>
      `<option value="${pillar.id}">${escapeHtml(pillar.name)}</option>`,
  ).join("");
  const evidenceOptions = EVIDENCE_LEVELS.map(
    (level) =>
      `<option value="${level.id}">${level.id} — ${level.name}</option>`,
  ).join("");
  return `<form class="filters" data-filters aria-label="Filter cases">
    <div class="field">
      <label for="pillar-filter">Pillar</label>
      <select id="pillar-filter" data-filter="pillar">
        <option value="">All pillars</option>
        ${pillarOptions}
      </select>
    </div>
    <div class="field">
      <label for="evidence-filter">Evidence label</label>
      <select id="evidence-filter" data-filter="evidence">
        <option value="">All evidence labels</option>
        ${evidenceOptions}
      </select>
    </div>
    <div class="field">
      <label for="search-filter">Search titles and summaries</label>
      <input id="search-filter" data-filter="search" type="search" placeholder="Search">
    </div>
    <button type="button" data-clear>Clear filters</button>
  </form>
  <noscript><p>Filters on this page need scripting. Every published case is listed below.</p></noscript>
  <p class="result-count" data-count aria-live="polite"></p>`;
}

function library(items, fromUrl, level = 3) {
  const cards = items.map((item) => caseCard(item, fromUrl, level)).join("");
  return `<div class="library" data-library>
    ${filterForm(fromUrl)}
    <div class="card-grid" data-case-list>
      ${cards || "<p>No case has been published yet.</p>"}
    </div>
    <p class="empty" data-empty hidden>No cases match these filters. Clear the filters to see the full library.</p>
  </div>`;
}

function renderHome(cases, tools) {
  const featured = cases[0];
  const tool = tools.find((item) => item.slug === "six-questions") || tools[0];
  const pillarItems = PILLARS.map(
    (pillar) => `<li>
      <h3>${escapeHtml(pillar.name)}</h3>
      <p class="share">Proposed share of the year’s pieces: ${pillar.share}</p>
      <p>${escapeHtml(pillar.topics)}</p>
      <p><a href="${relativeHref("", `cases/?pillar=${pillar.id}`)}">Cases in this pillar</a></p>
    </li>`,
  ).join("");

  const body = `<div class="shell">
    <section class="hero">
      <h1>Evidence for better public service.</h1>
      <p class="lede">Explore how public institutions use AI, what the results show, and what it takes to adapt a method responsibly. Learn from practitioners, examine the evidence and contribute your experience.</p>
      <p><strong>Mission.</strong> Document how public servants use AI and automation to improve service quality, accountability, inclusion and sustainable economic development, with sufficient evidence for others to make informed decisions.</p>
      <p>The core product is a reviewed case with a replication pack. Nigeria is the first centre of gravity, with African and international comparisons. The first case in the library is a labelled simulation, not a measured deployment.</p>
      <h2>Every substantive case answers six questions</h2>
      <ol class="questions">
        <li>What service problem was addressed?</li>
        <li>What changed?</li>
        <li>What evidence supports the result?</li>
        <li>What did it cost?</li>
        <li>What could go wrong?</li>
        <li>What would another institution need to repeat it?</li>
      </ol>
      <div class="actions">
        <a class="button" href="${relativeHref("", "cases/")}">Explore the cases</a>
        <a class="button button-secondary" href="${relativeHref("", "join/")}">Contribute your experience</a>
      </div>
      <p class="hero-note">${escapeHtml(DISCLAIMER)}</p>
    </section>

    <section class="band" aria-labelledby="pillars-heading">
      <h2 id="pillars-heading">Five pillars</h2>
      <p>These shares are a proposed mix for a year’s pieces. They are not measures of impact, audience or adoption. At least a quarter of substantive pieces should examine limits, unsuccessful attempts or contested evidence.</p>
      <ol class="pillars">${pillarItems}</ol>
    </section>

    <section class="band" aria-labelledby="featured-heading">
      <h2 id="featured-heading">Featured case</h2>
      ${
        featured
          ? `<article class="featured">
        <p class="card-kicker">${escapeHtml(pillarName(featured.data.pillar))}</p>
        <h3><a href="${relativeHref("", `cases/${featured.slug}/`)}">${escapeHtml(featured.data.title)}</a></h3>
        <p><span class="evidence">${escapeHtml(evidenceLabel(featured.data))}</span></p>
        <aside class="notice" role="note">
          <p class="notice-kicker">Simulated case</p>
          <p>${escapeHtml(featured.data.simulationNote)} It is not a report of a Nigerian Export Promotion Council implementation, a claim about the Council’s performance, or an institutional endorsement.</p>
        </aside>
        <p>${escapeHtml(featured.data.summary)}</p>
        <p class="card-meta">${escapeHtml(featured.data.author)} · ${escapeHtml(formatDate(featured.data.date))} · ${featured.minutes} minute read</p>
        <p><a class="button" href="${relativeHref("", `cases/${featured.slug}/`)}">Read the case</a></p>
      </article>`
          : "<p>No case has been published yet.</p>"
      }
    </section>

    <section class="band" aria-labelledby="paths-heading">
      <h2 id="paths-heading">Three ways to read</h2>
      <div class="card-grid cols-3">
        <article class="path-card">
          <h3>Understand</h3>
          <p>Start with the evidence labels and the difference between a proposal, a description, a measurement and a replication.</p>
          <p><a href="${relativeHref("", "tools/evidence-levels/")}">Read the evidence levels</a></p>
        </article>
        <article class="path-card">
          <h3>Evaluate</h3>
          <p>Use the six questions, then look at denominators, costs, the simpler alternative and what the case refuses to claim.</p>
          <p><a href="${relativeHref("", "cases/case-ng-001/#constructed-results")}">Evaluate the worked case</a></p>
        </article>
        <article class="path-card">
          <h3>Adapt</h3>
          <p>A pack can be copied only with a named owner, authority and a local test. The rehearsal says what that host would still need.</p>
          <p><a href="${relativeHref("", "cases/case-ng-001/#replication-pack")}">See the replication conditions</a></p>
        </article>
      </div>
    </section>

    <section class="band" aria-labelledby="latest-heading">
      <h2 id="latest-heading">Latest cases</h2>
      <p>One case is published. Measured cases will be added only when their evidence, permissions and review are in place. Filter by pillar or evidence label.</p>
      ${library(cases, "")}
    </section>

    <section class="band" aria-labelledby="tool-heading">
      <h2 id="tool-heading">One tool</h2>
      ${
        tool
          ? `<article class="path-card">
        <p class="card-kicker">Proposed template</p>
        <h3><a href="${relativeHref("", `tools/${tool.slug}/`)}">${escapeHtml(tool.data.title)}</a></h3>
        <p>${escapeHtml(tool.data.summary)}</p>
        <p><a href="${relativeHref("", `tools/${tool.slug}/`)}">Open the worksheet</a></p>
      </article>`
          : ""
      }
    </section>

    <section class="band" aria-labelledby="video-heading">
      <h2 id="video-heading">Latest video</h2>
      <p>The <a href="https://www.youtube.com/playlist?list=PLQOp9gIlLxSc">AI Africa Observatory playlist</a> is available on YouTube. The video series <em>AI in Public Service with Benedict Itegbe</em> is coming soon. Nothing plays until you choose to open it.</p>
      <p><a class="button button-secondary" href="${relativeHref("", "watch/")}">Go to Watch</a></p>
    </section>

    <section class="band" aria-labelledby="join-heading">
      <h2 id="join-heading">Join the founding community</h2>
      <p>Fellow AIG Public Leaders Programme alumni are invited to opt in, together with other public servants, academics, engineers, privacy specialists and people who use public services. You do not need to write a full article. A field note, a case nomination, an interview or a review is enough to begin.</p>
      <p>No alumnus is named on this site. Participation is voluntary. It does not imply endorsement by the Aig-Imoukhuede Foundation, the University of Oxford or the Nigerian Export Promotion Council.</p>
      <p><a class="button" href="${relativeHref("", "join/")}">Join the Think Tank</a></p>
    </section>

    <section class="band" aria-labelledby="news-heading">
      <h2 id="news-heading">The Public Service AI Brief</h2>
      <p>The newsletter is a separate choice from Think Tank membership. It is not yet a regular posted edition. This form records a request to receive it.</p>
      ${newsletterForm()}
    </section>

    <section class="band" aria-labelledby="method-heading">
      <h2 id="method-heading">Method</h2>
      <ul class="method-links">
        <li><a href="${relativeHref("", "methodology/")}">Methodology</a></li>
        <li><a href="${relativeHref("", "editorial-policy/")}">Editorial policy</a></li>
        <li><a href="${relativeHref("", "tools/evidence-levels/")}">Evidence levels</a></li>
        <li><a href="${relativeHref("", "corrections/")}">Corrections</a></li>
      </ul>
    </section>
  </div>`;

  writePage(
    "",
    layout({
      url: "",
      title: "Public Service AI Observatory",
      description:
        "An independent journal documenting how public servants use AI, with evidence labels, costs, limits and replication packs.",
      nav: "home",
      body: rewriteRootLinks(body, ""),
    }),
  );
}

function renderCases(cases) {
  const url = "cases/";
  const body = `<div class="shell measure-page">
    <h1>Cases</h1>
    <p class="lede">Each card carries a short summary, the author, the date, an evidence label and a reading time. E0 means a proposal or a synthetic exercise. It does not mean a measured result.</p>
    ${library(cases, url, 2)}
  </div>`;
  writePage(
    url,
    layout({
      url,
      title: "Cases",
      description:
        "Case library of the Public Service AI Observatory, filterable by pillar and evidence label.",
      nav: "cases",
      body,
    }),
  );
}

function renderCase(item, cases) {
  const url = `cases/${item.slug}/`;
  requireFields(item, [
    "title",
    "date",
    "reviewed",
    "evidence",
    "pillar",
    "pillars",
    "summary",
    "author",
    "decision",
    "description",
    "reviewCredit",
  ]);
  const summaryCount = words(item.data.summary).length;
  if (summaryCount < 30 || summaryCount > 40) {
    throw new Error(
      `${item.file} summary is ${summaryCount} words. Aim for about 35.`,
    );
  }
  const prose = renderMarkdown(item.body, url);
  const toc = tocFrom(prose);
  const tocHtml = toc.length
    ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2><ol>${toc
        .map(
          (entry) =>
            `<li><a href="${relativeHref(url, `${url}#${entry.id}`)}">${entry.text}</a></li>`,
        )
        .join("")}</ol></nav>`
    : "";
  const related = cases.filter((other) => other.slug !== item.slug);
  const relatedHtml = related.length
    ? `<ul>${related
        .map(
          (other) =>
            `<li><a href="${relativeHref(url, `cases/${other.slug}/`)}">${escapeHtml(other.data.title)}</a></li>`,
        )
        .join("")}</ul>`
    : "<p>No other case has been published yet. The practical tools are the nearest companion reading.</p>";
  const simulation =
    item.data.simulation === "true"
      ? `<aside class="notice" role="note" aria-label="Evidence status">
      <p class="notice-kicker">Simulated case</p>
      <p>This is a simulated case built on synthetic data. The NEPC-themed scenario is fictional. It is not a report of a Nigerian Export Promotion Council implementation, a claim about the Council’s performance, or an institutional endorsement.</p>
      <p><span class="evidence">${escapeHtml(evidenceLabel(item.data))}</span></p>
    </aside>`
      : `<p><span class="evidence">${escapeHtml(evidenceLabel(item.data))}</span></p>`;

  const body = `<article class="shell">
    <p class="back"><a href="${relativeHref(url, "cases/")}">All cases</a></p>
    <header class="article-header">
      <p class="kicker">Case · ${escapeHtml(pillarName(item.data.pillar))}</p>
      <h1>${escapeHtml(item.data.title)}</h1>
      ${simulation}
      <p class="decision"><strong>Decision summary.</strong> ${escapeHtml(item.data.decision)}</p>
      <p class="byline">By ${escapeHtml(item.data.author)}</p>
      <dl class="meta-list">
        <div><dt>Document date</dt><dd>${escapeHtml(formatDate(item.data.date))}</dd></div>
        <div><dt>Last review date</dt><dd>${escapeHtml(formatDate(item.data.reviewed))}</dd></div>
        <div><dt>Reading time</dt><dd>${item.minutes} minutes</dd></div>
        <div><dt>Version</dt><dd>${escapeHtml(item.data.version || "Not stated")}</dd></div>
        <div><dt>Format</dt><dd>${escapeHtml(item.data.format || "Case")}</dd></div>
        <div><dt>Context</dt><dd>${escapeHtml(item.data.country || "Not stated")}</dd></div>
      </dl>
      <p class="reviewers"><strong>Review.</strong> ${escapeHtml(item.data.reviewCredit)}</p>
    </header>
    ${tocHtml}
    <div class="prose">${prose}</div>
    <section class="related" aria-labelledby="related-heading">
      <h2 id="related-heading">Related cases</h2>
      ${relatedHtml}
      <p><a href="${relativeHref(url, "tools/")}">Practical tools</a></p>
    </section>
    <p><button type="button" class="button button-secondary" onclick="window.print()">Print this case</button></p>
  </article>`;

  writePage(
    url,
    layout({
      url,
      title: item.data.title,
      description: item.data.description,
      nav: "cases",
      body,
    }),
  );
}

function renderTools(tools) {
  const url = "tools/";
  const cards = tools
    .map(
      (tool) => `<article class="path-card">
      <p class="card-kicker">Proposed template · ${escapeHtml(evidenceLabel(tool.data))}</p>
      <h2><a href="${relativeHref(url, `tools/${tool.slug}/`)}">${escapeHtml(tool.data.title)}</a></h2>
      <p>${escapeHtml(tool.data.summary)}</p>
      <p class="card-meta">${escapeHtml(tool.data.author)} · ${escapeHtml(formatDate(tool.data.date))}</p>
    </article>`,
    )
    .join("");
  const body = `<div class="shell measure-page">
    <h1>Practical tools</h1>
    <p class="lede">These are proposed templates. A completed worksheet is not evidence that an institution has adopted a method, and it is not a replicated practice.</p>
    <div class="card-grid cols-3">${cards}</div>
  </div>`;
  writePage(
    url,
    layout({
      url,
      title: "Practical tools",
      description:
        "Proposed worksheets and checklists for judging a public-service AI case.",
      nav: "tools",
      body,
    }),
  );
}

function renderTool(tool) {
  const url = `tools/${tool.slug}/`;
  requireFields(tool, ["title", "date", "summary", "author", "description", "evidence"]);
  const prose = renderMarkdown(tool.body, url);
  const body = `<article class="shell">
    <div class="prose">
      <p class="back"><a href="${relativeHref(url, "tools/")}">All practical tools</a></p>
      <p class="kicker">Proposed template · ${escapeHtml(evidenceLabel(tool.data))}</p>
      ${prose}
      <p class="byline">By ${escapeHtml(tool.data.author)} · ${escapeHtml(formatDate(tool.data.date))}</p>
    </div>
  </article>`;
  writePage(
    url,
    layout({
      url,
      title: tool.data.title,
      description: tool.data.description,
      nav: "tools",
      body,
    }),
  );
}

function renderDiaryIndex(entries) {
  const url = "diary/";
  const list = entries
    .map(
      (entry) => `<article class="path-card">
      <p class="card-kicker">DBA Research Diary</p>
      <h2><a href="${relativeHref(url, `diary/${entry.slug}/`)}">${escapeHtml(entry.data.title)}</a></h2>
      <p>${escapeHtml(entry.data.summary)}</p>
      <p class="card-meta">${escapeHtml(entry.data.author)} · ${escapeHtml(formatDate(entry.data.date))} · ${entry.minutes} minute read</p>
    </article>`,
    )
    .join("");
  const body = `<div class="shell measure-page">
    <h1>DBA Research Diary</h1>
    <aside class="notice" role="note">
      <p class="notice-kicker">Column boundary</p>
      <p>This column is a dated record of the editor’s learning, questions and methods. It is not a doctoral finding, and it is not an article in an accredited journal. A contribution to the blog does not become research data without ethics approval and separate consent.</p>
    </aside>
    <p>The possible research question, stated in the operating playbook of 2 October 2026, is how evidence standards, human review and peer learning influence responsible adoption and measured service outcomes in Nigerian public institutions. The diary may follow that question. It does not answer it.</p>
    <div class="card-grid">${list || "<p>No diary note has been published yet.</p>"}</div>
  </div>`;
  writePage(
    url,
    layout({
      url,
      title: "DBA Research Diary",
      description:
        "The DBA Research Diary of the Public Service AI Observatory: learning notes, not doctoral findings.",
      nav: "diary",
      body,
    }),
  );
}

function renderDiaryEntry(entry) {
  const url = `diary/${entry.slug}/`;
  requireFields(entry, ["title", "date", "summary", "author", "description"]);
  const prose = renderMarkdown(entry.body, url);
  const body = `<article class="shell">
    <div class="prose">
      <p class="back"><a href="${relativeHref(url, "diary/")}">All diary notes</a></p>
      <aside class="notice" role="note">
        <p class="notice-kicker">DBA Research Diary</p>
        <p>This is a learning note by the editor. It is not a doctoral finding and not research data. Blog participation is not consent to a research study.</p>
      </aside>
      ${prose}
      <p class="byline">By ${escapeHtml(entry.data.author)} · ${escapeHtml(formatDate(entry.data.date))} · ${entry.minutes} minute read</p>
    </div>
  </article>`;
  writePage(
    url,
    layout({
      url,
      title: entry.data.title,
      description: entry.data.description,
      nav: "diary",
      body,
    }),
  );
}

function renderPage(item) {
  const url = `${item.slug}/`;
  requireFields(item, ["title", "description"]);
  let inner = renderMarkdown(item.body, url);
  if (item.data.draft === "true") {
    const note =
      item.data.draftNote ||
      "This page is a working text and may be revised.";
    inner = `<p class="draft-banner"><strong>Draft.</strong> ${escapeHtml(note)}</p>${inner}`;
  }
  const body = `<article class="shell prose">${inner}</article>`;
  writePage(
    url,
    layout({
      url,
      title: item.data.title,
      description: item.data.description,
      nav: item.data.nav || "",
      body,
    }),
  );
}

function renderNotFound() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page not found · Public Service AI Observatory</title>
  <meta name="robots" content="noindex">
  <style>
    body { margin: 2rem; background: #F6F5EF; color: #17251F; font: 18px/1.6 system-ui, sans-serif; }
    h1 { font-family: Georgia, "Times New Roman", serif; color: #173F35; font-size: 2rem; }
    a { color: #173F35; }
  </style>
</head>
<body>
  <h1>This page is not in the journal</h1>
  <p>The address does not match a published page. Use the link below to return to the homepage.</p>
  <p><a id="home-link" href="./">Public Service AI Observatory home</a></p>
  <script>
    (function () {
      var marker = "/Public-service-ai-observatory/";
      var path = window.location.pathname;
      var at = path.indexOf(marker);
      var base = at >= 0 ? path.slice(0, at + marker.length) : "./";
      document.getElementById("home-link").setAttribute("href", base);
    })();
  </script>
  <noscript><p>If the link does not open the journal, use the address you were given for the site.</p></noscript>
</body>
</html>`;
  fs.writeFileSync(path.join(dist, "404.html"), html);
}

function prepare(items) {
  return sortByDate(items).map((item) => ({
    ...item,
    minutes: readingMinutes(item.body),
  }));
}

function main() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
  fs.copyFileSync(
    path.join(root, "src/css/site.css"),
    path.join(dist, "assets/site.css"),
  );
  fs.copyFileSync(
    path.join(root, "src/js/site.js"),
    path.join(dist, "assets/site.js"),
  );
  fs.copyFileSync(
    path.join(root, "src/favicon.svg"),
    path.join(dist, "assets/favicon.svg"),
  );
  fs.writeFileSync(path.join(dist, ".nojekyll"), "");

  const cases = prepare(loadDir(path.join(content, "cases")));
  const tools = prepare(loadDir(path.join(content, "tools")));
  const diary = prepare(loadDir(path.join(content, "diary")));
  const pages = loadDir(path.join(content, "pages"));

  for (const item of [...cases, ...tools, ...diary, ...pages]) {
    if (/NEPC|Director-General|Executive Director|Chief Executive/i.test(item.data.author || "")) {
      throw new Error(`${item.file} puts a forbidden title in the author field`);
    }
  }

  renderHome(cases, tools);
  renderCases(cases);
  for (const item of cases) renderCase(item, cases);
  renderTools(tools);
  for (const tool of tools) renderTool(tool);
  renderDiaryIndex(diary);
  for (const entry of diary) renderDiaryEntry(entry);
  for (const page of pages) renderPage(page);
  renderNotFound();

  const expected = ["about", "methodology", "editorial-policy", "privacy", "accessibility", "disclosures", "corrections", "contact", "join", "watch"];
  for (const slug of expected) {
    if (!pages.some((page) => page.slug === slug)) {
      throw new Error(`Missing page: content/pages/${slug}.md`);
    }
  }

  console.log(
    `Built ${cases.length} case(s), ${tools.length} tool(s), ${diary.length} diary note(s), ${pages.length} pages.`,
  );
}

main();
