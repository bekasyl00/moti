// === jQuery готов ===
$(document).ready(function () {
  
  // === Scroll Progress Bar ===
  $(window).on('scroll', function () {
    const scrollTop = $(window).scrollTop();
    const height = $(document).height() - $(window).height();
    const scrolled = (scrollTop / height) * 100;
    $('.progress-bar').css('width', scrolled + '%');
  });
});


// === Accordion ===
document.addEventListener('DOMContentLoaded', () => {
  const questions = Array.from(document.querySelectorAll('.accordion-question'));

  questions.forEach(q => {
    q.addEventListener('click', () => toggleAnswer(q));
    q.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        toggleAnswer(q);
      }
    });
  });

  function toggleAnswer(questionEl) {
    const answerEl = questionEl.nextElementSibling;
    if (!answerEl) return;

    const isOpen = answerEl.classList.contains('open');

    document.querySelectorAll('.accordion-answer.open').forEach(a => {
      if (a !== answerEl) closeAnswer(a);
    });

    if (isOpen) {
      closeAnswer(answerEl);
      questionEl.setAttribute('aria-expanded', 'false');
      answerEl.setAttribute('aria-hidden', 'true');
    } else {
      openAnswer(answerEl);
      questionEl.setAttribute('aria-expanded', 'true');
      answerEl.setAttribute('aria-hidden', 'false');
    }
  }

  function openAnswer(a) {
    a.classList.add('open');
    const height = a.scrollHeight;
    a.style.maxHeight = height + 'px';
  }

  function closeAnswer(a) {
    a.style.maxHeight = a.scrollHeight + 'px';
    a.offsetHeight; // reflow
    a.style.maxHeight = '0px';
    a.classList.remove('open');
  }

  // === Fade-in Observer ===
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});


// === Carousel Script (из HTML) ===
(function() {
  const inner = document.getElementById('carouselInner');
  if (!inner) return;

  const slides = inner.querySelectorAll('.carousel-img');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  let index = 0;
  let slideWidth = inner.clientWidth;

  function update() {
    slideWidth = inner.clientWidth;
    slides.forEach(img => img.style.minWidth = slideWidth + 'px');
    inner.style.transform = 'translateX(' + (-index * slideWidth) + 'px)';
  }

  function nextSlide() {
    index = (index + 1) % slides.length;
    update();
  }

  function prevSlide() {
    index = (index - 1 + slides.length) % slides.length;
    update();
  }

  window.nextSlide = nextSlide;
  window.prevSlide = prevSlide;

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  let autoplay = setInterval(nextSlide, 4500);

  const carousel = document.getElementById('mainCarousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', () => clearInterval(autoplay));
    carousel.addEventListener('mouseleave', () => {
      autoplay = setInterval(nextSlide, 4500);
    });
  }

  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  setTimeout(update, 300);
})();
