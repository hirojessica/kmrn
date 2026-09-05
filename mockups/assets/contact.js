// FormSubmit handles email delivery and CAPTCHA on its hosted submission screen.
// The recipient confirmed completion of the activation email on 2026-09-05.
export const contactConfig = Object.freeze({ activated: true, recipient: 'info@km-nagoya-doll.com' });
const form = document.querySelector('[data-contact-form]');
if (form) {
  const button = form.querySelector('[type=submit]');
  const note = document.querySelector('[data-contact-setup]');
  button.disabled = !contactConfig.activated;
  note.hidden = contactConfig.activated;
  form.addEventListener('submit', event => {
    if (!contactConfig.activated) { event.preventDefault(); return; }
    if (!form.checkValidity()) return;
    const next = new URL('contact-thanks.html', location.href);
    form.querySelector('[name=_next]').value = next.href;
    button.disabled = true;
  });
  window.addEventListener('pageshow', () => { button.disabled = !contactConfig.activated; });
}
