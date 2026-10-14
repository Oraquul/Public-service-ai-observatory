export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const BYLINE = "Arc Benedict Itegbe, founder and editor";

export const DISCLAIMER =
  "This is an independent personal initiative. Views are personal and are not official positions. Participation does not imply endorsement by the Aig-Imoukhuede Foundation, the University of Oxford, the Nigerian Export Promotion Council, or any other institution.";

export const PILLARS = [
  {
    id: "public-service-delivery",
    name: "Public-service delivery",
    share: "25%",
    topics:
      "Enquiries, correspondence, complaints and accessible service information.",
  },
  {
    id: "evidence-and-decisions",
    name: "Evidence and institutional decisions",
    share: "20%",
    topics:
      "Data reconciliation, trade intelligence, policy research and performance reporting.",
  },
  {
    id: "responsible-orchestration",
    name: "Responsible orchestration",
    share: "25%",
    topics:
      "Human review, privacy, audit trails, security, procurement and appeals.",
  },
  {
    id: "economic-development",
    name: "Economic development",
    share: "20%",
    topics:
      "Small businesses, export readiness, agriculture and workforce skills.",
  },
  {
    id: "research-and-learning",
    name: "Research and learning",
    share: "10%",
    topics:
      "The DBA research diary, evaluation methods, and mistakes and lessons.",
  },
];

export const EVIDENCE_LEVELS = [
  { id: "E0", name: "Proposed" },
  { id: "E1", name: "Described" },
  { id: "E2", name: "Measured" },
  { id: "E3", name: "Replicated" },
];

export const NAV = [
  { href: "", label: "Home", key: "home" },
  { href: "cases/", label: "Cases", key: "cases" },
  { href: "tools/", label: "Practical tools", key: "tools" },
  { href: "watch/", label: "Watch", key: "watch" },
  { href: "diary/", label: "Research diary", key: "diary" },
  { href: "join/", label: "Join the Think Tank", key: "join" },
];

export const FOOTER = [
  { href: "about/", label: "About" },
  { href: "methodology/", label: "Methodology" },
  { href: "editorial-policy/", label: "Editorial policy" },
  { href: "privacy/", label: "Privacy" },
  { href: "accessibility/", label: "Accessibility" },
  { href: "disclosures/", label: "Disclosures" },
  { href: "corrections/", label: "Corrections" },
  { href: "contact/", label: "Contact" },
];

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function parseFrontMatter(raw) {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith("---\n")) return { data: {}, body: text };
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) throw new Error("Front matter is not closed.");
  const data = {};
  for (const line of text.slice(4, end).split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) throw new Error(`Bad front matter line: ${line}`);
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[match[1]] = value;
  }
  return { data, body: text.slice(end + 5) };
}

export function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!match) throw new Error(`Bad date: ${iso}`);
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) throw new Error(`Bad month in date: ${iso}`);
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function words(value) {
  return String(value).trim().split(/\s+/).filter(Boolean);
}

export function readingMinutes(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_[\]()`|-]/g, " ");
  return Math.max(1, Math.round(words(text).length / 200));
}

export function slugify(value) {
  return String(value)
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, " and ")
    .replace(/&[^;]+;/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function pillarName(id) {
  return PILLARS.find((pillar) => pillar.id === id)?.name || id;
}

export function evidenceLabel(data) {
  const level = EVIDENCE_LEVELS.find((item) => item.id === data.evidence);
  const name = data.evidenceName || level?.name || "";
  const qualifier = data.evidenceQualifier ? ` · ${data.evidenceQualifier}` : "";
  return `${data.evidence} — ${name}${qualifier}`;
}

/**
 * Page URLs are directory paths with a trailing slash. The homepage is "".
 * Asset targets may be files, such as "assets/site.css".
 */
export function relativeHref(fromUrl, toUrl) {
  if (
    toUrl == null ||
    toUrl.startsWith("http://") ||
    toUrl.startsWith("https://") ||
    toUrl.startsWith("mailto:") ||
    toUrl.startsWith("#")
  ) {
    return toUrl || "";
  }

  const hashAt = toUrl.indexOf("#");
  const hash = hashAt >= 0 ? toUrl.slice(hashAt) : "";
  const beforeHash = hashAt >= 0 ? toUrl.slice(0, hashAt) : toUrl;
  const queryAt = beforeHash.indexOf("?");
  const query = queryAt >= 0 ? beforeHash.slice(queryAt) : "";
  const toPath = (queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash).replace(
    /^\/+/,
    "",
  );
  const fromParts = fromUrl.split("/").filter(Boolean);
  const toParts = toPath.split("/").filter(Boolean);
  let shared = 0;
  while (
    shared < fromParts.length &&
    shared < toParts.length &&
    fromParts[shared] === toParts[shared]
  ) {
    shared += 1;
  }
  const parts = [
    ...Array(fromParts.length - shared).fill(".."),
    ...toParts.slice(shared),
  ];
  let relative = parts.join("/");
  if (!relative) relative = "./";
  else if (!relative.startsWith(".")) relative = `./${relative}`;
  if (relative === "./" || relative === ".") return `./${query}${hash}`;
  const leaf = toPath.split("/").filter(Boolean).pop() || "";
  const isFile = /\.[a-z0-9]+$/i.test(leaf);
  if (!isFile && !relative.endsWith("/")) relative = `${relative}/`;
  return relative + query + hash;
}

export function rewriteRootLinks(html, fromUrl) {
  return html.replace(
    /(href|src)=("|')\/(?!\/)([^"']*)\2/g,
    (_, attribute, quote, target) =>
      `${attribute}=${quote}${relativeHref(fromUrl, target)}${quote}`,
  );
}
