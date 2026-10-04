(() => {
  if (!document.body.classList.contains('portfolio-home')) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  const menu = document.querySelector('.play-menu');
  const nav = document.querySelector('.play-nav');
  menu?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open') ?? false;
    menu.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }));

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Custom cursor on precise pointers.
  if (!coarse && !reduceMotion) {
    const cursor = document.querySelector('.site-cursor');
    const label = cursor?.querySelector('span');
    let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty;
    let active = false;

    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
    }, { passive: true });

    document.querySelectorAll('[data-cursor], a').forEach(el => {
      el.addEventListener('pointerenter', () => {
        active = true;
        cursor?.classList.add('active');
        if (label) label.textContent = el.dataset.cursor || 'OPEN';
      });
      el.addEventListener('pointerleave', () => {
        active = false;
        cursor?.classList.remove('active');
      });
    });

    const drawCursor = () => {
      x += (tx - x) * .18;
      y += (ty - y) * .18;
      cursor?.style.setProperty('--cx', x + 'px');
      cursor?.style.setProperty('--cy', y + 'px');
      cursor && (cursor.style.transform = `translate3d(${x}px,${y}px,0) scale(${active ? 1 : .13})`);
      requestAnimationFrame(drawCursor);
    };
    drawCursor();
  }

  // Floating project cluster: each card reacts according to its depth.
  const orbit = document.querySelector('.project-orbit');
  const cards = [...document.querySelectorAll('[data-project-card]')];
  if (orbit && cards.length && !reduceMotion) {
    let mx = 0, my = 0, sx = 0, sy = 0;

    orbit.addEventListener('pointermove', e => {
      const r = orbit.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - .5;
      my = (e.clientY - r.top) / r.height - .5;
    }, { passive: true });
    orbit.addEventListener('pointerleave', () => { mx = 0; my = 0; });

    const started = performance.now();
    const animateOrbit = (now = performance.now()) => {
      sx += (mx - sx) * .045;
      sy += (my - sy) * .045;
      const t = (now - started) * .001;
      cards.forEach((card, i) => {
        const depth = Number(card.dataset.depth || 1);
        const phase = i * 2.17;
        const driftX = Math.sin(t * .55 + phase) * 7 * depth;
        const driftY = Math.cos(t * .68 + phase) * 9 * depth;
        const x = sx * 34 * depth + driftX;
        const y = sy * 24 * depth + driftY;
        const rx = sy * -5 * depth + Math.sin(t * .43 + phase) * 2.4;
        const ry = sx * 7 * depth + Math.cos(t * .51 + phase) * 3.2;
        const baseZ = card.classList.contains('orbit-gym') ? -5 :
                      card.classList.contains('orbit-flight') ? 5 : 7;
        const rz = baseZ + Math.sin(t * .38 + phase) * 1.8;
        const baseDepth = card.classList.contains('orbit-flight') ? 230 : card.classList.contains('orbit-gym') ? 140 : 95;
        const z = baseDepth + Math.sin(t * .46 + phase) * 20;
        card.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
      });
      requestAnimationFrame(animateOrbit);
    };
    requestAnimationFrame(animateOrbit);

    addEventListener('scroll', () => {
      const p = Math.min(1, scrollY / innerHeight);
      orbit.style.transform = `translate3d(0,${p * -28}px,0) scale(${1 - p * .025})`;
    }, { passive:true });
  }

  // Gallery-Play-like expanding cards. Hover on desktop, tap on mobile.
  const impressiveCards = [...document.querySelectorAll('[data-impressive-card]')];
  impressiveCards.forEach(card => {
    card.addEventListener('click', e => {
      if (!coarse) return;
      if (!card.classList.contains('is-active')) {
        e.preventDefault();
        impressiveCards.forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
      }
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        impressiveCards.forEach(c => c.classList.toggle('is-active', c === card && !c.classList.contains('is-active')));
      }
    });
  });

  // Reveal choreography.
  const revealSelectors = [
    '.intro-section > *',
    '.impressive-intro > *',
    '.impressive-card',
    '.work-heading > *',
    '.work-feature',
    '.about-head > *',
    '.about-copy article',
    '.range-head > *',
    '.range-list article',
    '.proof-copy > *',
    '.identity-info > *',
    '.contact-section > *'
  ];
  const revealEls = revealSelectors.flatMap(s => [...document.querySelectorAll(s)]);
  revealEls.forEach(el => el.classList.add('reveal-up'));
  document.querySelectorAll('.work-media,.about-media,.proof-section>img').forEach(el => el.classList.add('media-clip'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-up,.media-clip').forEach(el => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      });
    }, { threshold:.12, rootMargin:'0px 0px -5% 0px' });
    document.querySelectorAll('.reveal-up,.media-clip').forEach(el => io.observe(el));
  }

  // Internal page transition.
  const wipe = document.querySelector('.page-wipe');
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) return;
    a.addEventListener('click', e => {
      if (reduceMotion || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      wipe?.classList.add('is-leaving');
      setTimeout(() => location.href = href, 470);
    });
  });

  // Remote video fallbacks keep imagery intact if the video CDN fails.
  document.querySelectorAll('video').forEach(video => {
    video.addEventListener('error', () => {
      const poster = video.getAttribute('poster');
      const parent = video.parentElement;
      if (poster && parent) {
        video.style.display = 'none';
        parent.style.background = `center / cover no-repeat url("${poster}")`;
      }
    });
  });
})();