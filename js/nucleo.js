/* =====================================================================
   NO TE DESPIERTES — núcleo
   Espacio de nombres compartido por todos los scripts. Son scripts
   clásicos (no módulos) para que la web funcione abriendo index.html con
   doble clic; Three.js se carga después desde la CDN con import().
   ===================================================================== */
(() => {
  'use strict';

  const S = (window.SUENO = {
    escenas: [],     // definiciones de escena, en orden
    // límites de cada escena en el progreso del scroll (0..1)
    BORDES: [0, 0.1957, 0.3043, 0.4565, 0.5870, 0.7391, 0.8696, 1],
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
  });

  /** Registra una escena: { n, nombre, tinta, velo, construir(ctx) } */
  S.escena = def => { S.escenas.push(def); };

  // utilidades numéricas
  S.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  S.mix = (a, b, t) => a + (b - a) * t;
  S.suave = t => { t = S.clamp(t); return t * t * (3 - 2 * t); };
  S.tramo = (t, a, b) => S.clamp((t - a) / (b - a));         // 0..1 entre a y b
  S.campana = (t, a, b, f = 0.15) => S.suave(S.tramo(t, a, a + f)) * (1 - S.suave(S.tramo(t, b - f, b)));
  S.amort = (actual, objetivo, vel, dt) => actual + (objetivo - actual) * (1 - Math.exp(-vel * dt));

  // aleatorio con semilla: cada carga del sueño es igual
  S.azar = (semilla = 1) => () => {
    semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
