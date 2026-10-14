import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";
import { relativeHref, words } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const failures = [];

function fail(message) {
  failures.push(message);
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function assertRelative(name, from, to, expected) {
  const actual = relativeHref(from, to);
  if (actual !== expected) {
    fail(`relativeHref(${from} -> ${to}) was ${actual}, expected ${expected}`);
  }
}

assertRelative("home to cases", "", "cases/", "./cases/");
assertRelative("case to home", "cases/case-ng-001/", "", "../../");
assertRelative("case to about", "cases/case-ng-001/", "about/", "../../about/");
assertRelative("case to css", "cases/case-ng-001/", "assets/site.css", "../../assets/site.css");
assertRelative("cases to case", "cases/", "cases/case-ng-001/", "./case-ng-001/");
assertRelative("same page", "about/", "about/", "./");
assertRelative("hash", "cases/", "/cases/case-ng-001/#results", "./case-ng-001/#results");
assertRelative("external", "about/", "https://example.com", "https://example.com");

if (!fs.existsSync(dist)) {
  console.error("dist/ is missing. Run npm run build first.");
  process.exit(1);
}

const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
const css = fs.readFileSync(path.join(dist, "assets/site.css"), "utf8");
for (const token of ["#F6F5EF", "#17251F", "#173F35", "#B99752", "#D8DDD6"]) {
  if (!css.includes(token)) fail(`CSS is missing token ${token}`);
}
if (!css.includes("Georgia")) fail("CSS is missing Georgia");
if (!/font-size:\s*1\.125rem/.test(css) && !css.includes("18px")) {
  fail("CSS does not set an 18px body size");
}

const forbidden = [
  /Director-General/i,
  /Executive Director/i,
  /Chief Executive/i,
  /Itegbe,\s*NEPC/i,
  /NEPC title/i,
];
const emoji = /\p{Extended_Pictographic}/u;

for (const file of htmlFiles) {
  const relative = path.relative(dist, file).split(path.sep).join("/");
  const pageUrl = relative.endsWith("index.html")
    ? relative.slice(0, -"index.html".length)
    : relative;
  const raw = fs.readFileSync(file, "utf8");
  if (raw.includes("{{")) fail(`${relative} still contains a template slot`);
  if (emoji.test(raw)) fail(`${relative} contains an emoji`);
  for (const pattern of forbidden) {
    if (pattern.test(raw)) fail(`${relative} matches forbidden text ${pattern}`);
  }
  if (relative === "404.html") continue;

  const { document } = parseHTML(raw);
  if (document.documentElement.getAttribute("lang") !== "en") {
    fail(`${relative} is missing lang="en"`);
  }
  if (!document.querySelector("a.skip-link")) fail(`${relative} is missing a skip link`);
  if (!document.querySelector("main#main")) fail(`${relative} is missing main#main`);
  const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")];
  const h1 = headings.filter((heading) => heading.tagName === "H1");
  if (h1.length !== 1) fail(`${relative} has ${h1.length} h1 elements`);
  let previous = 0;
  for (const heading of headings) {
    const level = Number(heading.tagName.slice(1));
    if (previous && level > previous + 1) {
      fail(`${relative} skips from h${previous} to h${level}: ${heading.textContent.trim()}`);
    }
    previous = level;
  }
  const ids = new Map();
  for (const element of document.querySelectorAll("[id]")) {
    const id = element.getAttribute("id");
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) fail(`${relative} has duplicate id ${id}`);
  }
  for (const image of document.querySelectorAll("img")) {
    if (!image.hasAttribute("alt")) fail(`${relative} has an image without alt`);
  }
  for (const control of document.querySelectorAll("input, select, textarea")) {
    const type = (control.getAttribute("type") || "").toLowerCase();
    if (["hidden", "submit", "button"].includes(type)) continue;
    const id = control.getAttribute("id");
    const label =
      id && /^[A-Za-z][\w-]*$/.test(id)
        ? document.querySelector(`label[for="${id}"]`)
        : null;
    const wrapped = control.closest("label");
    if (!label && !wrapped) fail(`${relative} has an unlabelled ${control.tagName}`);
  }
  for (const button of document.querySelectorAll("button")) {
    if (!button.textContent.trim() && !button.getAttribute("aria-label")) {
      fail(`${relative} has a button without an accessible name`);
    }
  }
  if (!raw.includes("independent personal initiative")) {
    fail(`${relative} is missing the independence disclaimer`);
  }
  if (/<(iframe|img)\b/i.test(raw)) {
    const tags = raw.match(/<(iframe|img)\b[^>]*>/gi) || [];
    for (const tag of tags) {
      if (/^<iframe/i.test(tag)) fail(`${relative} embeds an iframe before a click`);
    }
  }

  for (const element of document.querySelectorAll("a[href], img[src], script[src], link[href]")) {
    const attribute = element.hasAttribute("href") ? "href" : "src";
    const value = element.getAttribute(attribute);
    if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("http://") || value.startsWith("https://")) {
      continue;
    }
    if (value.startsWith("/")) fail(`${relative} has a root-absolute link ${value}`);
    const hash = value.includes("#") ? value.slice(value.indexOf("#") + 1) : "";
    const pathPart = value.split("#")[0].split("?")[0];
    const baseDir = path.posix.dirname(relative);
    let resolved = path.posix.normalize(path.posix.join(baseDir, pathPart || "."));
    if (resolved.startsWith("..")) fail(`${relative} link escapes the site: ${value}`);
    if (resolved.endsWith("/")) resolved += "index.html";
    if (!path.posix.extname(resolved)) resolved = path.posix.join(resolved, "index.html");
    const target = path.join(dist, resolved);
    if (!fs.existsSync(target)) fail(`${relative} links to missing ${value} (${resolved})`);
    else if (hash) {
      const targetHtml = fs.readFileSync(target, "utf8");
      if (!targetHtml.includes(`id="${hash}"`)) {
        fail(`${relative} links to missing fragment #${hash} in ${resolved}`);
      }
    }
  }
}

const caseFile = path.join(dist, "cases/case-ng-001/index.html");
if (!fs.existsSync(caseFile)) {
  fail("The rehearsal case page was not built");
} else {
  const text = fs.readFileSync(caseFile, "utf8");
  for (const phrase of [
    "Simulated case",
    "synthetic data",
    "NEPC-themed scenario is fictional",
    "E0",
    "Arc Benedict Itegbe, founder and editor",
    "That boundary is as important as the draft it can produce",
    "49,250",
    "32,650",
    "35,900",
    "3,250",
  ]) {
    if (!text.includes(phrase)) fail(`Case page is missing: ${phrase}`);
  }
}

for (const page of ["join/index.html", "contact/index.html", "index.html"]) {
  const text = fs.readFileSync(path.join(dist, page), "utf8");
  if (!text.includes("https://formspree.io/f/mvkzbdqq")) {
    fail(`${page} does not post to the Formspree endpoint`);
  }
}

const watch = fs.readFileSync(path.join(dist, "watch/index.html"), "utf8");
if (!watch.includes("https://www.youtube.com/playlist?list=PLQOp9gIlLxSc")) {
  fail("Watch page is missing the AI Africa Observatory playlist");
}
if (!/coming soon/i.test(watch)) fail("Watch page does not say the series is coming soon");

const about = fs.readFileSync(path.join(dist, "about/index.html"), "utf8");
if (!about.includes("Aig-Imoukhuede Foundation")) {
  fail("About page is missing the foundation disclaimer");
}
if (!about.includes("University of Oxford")) fail("About page is missing Oxford");
if (!about.includes("Nigerian Export Promotion Council")) {
  fail("About page is missing the Council in the disclaimer");
}

const caseSource = fs.readFileSync(
  path.join(root, "content/cases/case-ng-001.md"),
  "utf8",
);
const summary = caseSource.match(/^summary:\s*"?(.+?)"?\s*$/m);
if (!summary) fail("Case summary front matter was not found");
else {
  const count = words(summary[1]).length;
  if (count !== 35) fail(`Case summary is ${count} words, not 35`);
}

if (failures.length) {
  console.error(`Accessibility and link check failed (${failures.length}):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files. Links, headings, labels and the case label passed.`);
