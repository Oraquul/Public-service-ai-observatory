---
title: Decision boundary for a drafting assistant
date: 2026-10-02
evidence: E0
evidenceName: Proposed
evidenceQualifier: Template
summary: A checklist of the stops in the fictional export-enquiry rehearsal, for a desk that may draft a reply but may not approve, charge or certify.
author: Arc Benedict Itegbe, founder and editor
description: Proposed checklist of decisions a public-service drafting assistant must escalate.
---

# Decision boundary for a drafting assistant

This checklist is taken from the [E0 export-enquiry rehearsal](/cases/case-ng-001/). It is a proposed workflow, not an institutional control and not a tested safety case. Adapt the forbidden actions to the real desk before anyone relies on it.

A practical reviewer asks three questions of every draft:

- Is this information supported by a current, approved source?
- Is the desk allowed to say or do this?
- Can the user understand the next step?

If one answer is unclear, the draft stays in review.

The assistant in that design may prepare a source-linked draft. It may not:

- guarantee an approval
- quote a fee that the approved source does not support
- confirm a payment
- issue a certificate
- request credentials
- send a reply without an officer’s decision

A missing source, a stale source or a timeout moves the item to the manual queue and keeps the case identifier. A confident tone is not authority.

<form class="worksheet" id="boundary" data-local action="#boundary" method="get">
  <p>Tick these only as a local note. Nothing is sent, and a tick is not an approval.</p>
  <div class="field">
    <label class="check" for="b-source">
      <input id="b-source" type="checkbox">
      <span>The source is current, approved and identified.</span>
    </label>
  </div>
  <div class="field">
    <label class="check" for="b-scope">
      <input id="b-scope" type="checkbox">
      <span>The draft makes no approval, fee, payment, certificate or credential claim.</span>
    </label>
  </div>
  <div class="field">
    <label class="check" for="b-officer">
      <input id="b-officer" type="checkbox">
      <span>An officer reviews the draft before anything is sent.</span>
    </label>
  </div>
  <div class="field">
    <label class="check" for="b-fallback">
      <input id="b-fallback" type="checkbox">
      <span>A timeout or a blocked claim falls back to the existing manual process.</span>
    </label>
  </div>
  <div class="field">
    <label class="check" for="b-human">
      <input id="b-human" type="checkbox">
      <span>A person who cannot use the digital form still has a human route.</span>
    </label>
  </div>
  <div class="field">
    <label for="b-note">What must a local host still change?</label>
    <textarea id="b-note" name="note"></textarea>
  </div>
  <p class="form-status" data-status role="status"></p>
  <button type="button" onclick="window.print()">Print this checklist</button>
</form>

A prompt that repeats these rules is not itself a security control. Access limits, source permissions and a human approval have to exist outside the model.
