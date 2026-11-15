(() => {
  'use strict';
  // Shop pages: the size and color picker, Stripe's embedded checkout, and the thank-you page.
  // Stripe.js is loaded only when someone presses Buy, so browsing the shop sends nothing to Stripe.
  const STRIPE_JS = 'https://js.stripe.com/dahlia/stripe.js';   // matches the API version pinned in api/shop-lib.php
  const money = c => `$${(c / 100).toFixed(2)}`;

  let stripeLoad = null;
  const loadStripe = () => stripeLoad || (stripeLoad = new Promise((resolve, reject) => {
    if (window.Stripe) return resolve();
    const s = document.createElement('script');
    s.src = STRIPE_JS; s.async = true;
    s.onload = () => (window.Stripe ? resolve() : reject(new Error('Stripe did not load')));
    s.onerror = () => { stripeLoad = null; reject(new Error('Stripe could not be reached. Check your connection and try again.')); };
    document.head.appendChild(s);
  }));

  // ---- product page ---------------------------------------------------------------
  const form = document.querySelector('[data-product]');
  const dataEl = document.getElementById('product-data');
  if (form && dataEl) {
    const P = JSON.parse(dataEl.textContent);
    const radios = [...form.querySelectorAll('input[data-opt]')];
    const qty = form.querySelector('[data-qty]');
    const buy = form.querySelector('[data-buy]');
    const status = form.querySelector('[data-status]');
    const priceEl = form.querySelector('[data-price]');
    const shipEl = form.querySelector('[data-ship]');
    const mainImg = document.querySelector('[data-main]');
    const thumbs = [...document.querySelectorAll('.product__thumbs li')];
    const dialog = document.getElementById('checkout');
    const mount = dialog.querySelector('[data-mount]');
    const summary = dialog.querySelector('[data-summary]');
    let checkout = null, busy = false;

    const picked = () => P.options.map((o, i) => { const r = radios.find(x => +x.dataset.opt === i && x.checked); return r ? +r.value : null; });
    const variantFor = sel => P.variants.find(v => v.options.every((id, i) => id === sel[i]));
    // a value can be picked if some in-stock variant has it together with the choices made before it (P.order:
    // color first, then size), so picking a color never leaves you on a size that's missing or sold out in it
    const reachable = (sel, before, i, id) => P.variants.some(v => v.available && v.options[i] === id && before.every(j => v.options[j] === sel[j]));

    function update(changedOpt = -1) {
      const sel = picked();
      P.order.forEach((i, k) => {
        const before = P.order.slice(0, k);
        const mine = radios.filter(r => +r.dataset.opt === i);
        for (const r of mine) {
          const ok = reachable(sel, before, i, +r.value);
          r.disabled = !ok;
          r.closest('label')?.classList.toggle('is-out', !ok);
        }
        const cur = mine.find(r => r.checked);
        if (!cur || cur.disabled) {   // the earlier choice ruled this one out: take the first that fits
          const next = mine.find(r => !r.disabled);
          if (next) { next.checked = true; sel[i] = +next.value; }
        }
      });
      const v = variantFor(sel);
      for (const el of form.querySelectorAll('[data-opt-name]')) {
        const i = +el.dataset.optName, val = P.options[i].values.find(x => x.id === sel[i]);
        el.textContent = val ? val.title : '';
      }
      if (v) {
        priceEl.textContent = money(v.price);
        shipEl.textContent = `+ ${money(v.ship[0])} shipping`;
      }
      const sold = !v || !v.available;
      buy.disabled = sold;
      buy.textContent = sold ? 'Sold out' : 'Buy now';
      status.textContent = sold ? 'That combination is sold out right now. Try another size or color.' : '';
      // pictures follow the color
      if (P.colorOption >= 0 && (changedOpt === P.colorOption || changedOpt === -1)) {
        const g = sel[P.colorOption];
        let first = null;
        for (const li of thumbs) {
          const on = li.dataset.groups.split(' ').map(Number).includes(g);
          li.hidden = !on;
          if (on && !first) first = li;
        }
        if (first && changedOpt !== -1) show(first.querySelector('button'));
      }
      return v;
    }

    function show(btn) {
      mainImg.src = btn.dataset.src;
      for (const b of document.querySelectorAll('.product__thumb')) b.removeAttribute('aria-current');
      btn.setAttribute('aria-current', 'true');
    }

    form.addEventListener('change', e => { if (e.target.matches('input[data-opt]')) update(+e.target.dataset.opt); });
    document.querySelector('.product__thumbs')?.addEventListener('click', e => { const b = e.target.closest('.product__thumb'); if (b) show(b); });

    function fail(message) {
      mount.replaceChildren(Object.assign(document.createElement('p'), { className: 'checkout__error', textContent: message }));
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (busy) return;
      const v = update();
      if (!v || !v.available) return;
      const n = Math.max(1, Math.min(P.maxQty, +qty.value || 1));
      busy = true; buy.disabled = true;
      summary.textContent = `${P.title} · ${v.title} · ${n} × ${money(v.price)} + ${money(v.ship[0] + (n - 1) * v.ship[1])} shipping`;
      mount.replaceChildren(Object.assign(document.createElement('p'), { className: 'checkout__wait', textContent: 'Opening secure checkout…' }));
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      try {
        const [res] = await Promise.all([
          fetch('/api/checkout.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: P.id, variant: v.id, qty: n }) }),
          loadStripe(),
        ]);
        const d = await res.json().catch(() => ({}));
        if (!res.ok || !d.clientSecret) throw new Error(d.error || 'Checkout could not start. Please try again in a minute.');
        if (!dialog.open) return;   // closed while we waited
        const stripe = window.Stripe(d.publishableKey);
        if (checkout) { checkout.destroy(); checkout = null; }
        mount.replaceChildren();
        checkout = await stripe.createEmbeddedCheckoutPage({ fetchClientSecret: async () => d.clientSecret });
        checkout.mount(mount);
      } catch (err) {
        fail(err.message || 'Checkout could not start.');
      } finally {
        busy = false; buy.disabled = false;
      }
    });

    const close = () => dialog.close ? dialog.close() : dialog.removeAttribute('open');
    dialog.querySelector('[data-close]').addEventListener('click', close);
    dialog.addEventListener('close', () => { if (checkout) { checkout.destroy(); checkout = null; } mount.replaceChildren(); });
    update();
  }

  // ---- thank-you page ----------------------------------------------------------------
  const thanks = document.querySelector('[data-thanks]');
  if (thanks) {
    const id = new URLSearchParams(location.search).get('session_id');
    const title = thanks.querySelector('[data-thanks-title]');
    const text = thanks.querySelector('[data-thanks-text]');
    if (id) {
      fetch(`/api/shop-status.php?session_id=${encodeURIComponent(id)}`)
        .then(r => r.json())
        .then(s => {
          if (s.status === 'complete') {
            title.textContent = 'Thanks for your order!';
            text.textContent = `We've sent the receipt to ${s.email || 'your email'}. Your order is printed just for you, usually arrives in ${thanks.dataset.days} business days, and you'll get tracking when it ships.`
              + (s.test ? ' (Test mode: no real payment was taken and nothing will be printed.)' : '');
          } else if (s.status === 'open' || s.status === 'expired') {
            title.textContent = 'Your order didn’t go through';
            text.textContent = 'No payment was taken. You can go back to the shop and try again.';
          }
        })
        .catch(() => {});
    }
  }
})();
