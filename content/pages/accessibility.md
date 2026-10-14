---
title: Accessibility
description: How this journal is built for WCAG 2.2 AA, what has been checked, and how to ask for another format.
---

# Accessibility

The journal is designed and checked against the Web Content Accessibility Guidelines 2.2, level AA. This page is not a certificate of conformance. It says what the site does, what was tested in the build, and what remains limited.

## How the pages are built

- Text is dark green-black (`#17251F`) on a warm background (`#F6F5EF`). The contrast of that pair is about 14.5 to 1. The deep green (`#173F35`) on the same background is about 10.7 to 1, so it is used for headings, links and buttons as well as for large type.
- The gold (`#B99752`) does not meet text contrast on the background. It is used only as a short decorative rule and as a quote border, never as the only way to read a status.
- Evidence labels are written in words. Colour is not the only signal.
- Body text is 18 pixels with a line height of 1.6. Headings use a Georgia stack. The article column is kept near 65 to 75 characters.
- Each page has one top-level heading, a skip link, and visible keyboard focus. Controls and navigation links have a target of at least 44 by 44 pixels.
- Forms have visible labels. Required fields say “Required” in text.
- Data tables have captions and header cells. Wide tables sit in a region that can be scrolled from the keyboard.
- Video does not play by itself. YouTube is loaded only after a click, and a plain link is always available.
- The layout is a single column on a narrow screen and does not depend on a hover action.

## What the build checks

The project’s check rejects a page that lacks a skip link, a single top-level heading, a sensible heading order, a label on a form control, or alternative text on an image. It also rejects an embedded video frame in the initial HTML. Those checks do not replace testing with assistive technology or with readers.

## Known limits

The site is in English only. A wide results table still asks a narrow screen to scroll sideways; the same figures are also stated in the prose of the case. YouTube’s own player has its own accessibility, which this site does not control. An audit with screen-reader users and with people using the public services under discussion has not yet been done. That gap should be closed before any case is offered as guidance for a live service.

## Ask for another format

If a page is hard to use, write through the [contact form](/contact/) and choose “Accessibility request”. Say the page, the barrier, and the format that would help. The editor will reply with a practical alternative, such as a plain copy of the text.
