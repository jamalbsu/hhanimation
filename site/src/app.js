(() => {
  'use strict';

  // ---- hero: the live episode in the phone -------------------------------
  // The poster image shows first; the animation page loads after the rest of
  // the page and fades in. It is skipped for people who ask for less motion.
  const live = document.querySelector('.phone iframe[data-src]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let onScreen = true, playerOpen = false, liveReady = false;

  const syncLive = () => {
    if (!liveReady || !live.contentWindow) return;
    live.contentWindow.postMessage(onScreen && !playerOpen ? 'hh:play' : 'hh:pause', location.origin);
  };

  if (live && !reduce) {
    const start = () => {
      live.addEventListener('load', () => {
        liveReady = true;
        syncLive();
        setTimeout(() => live.classList.add('is-live'), 350);
      }, { once: true });
      live.src = live.dataset.src;
    };
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; syncLive(); }, { threshold: 0.02 }).observe(live);
    }
  }

  // ---- player: YouTube in a dialog ---------------------------------------
  // Links marked data-play are plain YouTube links without JavaScript.
  const dialog = document.getElementById('player');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const frameBox = dialog.querySelector('.player__frame');
  const heading = dialog.querySelector('#player-title');
  const more = dialog.querySelector('.player__more a');
  const roomy = matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)');

  function play({ title, short, long }) {
    const wide = Boolean(long) && roomy.matches;   // landscape cut on big screens, the Short on phones
    const id = wide ? long : short;
    dialog.classList.toggle('is-wide', wide);
    heading.textContent = title;
    more.href = wide ? `https://www.youtube.com/watch?v=${id}` : `https://www.youtube.com/shorts/${id}`;

    const frame = document.createElement('iframe');
    frame.title = `${title} on YouTube`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';   // YouTube refuses embeds that send no referrer
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
    frameBox.replaceChildren(frame);

    playerOpen = true; syncLive();
    dialog.showModal();
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-play]');
    if (!link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    play(link.dataset);
  });

  dialog.querySelector('.player__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    frameBox.replaceChildren();   // stops playback
    playerOpen = false; syncLive();
  });
})();
