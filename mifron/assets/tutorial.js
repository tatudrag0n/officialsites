/* Mifron tutorial page: smooth in-page navigation and scroll-spy. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var sections = Array.prototype.slice.call(document.querySelectorAll('.tutorial-section'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.tutorial-nav .nav-link'));
    if (!sections.length || !navLinks.length) return;

    function setActive(id) {
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    }

    navLinks.forEach(function (link) {
      link.addEventListener('click', function (event) {
        var target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(target.id);
        if (history.replaceState) history.replaceState(null, '', '#' + target.id);
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
    setActive(sections[0].id);
  });
})();
