
const menuButton = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
}
const links = window.MCT_LINKS || {};
document.querySelectorAll('[data-link]').forEach((el) => {
  const key = el.getAttribute('data-link');
  if (links[key]) el.setAttribute('href', links[key]);
});
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) entry.target.classList.add('is-visible');
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
