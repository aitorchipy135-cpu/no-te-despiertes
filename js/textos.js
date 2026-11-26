/* =====================================================================
   NO TE DESPIERTES — textos vivos
   · Cada frase se parte en letras: entran subiendo desde una máscara,
     con desenfoque, una detrás de otra; al pasar, se van hacia arriba.
   · Las letras huyen un poco del cursor (como si les soplaras) y se
     inclinan con la velocidad del scroll.
   · En la pesadilla las letras se desordenan, tiemblan y fallan.
   · Los títulos de escena y el nombre de la escena del HUD también entran
     letra a letra.
   ===================================================================== */
(() => {
  'use strict';
  const S = window.SUENO;
  const X = (S.textos = {});
  const GLIFOS = 'abcdefghijklmnñopqrstuvwxyz¿?¡!#%&*@0123456789';

  let caps = [], velos = [], volver = null, escenaEl = null, iniciado = false, tiempo = 0;

  /** Parte los nodos de texto en .w (palabra con máscara) > .ch (letra) */
  function partir(el, desde = 0) {
    let i = desde;
    const chars = [];
    const recorrer = nodo => {
      for (const n of [...nodo.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const parte of n.textContent.split(/(\s+)/)) {
            if (!parte) continue;
            if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(' ')); continue; }
            const w = document.createElement('span');
            w.className = 'w';
            for (const c of parte) {
              const s = document.createElement('span');
              s.className = 'ch';
              s.textContent = c;
              s.style.setProperty('--i', i++);
              w.appendChild(s);
              chars.push({ el: s, c, x: 0, y: 0, r: 0, cx: 0, cy: 0 });
            }
            frag.appendChild(w);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'SMALL' && n.tagName !== 'BR' && !n.classList.contains('kicker')) {
          recorrer(n);
        }
      }
    };
    recorrer(el);
    return chars;
  }

  function estado(o, nuevo) {
    if (o.estado === nuevo) return false;
    o.estado = nuevo;
    o.el.classList.toggle('dentro', nuevo === 'dentro');
    o.el.classList.toggle('pasado', nuevo === 'pasado');
    return true;
  }

  // mide dónde está cada letra (sin contar sus transformaciones)
  function medirCap(o) {
    const r = o.el.getBoundingClientRect();
    for (const ch of o.chars) {
      // offsetLeft/Top son relativos a la .cap (su primer padre posicionado)
      ch.cx = r.left + ch.el.offsetLeft + ch.el.offsetWidth / 2;
      ch.cy = r.top + ch.el.offsetTop + ch.el.offsetHeight / 2;
    }
    o.medido = true;
  }

  // las letras se desordenan y vuelven a su sitio
  function desordenar(o, ms = 900) {
    const t0 = performance.now();
    const paso = () => {
      const k = (performance.now() - t0) / ms;
      for (const ch of o.chars) {
        if (ch.c === ' ') continue;
        ch.el.textContent = k < 1 && Math.random() > k ? GLIFOS[(Math.random() * GLIFOS.length) | 0] : ch.c;
      }
      if (k < 1) setTimeout(paso, 45);
    };
    paso();
  }

  X.iniciar = () => {
    caps = [...document.querySelectorAll('.cap')].map(el => ({
      el, a: +el.dataset.a, b: +el.dataset.b, creepy: el.classList.contains('creepy'),
      chars: partir(el), estado: '', medido: false,
    }));
    velos = [...document.querySelectorAll('.veil')].map(el => {
      partir(el.querySelector('h2'));
      return { el, vb: +el.dataset.vb, estado: '', creepy: el.classList.contains('creepy') };
    });
    volver = document.querySelector('.volver');
    escenaEl = document.querySelector('.hud .scene');
    partir(escenaEl);
    requestAnimationFrame(() => escenaEl.classList.add('dentro'));
    // el título espera a que se vaya la pantalla de carga
    setTimeout(() => { iniciado = true; }, 700);
    addEventListener('resize', X.medir);
  };

  X.medir = () => { for (const o of caps) o.medido = false; };

  /** Cambia el nombre de la escena del HUD con la misma animación */
  X.escena = def => {
    if (!escenaEl) return;
    escenaEl.classList.remove('dentro');
    escenaEl.classList.add('pasado');
    setTimeout(() => {
      escenaEl.classList.remove('pasado');
      escenaEl.innerHTML = `<b>Escena 0${def.n}</b><span>${def.nombre}</span>`;
      partir(escenaEl);
      requestAnimationFrame(() => requestAnimationFrame(() => escenaEl.classList.add('dentro')));
    }, 420);
  };

  X.actualizar = (p, vel, raton, dt) => {
    if (!iniciado) return;
    tiempo += dt;
    const skew = S.reduce ? 0 : S.clamp(vel * -1.8, -4, 4);

    for (const o of caps) {
      const nuevo = p < o.a ? 'antes' : p > o.b ? 'pasado' : 'dentro';
      if (estado(o, nuevo)) {
        if (nuevo === 'dentro') {
          o.medido = false;
          if (o.creepy) desordenar(o);
        }
        if (nuevo !== 'dentro') o.el.style.transform = '';
      }
      if (o.estado !== 'dentro') continue;

      o.el.style.transform = Math.abs(skew) > 0.02 ? `skewY(${skew.toFixed(2)}deg)` : '';
      if (!o.medido) medirCap(o);

      // las letras reaccionan al cursor
      for (let i = 0; i < o.chars.length; i++) {
        const ch = o.chars[i];
        const dx = ch.cx - raton.px, dy = ch.cy - raton.py;
        const d = Math.hypot(dx, dy) || 1;
        const f = raton.dentro ? Math.pow(Math.max(0, 1 - d / 150), 2) : 0;
        let tx, ty, tr;
        if (o.creepy) {
          // en la pesadilla tiemblan y se acercan al cursor
          const temblor = 0.6 + f * 5;
          tx = -dx / d * f * 10 + (Math.random() - 0.5) * temblor;
          ty = -dy / d * f * 10 + (Math.random() - 0.5) * temblor;
          tr = (Math.random() - 0.5) * f * 20;
        } else {
          tx = dx / d * f * 22;
          ty = dy / d * f * 22 - f * 8 + Math.sin(tiempo * 1.3 + i * 0.45) * 1.2;
          tr = dx / d * f * 14;
        }
        ch.x = S.amort(ch.x, tx, 12, dt);
        ch.y = S.amort(ch.y, ty, 12, dt);
        ch.r = S.amort(ch.r, tr, 12, dt);
        ch.el.style.translate = `${ch.x.toFixed(2)}px ${ch.y.toFixed(2)}px`;
        ch.el.style.rotate = `${ch.r.toFixed(2)}deg`;
      }
      // fallos sueltos en la pesadilla
      if (o.creepy && Math.random() < 0.12) {
        const ch = o.chars[(Math.random() * o.chars.length) | 0];
        ch.el.classList.add('glitch');
        ch.el.textContent = GLIFOS[(Math.random() * GLIFOS.length) | 0];
        setTimeout(() => { ch.el.classList.remove('glitch'); ch.el.textContent = ch.c; }, 90 + Math.random() * 120);
      }
    }

    for (const v of velos) {
      const nuevo = Math.abs(p - v.vb) < 0.0095 ? 'dentro' : p < v.vb ? 'antes' : 'pasado';
      estado(v, nuevo);
    }
    if (volver) {
      const dentro = p > +volver.dataset.a;
      volver.classList.toggle('dentro', dentro);
    }
  };
})();
