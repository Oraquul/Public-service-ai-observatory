export const FORM_ACTION = "https://formspree.io/f/mvkzbdqq";

function honeypot() {
  return `<p class="hp">
    <label for="company-website">Leave this field empty</label>
    <input id="company-website" name="_gotcha" type="text" tabindex="-1" autocomplete="off">
  </p>`;
}

export function joinForm() {
  return `<form class="stack-form" action="${FORM_ACTION}" method="post" data-enhance data-success="We have received your note. Receipt is not approval, and it does not reserve a role.">
    <input type="hidden" name="_subject" value="Think Tank opt-in">
    <input type="hidden" name="form" value="join">
    ${honeypot()}
    <div class="field">
      <label for="join-name">Name <span class="req">Required</span></label>
      <input id="join-name" name="name" type="text" autocomplete="name" required>
    </div>
    <div class="field">
      <label for="join-email">Email <span class="req">Required</span></label>
      <input id="join-email" name="email" type="email" autocomplete="email" required>
    </div>
    <div class="field">
      <label for="join-expertise">Area of expertise <span class="req">Required</span></label>
      <span class="hint" id="join-expertise-hint">For example: service operations, evaluation, privacy, or engineering.</span>
      <input id="join-expertise" name="expertise" type="text" required aria-describedby="join-expertise-hint">
    </div>
    <div class="field">
      <label for="join-contribution">Preferred contribution <span class="req">Required</span></label>
      <select id="join-contribution" name="contribution" required>
        <option value="">Choose one</option>
        <option>Field note</option>
        <option>Case nomination</option>
        <option>Interview</option>
        <option>Subject or governance review</option>
        <option>Replication pack</option>
        <option>Authorised pilot host</option>
        <option>Something else, described in the note</option>
      </select>
    </div>
    <div class="field">
      <label for="join-availability">Availability <span class="req">Required</span></label>
      <select id="join-availability" name="availability" required>
        <option value="">Choose one</option>
        <option>A single review or field note</option>
        <option>About an hour a month</option>
        <option>Several hours a month</option>
        <option>I want to discuss a larger role</option>
      </select>
    </div>
    <div class="field">
      <label for="join-institution">Institution <span class="opt">Optional</span></label>
      <span class="hint" id="join-institution-hint">Offer this only if you want it recorded. Do not send staff identifiers, personnel records or confidential documents.</span>
      <input id="join-institution" name="institution" type="text" aria-describedby="join-institution-hint">
    </div>
    <div class="field">
      <label for="join-conflicts">Interests or conflicts to declare <span class="opt">Optional</span></label>
      <textarea id="join-conflicts" name="conflicts"></textarea>
    </div>
    <div class="field">
      <label for="join-note">Note <span class="opt">Optional</span></label>
      <span class="hint" id="join-note-hint">You may nominate one public or authorised case. Do not include personal data about service users.</span>
      <textarea id="join-note" name="note" aria-describedby="join-note-hint"></textarea>
    </div>
    <div class="field">
      <label class="check" for="join-consent">
        <input id="join-consent" name="consent" type="checkbox" value="yes" required>
        <span>I am opting in, in my own name, to be contacted about the Think Tank. <span class="req">Required</span></span>
      </label>
    </div>
    <div class="field">
      <label class="check" for="join-newsletter">
        <input id="join-newsletter" name="newsletter" type="checkbox" value="yes">
        <span>Also send me The Public Service AI Brief. This choice is separate from Think Tank membership and is not required.</span>
      </label>
    </div>
    <p class="form-note">Read the <a href="/privacy/">privacy notice</a> before you send this form. The notice is a draft. A reply means we have received your note. It is not approval, publication or a research consent.</p>
    <button type="submit">Send my opt-in</button>
    <p class="form-status" data-status role="status"></p>
  </form>`;
}

export function contactForm() {
  return `<form class="stack-form" action="${FORM_ACTION}" method="post" data-enhance data-success="We have received your message. If you asked for a correction or a privacy response, the request will be logged.">
    <input type="hidden" name="_subject" value="Observatory contact">
    <input type="hidden" name="form" value="contact">
    ${honeypot()}
    <div class="field">
      <label for="contact-name">Name <span class="req">Required</span></label>
      <input id="contact-name" name="name" type="text" autocomplete="name" required>
    </div>
    <div class="field">
      <label for="contact-email">Email <span class="req">Required</span></label>
      <input id="contact-email" name="email" type="email" autocomplete="email" required>
    </div>
    <div class="field">
      <label for="contact-topic">Topic <span class="req">Required</span></label>
      <select id="contact-topic" name="topic" required>
        <option value="">Choose one</option>
        <option>General enquiry</option>
        <option>Correction</option>
        <option>Privacy request</option>
        <option>Accessibility request</option>
        <option>Sponsorship discussion</option>
      </select>
    </div>
    <div class="field">
      <label for="contact-message">Message <span class="req">Required</span></label>
      <textarea id="contact-message" name="message" required></textarea>
    </div>
    <p class="form-note">This form is only a contact route. It does not enrol you in the newsletter. See the <a href="/privacy/">privacy notice</a>.</p>
    <button type="submit">Send message</button>
    <p class="form-status" data-status role="status"></p>
  </form>`;
}

export function newsletterForm() {
  return `<form class="stack-form" action="${FORM_ACTION}" method="post" data-enhance data-success="We have received your request for The Public Service AI Brief. The form service may ask you to confirm your email. A request is not yet a subscription.">
    <input type="hidden" name="_subject" value="Newsletter opt-in">
    <input type="hidden" name="form" value="newsletter">
    ${honeypot()}
    <div class="field">
      <label for="news-email">Email <span class="req">Required</span></label>
      <input id="news-email" name="email" type="email" autocomplete="email" required>
    </div>
    <div class="field">
      <label for="news-name">Name <span class="opt">Optional</span></label>
      <input id="news-name" name="name" type="text" autocomplete="name">
    </div>
    <div class="field">
      <label class="check" for="news-consent">
        <input id="news-consent" name="newsletter" type="checkbox" value="yes" required>
        <span>I ask to receive The Public Service AI Brief by email. I can withdraw that request later. <span class="req">Required</span></span>
      </label>
    </div>
    <p class="form-note">The briefing is separate from joining the Think Tank. Read the <a href="/privacy/">privacy notice</a>.</p>
    <button type="submit">Request the briefing</button>
    <p class="form-status" data-status role="status"></p>
  </form>`;
}
