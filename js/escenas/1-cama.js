/* ESCENA 1 · LA CAMA FLOTANTE
   Una isla de yeso flotando sobre las nubes: la cama, la mesilla con su
   lámpara (apágala y se hace de noche), una puerta a ninguna parte, ovejas
   saltando la valla y la luna dormida (pásale el ratón por encima). */
(() => {
  'use strict';
  const S = window.SUENO;

  S.escena({
    n: 1, nombre: 'La cama flotante', tinta: '#2b2140', velo: '#fbf4ee',

    construir(ctx) {
      const { T } = ctx, kit = S.kit;
      const scene = new T.Scene();
      const rnd = S.azar(101);

      /* ---------- cielo, niebla y luz ---------- */
      const DIA = { arriba: new T.Color('#a7b8ea'), horizonte: new T.Color('#f9dbd0'), abajo: new T.Color('#e9b6c8'), niebla: new T.Color('#f4d3d2') };
      const NOCHE = { arriba: new T.Color('#0c1030'), horizonte: new T.Color('#352a62'), abajo: new T.Color('#191538'), niebla: new T.Color('#2a2452') };
      const cielo = kit.cielo(scene, { arriba: '#a7b8ea', horizonte: '#f9dbd0', abajo: '#e9b6c8', sol: [0.7, 0.62, 0.35], solColor: '#fff0d8' });
      kit.entorno(scene, cielo);
      scene.fog = new T.Fog(DIA.niebla.clone(), 24, 75);
      const hemi = kit.hemi(scene, '#fff5f0', '#d9a8ba', 1.1);
      const sol = kit.sol(scene, [12, 11, 6], '#ffe9d2', 3.0, 9);
      const solDia = new T.Color('#ffe9d2'), solNoche = new T.Color('#9fb3ff');

      /* ---------- la isla ---------- */
      const mundo = new T.Group();
      scene.add(mundo);
      const yesoRosa = kit.yeso('#eec2c2'), yesoClaro = kit.yeso('#f6dcd8');
      mundo.add(kit.isla(10, 8, yesoRosa, { matTop: yesoClaro }));

      // estanque poco profundo con borde
      const estanque = new T.Group();
      estanque.position.set(-2.9, 0, -2.1);
      const agua = kit.agua(2.6, 1.8, { color: '#c4d4e2', ondas: 0.012 });
      agua.position.y = 0.04;
      estanque.add(agua);
      for (const [x, z, w, d] of [[0, -1.0, 2.9, 0.15], [0, 1.0, 2.9, 0.15], [-1.375, 0, 0.15, 1.85], [1.375, 0, 0.15, 1.85]]) {
        const b = kit.caja(w, 0.16, d, yesoClaro, { r: 0.03 });
        b.position.set(x, 0.08, z);
        estanque.add(b);
      }
      mundo.add(estanque);
      const bola = new T.Mesh(new T.SphereGeometry(0.38, 64, 48), kit.vidrio({ thickness: 0.45 }));
      bola.position.set(-1.25, 0.38, -2.75);
      bola.castShadow = true;
      mundo.add(bola);

      // escalones que bajan al vacío
      for (let i = 0; i < 6; i++) {
        const e = kit.caja(0.55, 0.16, 1.1, yesoClaro, { r: 0.03 });
        e.position.set(5.25 + i * 0.58, -0.1 - i * 0.36, 1.7);
        mundo.add(e);
      }

      /* ---------- el dormitorio ---------- */
      const cuarto = new T.Group();
      cuarto.position.set(0.5, 0, 0.6);
      cuarto.rotation.y = -0.3;
      mundo.add(cuarto);
      cuarto.add(kit.cama());
      const mesilla = new T.Group();
      mesilla.position.set(-1.2, 0, -0.85);
      const madera = kit.madera('#d1ab90');
      const mueble = kit.caja(0.55, 0.55, 0.45, madera, { r: 0.03 });
      mueble.position.y = 0.275;
      mesilla.add(mueble);
      const cajon = kit.caja(0.46, 0.18, 0.02, madera, { r: 0.008 });
      cajon.position.set(0, 0.38, 0.23);
      mesilla.add(cajon);
      const tirador = new T.Mesh(new T.SphereGeometry(0.022, 12, 8), kit.metal());
      tirador.position.set(0, 0.38, 0.25);
      mesilla.add(tirador);
      const lampara = kit.lampara();
      lampara.grupo.position.y = 0.55;
      mesilla.add(lampara.grupo);
      cuarto.add(mesilla);
      // una alfombra redonda
      const alfombra = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 0.025, 48), kit.tela('#cfe0f2'));
      alfombra.position.set(-0.9, 0.012, 1.4);
      alfombra.receiveShadow = true;
      cuarto.add(alfombra);

      let noche = 0, nocheObj = 0;
      ctx.interactivo(lampara.grupo, {
        etiqueta: () => (nocheObj ? 'enciende la luz' : 'apaga la luz'),
        click() { nocheObj = nocheObj ? 0 : 1; },
      });

      /* ---------- puerta a ninguna parte ---------- */
      const puerta = kit.puerta({ color: '#a991da' });
      puerta.grupo.position.set(3.3, 0, -2.4);
      puerta.grupo.rotation.y = -0.55;
      mundo.add(puerta.grupo);
      ctx.interactivo(puerta.grupo, { etiqueta: 'ábrela', hover(on) { puerta.abrir(on); } });

      /* ---------- valla y ovejas ---------- */
      const blanco = kit.pintura('#fbf6f2');
      const valla = new T.Group();
      valla.position.set(-2.9, 0, 2.7);
      for (let i = 0; i < 7; i++) {
        const p = kit.caja(0.08, 0.62, 0.08, blanco, { r: 0.015 });
        p.position.set(-1.35 + i * 0.45, 0.31, 0);
        valla.add(p);
      }
      for (const y of [0.25, 0.48]) {
        const r = kit.caja(2.9, 0.07, 0.04, blanco, { r: 0.012 });
        r.position.set(0, y, 0.05);
        valla.add(r);
      }
      mundo.add(valla);
      const ovejas = [];
      for (let i = 0; i < 4; i++) {
        const o = kit.oveja({ semilla: 30 + i });
        o.rotation.y = Math.PI / 2;
        mundo.add(o);
        ovejas.push({ o, x: -3.5 + (i % 2) * 0.9 + rnd() * 0.2, fase: i / 4 });
      }

      /* ---------- la luna ---------- */
      const luna = kit.luna(2.6);
      luna.position.set(-6, 7.5, -22);
      scene.add(luna);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: kit.puff(), color: new T.Color('#ffe4b0'), blending: T.AdditiveBlending, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
      halo.scale.set(15, 15, 1);
      halo.position.copy(luna.position);
      scene.add(halo);
      let lunaDespierta = false;
      ctx.interactivo(luna, {
        etiqueta: 'shhh…',
        hover(on) { lunaDespierta = on; luna.userData.poner(on ? 'despierta' : 'dormida'); },
      });

      /* ---------- nubes ---------- */
      const nubes = [];
      for (let i = 0; i < 18; i++) {
        const a = rnd() * Math.PI * 2, r = 9 + rnd() * 18;
        const n = kit.nube({ tam: 2.2 + rnd() * 3, semilla: 200 + i, sombra: '#e6cfe0' });
        n.position.set(Math.cos(a) * r, -7 + rnd() * 9, Math.sin(a) * r - 4);
        scene.add(n);
        nubes.push({ n, v: 0.15 + rnd() * 0.25 });
      }
      // polvo de luz
      scene.add(kit.motas(160, [0, 2, 0, 16, 7, 14], { color: '#fff4e2', tam: 26, opacidad: 0.6, sube: 0.08 }));

      /* ---------- cámara ---------- */
      const ruta = kit.ruta([
        [0.00, [-11, 5.8, 15], [0, -0.2, 0]],
        [0.22, [-4.6, 3.3, 10], [-0.8, 0.4, 0.5]],
        [0.40, [-0.6, 1.8, 7.2], [-2.8, 0.6, 2.5]],
        [0.58, [3.2, 2.3, 3.7], [-6, 7.5, -22]],
        [0.75, [-2.6, 1.75, 1.7], [-0.4, 0.8, -0.55]],
        [0.90, [-0.3, 2.6, 3.2], [0.6, 0.7, 0]],
        [1.00, [0.8, 1.05, 0.35], [0.74, 0.8, -0.3]],
      ]);

      const m = {
        scene, fov: 38, tinta: '#2b2140',
        camara: (t, cam) => ruta(t, cam),
        animar(t, dt, c) {
          const tt = c.tiempo;
          mundo.position.y = Math.sin(tt * 0.5) * 0.06;

          // noche ↔ día
          noche = S.amort(noche, nocheObj, 1.6, dt);
          const u = cielo.u;
          u.uTop.value.lerpColors(DIA.arriba, NOCHE.arriba, noche);
          u.uHor.value.lerpColors(DIA.horizonte, NOCHE.horizonte, noche);
          u.uBot.value.lerpColors(DIA.abajo, NOCHE.abajo, noche);
          u.uSunFuerza.value = 1 - noche;
          u.uStars.value = noche;
          scene.fog.color.lerpColors(DIA.niebla, NOCHE.niebla, noche);
          sol.intensity = S.mix(3.0, 0.45, noche);
          sol.color.lerpColors(solDia, solNoche, noche);
          hemi.intensity = S.mix(1.1, 0.22, noche);
          scene.environmentIntensity = S.mix(1, 0.28, noche);
          lampara.set(S.mix(0.35, 1, noche), S.mix(2, 10, noche));
          luna.material.emissiveIntensity = S.mix(0.9, 1.4, noche) + (lunaDespierta ? 0.25 : 0);
          halo.material.opacity = S.mix(0.45, 0.9, noche);
          m.tinta = noche > 0.5 ? '#f3ecff' : '#2b2140';
          m.bloom = S.mix(0.32, 0.55, noche);

          luna.lookAt(c.camera.position);
          luna.position.y = 7.5 + Math.sin(tt * 0.7) * 0.15;
          halo.position.copy(luna.position);
          puerta.actualizar(dt);

          // ovejas saltando la valla, una detrás de otra
          for (const ov of ovejas) {
            const k = (tt * 0.16 + ov.fase) % 1;
            const z = S.mix(4.0, 1.0, k);
            const salto = Math.sin(Math.PI * S.tramo(z, 3.25, 2.15)) * 0.62;
            const esc = S.suave(S.tramo(k, 0, 0.12)) * (1 - S.suave(S.tramo(k, 0.86, 1)));
            ov.o.position.set(ov.x, salto, z);
            ov.o.scale.setScalar(Math.max(0.001, esc));
            ov.o.rotation.z = -Math.cos(Math.PI * S.tramo(z, 3.25, 2.15)) * 0.25 * (salto > 0.01 ? 1 : 0);
            const pasos = Math.sin(tt * 11 + ov.fase * 9) * 0.5 * (salto > 0.01 ? 0.2 : 1);
            ov.o.userData.patas.forEach((p, j) => { p.rotation.z = (j % 2 ? pasos : -pasos); });
          }
          for (const nb of nubes) nb.n.position.x += nb.v * dt * 0.3;
        },
      };
      return m;
    },
  });
})();
