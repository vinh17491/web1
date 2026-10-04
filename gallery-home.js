(() => {
  const body = document.body;
  if (!body.classList.contains('editorial-home')) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  // Loader: short enough for recruiters, long enough to create a deliberate first frame.
  const loader = document.querySelector('.gp-loader');
  const closeLoader = () => {
    window.setTimeout(() => loader?.classList.add('is-done'), reduceMotion ? 0 : 850);
  };
  if (document.readyState === 'complete') closeLoader();
  else window.addEventListener('load', closeLoader, { once: true });
  window.setTimeout(closeLoader, 1800);

  // Mobile navigation.
  const menuButton = document.querySelector('.gp-menu');
  const nav = document.querySelector('.gp-nav');
  menuButton?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open') ?? false;
    menuButton.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  // Cursor vocabulary communicates what an interaction does.
  if (!coarse && !reduceMotion) {
    const cursor = document.querySelector('.gp-cursor');
    const label = cursor?.querySelector('.gp-cursor-label');
    let tx = innerWidth / 2;
    let ty = innerHeight / 2;
    let x = tx;
    let y = ty;
    let hovering = false;

    window.addEventListener('pointermove', (event) => {
      tx = event.clientX;
      ty = event.clientY;
    }, { passive: true });

    document.querySelectorAll('[data-cursor], .gp-project, a').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        hovering = true;
        cursor?.classList.add('is-active');
        if (label) label.textContent = el.dataset.cursor || (el.classList.contains('gp-project') ? 'VIEW' : 'OPEN');
      });
      el.addEventListener('pointerleave', () => {
        hovering = false;
        cursor?.classList.remove('is-active');
      });
    });

    const tickCursor = () => {
      x += (tx - x) * 0.17;
      y += (ty - y) * 0.17;
      if (cursor) {
        cursor.style.setProperty('--cursor-x', x + 'px');
        cursor.style.setProperty('--cursor-y', y + 'px');
        if (hovering) {
          cursor.style.transform = `translate3d(${x}px,${y}px,0) scale(1)`;
        } else {
          cursor.style.transform = `translate3d(${x}px,${y}px,0) scale(.16)`;
        }
      }
      requestAnimationFrame(tickCursor);
    };
    tickCursor();
  }

  // Editorial reveal system.
  const revealTargets = [
    ...document.querySelectorAll('.gp-manifesto-copy, .gp-manifesto-note, .gp-work-head > *, .gp-project, .gp-story-head > *, .gp-story-copy article, .gp-capabilities-head > *, .gp-capability-list article, .gp-proof-copy > *, .gp-profile-info > *, .gp-contact > *')
  ];
  revealTargets.forEach((el) => el.classList.add('gp-reveal'));

  document.querySelectorAll('.gp-project-media, .gp-story-media, .gp-proof-photo').forEach((el) => el.classList.add('gp-clip'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.gp-reveal,.gp-clip').forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    document.querySelectorAll('.gp-reveal,.gp-clip').forEach((el) => observer.observe(el));
  }

  // Slight image movement makes the page feel filmed rather than card-based.
  if (!reduceMotion) {
    const media = [...document.querySelectorAll('.gp-project-media img, .gp-proof-photo img')];
    let rafPending = false;

    const updateParallax = () => {
      const vh = innerHeight;
      media.forEach((img) => {
        const rect = img.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const p = (rect.top + rect.height / 2 - vh / 2) / (vh + rect.height);
        img.style.setProperty('--gp-parallax', `${p * -24}px`);
        if (!img.closest('.gp-project:hover')) {
          img.style.transform = `translate3d(0,${p * -24}px,0) scale(1.08)`;
        }
      });
      rafPending = false;
    };

    window.addEventListener('scroll', () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });
    window.addEventListener('resize', updateParallax, { passive: true });
    updateParallax();
  }

  // If a remote stock video cannot load, keep the poster instead of showing a broken block.
  document.querySelectorAll('video').forEach((video) => {
    video.addEventListener('error', () => {
      video.pause();
      video.style.opacity = '0';
      const container = video.parentElement;
      const poster = video.getAttribute('poster');
      if (poster && container) {
        container.style.backgroundImage = `url("${poster}")`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
      }
    });
  });
})();