import fs from "node:fs";
import path from "node:path";
import { escapeHtml, formatDate, relativeHref } from "./lib.mjs";

const PAGE_DISCLAIMER =
  "Views are personal and are not official positions of any institution.";

const PERSONAL_NAME = /\b(Benedict|Itegbe)\b/;
const PDF_NAME = /^posts-compendium-\d{4}-\d{2}-\d{2}\.pdf$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const DURATION = /^\d{1,2}:\d{2}$/;
const WEEK = /^\d{4}-W\d{2}$/;

export function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function assertClean(value, label) {
  if (PERSONAL_NAME.test(value || "")) {
    throw new Error(`${label} includes a personal name`);
  }
}

function requireHttps(value, label) {
  if (!value || !/^https:\/\//.test(value)) {
    throw new Error(`${label} must be an https URL`);
  }
}

export function loadCompendium(root) {
  const file = path.join(root, "content", "compendium", "editions.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const series = data.series || {};
  for (const field of ["name", "publisher", "summary", "playlistId", "playlistUrl", "channelUrl"]) {
    if (!series[field]) throw new Error(`Compendium series is missing ${field}`);
    assertClean(String(series[field]), `series.${field}`);
  }
  requireHttps(series.playlistUrl, "series.playlistUrl");
  requireHttps(series.channelUrl, "series.channelUrl");
  if (!series.playlistUrl.includes(`list=${series.playlistId}`)) {
    throw new Error("series.playlistUrl does not include series.playlistId");
  }

  if (!Array.isArray(data.editions) || data.editions.length === 0) {
    throw new Error("Compendium editions list is empty");
  }

  const pdfDir = path.join(root, "assets", "compendium");
  const editions = data.editions.map((edition) => {
    if (!edition.date) throw new Error("A compendium edition is missing date");
    formatDate(edition.date);
    if (edition.week && !WEEK.test(edition.week)) {
      throw new Error(`${edition.date} has a bad week label`);
    }
    for (const field of ["title", "theme", "pdf"]) {
      if (!edition[field]) throw new Error(`${edition.date} is missing ${field}`);
      assertClean(String(edition[field]), `${edition.date} ${field}`);
    }
    if (!PDF_NAME.test(edition.pdf)) {
      throw new Error(`${edition.date} has an unexpected PDF name`);
    }
    const pdfPath = path.join(pdfDir, edition.pdf);
    if (!fs.existsSync(pdfPath)) throw new Error(`Missing PDF: ${edition.pdf}`);
    const next = {
      ...edition,
      bytes: fs.statSync(pdfPath).size,
      pdfUrl: `assets/compendium/${edition.pdf}`,
    };
    if (edition.audio) {
      const audio = edition.audio;
      for (const field of ["title", "youtubeId", "url", "date", "duration"]) {
        if (!audio[field]) throw new Error(`${edition.date} audio is missing ${field}`);
      }
      assertClean(audio.title, `${edition.date} audio title`);
      if (!YOUTUBE_ID.test(audio.youtubeId)) {
        throw new Error(`${edition.date} audio has a bad YouTube id`);
      }
      requireHttps(audio.url, `${edition.date} audio url`);
      if (!audio.url.includes(audio.youtubeId)) {
        throw new Error(`${edition.date} audio url does not include the YouTube id`);
      }
      formatDate(audio.date);
      if (!DURATION.test(audio.duration)) {
        throw new Error(`${edition.date} audio has a bad duration`);
      }
    }
    return next;
  });

  editions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return { series, editions };
}

function newTab(label) {
  return `${label}<span class="visually-hidden"> (opens in a new tab)</span>`;
}

function externalLink(href, label, className = "") {
  const classAttr = className ? ` class="${className}"` : "";
  return `<a${classAttr} href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${newTab(label)}</a>`;
}

export function seriesCard(compendium, headingLevel = 3) {
  const series = compendium.series;
  const embed = `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(series.playlistId)}`;
  return `<div class="series-card">
    <p class="card-kicker">${escapeHtml(series.publisher)}</p>
    <h${headingLevel} id="audio-overviews">${escapeHtml(series.name)}</h${headingLevel}>
    <p>${escapeHtml(series.summary)}</p>
    <p class="actions">${externalLink(series.playlistUrl, "Watch the series on OraquulTV", "button")}</p>
    <p>${externalLink(series.channelUrl, `${escapeHtml(series.publisher)} channel`)}</p>
    <div class="video-panel" data-video-panel>
      <p>Loading the player connects your browser to YouTube and may store cookies. You can use the links above instead and never load the player here.</p>
      <button type="button" class="button-secondary" data-load-youtube="${escapeHtml(embed)}" data-frame-title="${escapeHtml(`${series.name} playlist on ${series.publisher}`)}">Load the playlist</button>
    </div>
  </div>`;
}

function episodeMeta(edition, audio) {
  const parts = [formatDate(audio.date)];
  if (edition.week) parts.push(edition.week);
  parts.push(`Duration ${audio.duration}`);
  return parts.join(" · ");
}

export function episodeCard(edition, headingLevel) {
  const audio = edition.audio;
  if (!audio) return "";
  const embed = `https://www.youtube-nocookie.com/embed/${audio.youtubeId}`;
  const thumb = `https://i.ytimg.com/vi/${audio.youtubeId}/hqdefault.jpg`;
  const title = escapeHtml(audio.title);
  return `<article class="episode-card">
    <div class="video-panel" data-video-panel>
      <a class="video-facade" href="${escapeHtml(audio.url)}" target="_blank" rel="noopener noreferrer" data-load-youtube="${escapeHtml(embed)}" data-frame-title="${title} on OraquulTV">
        <img src="${escapeHtml(thumb)}" alt="" width="480" height="270" loading="lazy" referrerpolicy="no-referrer">
        <span class="video-facade-label">Load the episode<span class="visually-hidden">: ${title}</span></span>
      </a>
    </div>
    <p class="video-note">The still image is served by YouTube. The player loads only after you choose it, and it does not play on its own.</p>
    <h${headingLevel}>${title}</h${headingLevel}>
    <p class="card-meta">${escapeHtml(episodeMeta(edition, audio))}</p>
    <p>${externalLink(audio.url, "Watch on OraquulTV")}</p>
  </article>`;
}

function editionArticle(edition, fromUrl) {
  const week = edition.week ? `${edition.week} · ` : "";
  const size = formatBytes(edition.bytes);
  const pdfHref = relativeHref(fromUrl, edition.pdfUrl);
  const dateLabel = formatDate(edition.date);
  return `<article class="edition-card" id="edition-${escapeHtml(edition.date)}">
    <p class="card-kicker">${escapeHtml(week + edition.title)}</p>
    <h3>${escapeHtml(dateLabel)}</h3>
    <p>${escapeHtml(edition.theme)}</p>
    <p>${externalLink(pdfHref, `Open the PDF <span class="visually-hidden">for ${escapeHtml(dateLabel)} </span>(${size})`)}</p>
    ${episodeCard(edition, 4)}
  </article>`;
}

export function compendiumBody(compendium) {
  const fromUrl = "weekly-compendium/";
  const editions = compendium.editions.map((edition) => editionArticle(edition, fromUrl)).join("");
  return `<article class="shell prose">
    <h1>Weekly compendium</h1>
    <p class="lede">Digests of posts and drafts on public-service AI, published here as public PDF copies. The newest edition is first.</p>
    <p class="disclaimer">${escapeHtml(PAGE_DISCLAIMER)}</p>
    <section aria-labelledby="audio-overviews">
      ${seriesCard(compendium, 2)}
    </section>
    <section aria-labelledby="editions">
      <h2 id="editions">Editions</h2>
      <div class="edition-list">
        ${editions}
      </div>
    </section>
  </article>`;
}

export function audioOverviewsHtml(compendium, fromUrl) {
  const episodes = compendium.editions
    .filter((edition) => edition.audio)
    .map((edition) => episodeCard(edition, 3))
    .join("");
  const more = relativeHref(fromUrl, "weekly-compendium/");
  return `<div class="audio-overviews">
    ${seriesCard(compendium)}
    <div class="edition-list">${episodes}</div>
    <p><a href="${more}">All editions are on the weekly compendium page</a>, with the PDF for each week.</p>
  </div>`;
}

export function homeVideoExtras(compendium, fromUrl) {
  const latest = compendium.editions.find((edition) => edition.audio);
  const page = relativeHref(fromUrl, "weekly-compendium/");
  return `${seriesCard(compendium)}
    ${latest ? episodeCard(latest, 3) : ""}
    <p><a href="${page}">Weekly compendium</a></p>`;
}
