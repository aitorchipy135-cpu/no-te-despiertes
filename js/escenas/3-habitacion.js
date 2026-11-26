/* ESCENA 3 · LA HABITACIÓN SIN PAREDES
   Un suelo de baldosas brillantes en mitad del cielo. Una escalera de
   caracol que no lleva a ninguna parte, puertas flotando, un reloj de pie
   y un cuadro que cambia cuando miras el reloj. */
(() => {
  'use strict';
  const S = window.SUENO;

  S.escena({
    n: 3, nombre: 'La habitación sin paredes', tinta: '#2b2140', velo: '#fff6ef',

    construir(ctx) {
      const { T } = ctx, kit = S.kit;
      const scene = new T.Scene();
      const rnd = S.azar(303);

      const cielo = kit.cielo(scene, { arriba: '#97bdee', horizonte: '#fde3d4', abajo: '#f0bdd0', sol: [-0.6, 0.55, 0.45], solColor: '#fff3df' });
      kit.entorno(scene, cielo);
      scene.fog = new T.Fog('#f8dcd8', 26, 85);
      kit.hemi(scene, '#fff6f2', '#e8b9c6', 0.85);
      kit.sol(scene, [-12, 11, 9], '#ffeedd', 3.0, 9);

      /* ---------- suelo ---------- */
      const baldosas = kit.textura(512, 512, (c, w) => {
        const n = 4, s = w / n;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          c.fillStyle = (x + y) % 2 ? '#f3c4d3' : '#fff4f6';
          c.fillRect(x * s, y * s, s, s);
        }
        c.strokeStyle = 'rgba(160,110,130,.35)'; c.lineWidth = 3;
        for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, w); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke(); }
      }, { repetir: [1, 1] });
      const suelo = kit.caja(12, 0.06, 12, new T.MeshPhysicalMaterial({ map: baldosas, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.12 }), { r: 0.02, uv: 0.24 });
      suelo.position.y = -0.03;
      scene.add(suelo);
      const base = kit.caja(12.4, 0.7, 12.4, kit.yeso('#efcfc6'), { r: 0.12 });
      base.position.y = -0.41;
      scene.add(base);
      const alfombra = new T.Mesh(new T.CylinderGeometry(1.5, 1.5, 0.025, 56), kit.tela('#c7dcf2'));
      alfombra.position.set(1.6, 0.013, 1.4);
      alfombra.receiveShadow = true;
      scene.add(alfombra);

      // sillón
      const rosa = kit.tela('#f2adc1');
      const sillon = new T.Group();
      sillon.add(kit.en(kit.caja(1.05, 0.42, 0.9, rosa, { r: 0.12 }), 0, 0.3, 0));
      sillon.add(kit.en(kit.caja(1.05, 0.85, 0.26, rosa, { r: 0.12 }), 0, 0.78, -0.34));
      for (const s of [-1, 1]) sillon.add(kit.en(kit.caja(0.22, 0.58, 0.9, rosa, { r: 0.1 }), s * 0.52, 0.46, 0));
      sillon.position.set(2.5, 0, 2.4);
      sillon.rotation.y = -2.5;
      scene.add(sillon);

      /* ---------- escalera de caracol a ninguna parte ---------- */
      const yeso = kit.yeso('#f6e3dc');
      const eje = new T.Vector3(-2.6, 0, -2.4);
      const columna = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 9.4, 24), yeso);
      columna.position.set(eje.x, 4.7, eje.z);
      columna.castShadow = columna.receiveShadow = true;
      scene.add(columna);
      const peldanos = [];
      for (let i = 0; i < 32; i++) {
        const a = i * 0.42;
        const p = kit.caja(1.3, 0.1, 0.46, yeso, { r: 0.03 });
        const y0 = 0.25 + i * 0.27;
        p.position.set(eje.x + Math.cos(a) * 0.78, y0, eje.z + Math.sin(a) * 0.78);
        p.rotation.y = -a;
        scene.add(p);
        const pe = { p, y0, sube: 0 };
        peldanos.push(pe);
        ctx.interactivo(p, { etiqueta: 'sube', hover(on) { pe.sube = on ? 1 : 0; } });
      }

      /* ---------- puertas flotantes ---------- */
      const puertas = [];
      for (const [x, y, z, ry, color] of [[3.6, 2.4, -3.6, 0.3, '#a991da'], [-4.6, 4.2, 1.4, 1.2, '#f2a7bd'], [0.6, 5.8, -5.2, -0.2, '#9cc6ec'], [4.9, 5.0, 2.2, -1.0, '#f6cf86']]) {
        const pu = kit.puerta({ color });
        pu.grupo.position.set(x, y, z);
        pu.grupo.rotation.y = ry;
        scene.add(pu.grupo);
        const suelito = kit.caja(1.6, 0.14, 0.7, yeso, { r: 0.04 });
        suelito.position.y = -0.07;
        pu.grupo.add(suelito);
        puertas.push({ pu, y, fase: rnd() * 6 });
        ctx.interactivo(pu.grupo, { etiqueta: 'ábrela', hover(on) { pu.abrir(on); } });
      }

      /* ---------- reloj de pie ---------- */
      const madera = kit.madera('#b98f7a');
      const relojPie = new T.Group();
      relojPie.add(kit.en(kit.caja(0.74, 2.3, 0.42, madera, { r: 0.04 }), 0, 1.15, 0));
      relojPie.add(kit.en(kit.caja(0.86, 0.62, 0.5, madera, { r: 0.05 }), 0, 2.55, 0));
      relojPie.add(kit.en(kit.caja(0.9, 0.12, 0.54, madera, { r: 0.03 }), 0, 2.9, 0));
      const esfera = kit.reloj(0.26, { campanas: false, color: '#e9d38f' });
      esfera.grupo.position.set(0, 2.55, 0.2);
      relojPie.add(esfera.grupo);
      const ventana = new T.Mesh(new T.PlaneGeometry(0.44, 1.2), new T.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.15, roughness: 0.05, clearcoat: 1 }));
      ventana.position.set(0, 1.35, 0.215);
      relojPie.add(ventana);
      const hueco = new T.Mesh(new T.PlaneGeometry(0.44, 1.2), new T.MeshStandardMaterial({ color: '#4a3436', roughness: 0.8 }));
      hueco.position.set(0, 1.35, 0.212);
      relojPie.add(hueco);
      const pendulo = new T.Group();
      pendulo.position.set(0, 1.9, 0.235);
      const vara = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.85, 8), kit.metal('#e8cc8e'));
      vara.position.y = -0.42;
      pendulo.add(vara);
      const disco = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.025, 32), kit.metal('#e8cc8e'));
      disco.rotation.x = Math.PI / 2;
      disco.position.y = -0.85;
      pendulo.add(disco);
      relojPie.add(pendulo);
      kit.sombra(relojPie);
      relojPie.position.set(4.1, 0, -1.6);
      relojPie.rotation.y = -0.6;
      scene.add(relojPie);

      /* ---------- el cuadro ---------- */
      const muroCuadro = kit.muro(3.2, 3.6, 0.3, [], kit.yeso('#f8e6de'));
      muroCuadro.position.set(0.6, 0, -4.4);
      scene.add(muroCuadro);
      const marco = kit.caja(1.86, 1.36, 0.09, kit.metal('#dcc08a', { roughness: 0.35 }), { r: 0.02 });
      marco.position.set(0.6, 2.1, -4.2);
      scene.add(marco);
      const lienzo = kit.lienzo(512, 352, () => {});
      const cuadroTx = new T.CanvasTexture(lienzo);
      cuadroTx.colorSpace = T.SRGBColorSpace;
      const cuadro = new T.Mesh(new T.PlaneGeometry(1.66, 1.14), new T.MeshStandardMaterial({ map: cuadroTx, roughness: 0.75 }));
      cuadro.position.set(0.6, 2.1, -4.15);
      scene.add(cuadro);
      const estrellas = Array.from({ length: 40 }, () => [rnd() * 512, rnd() * 200, rnd() * 1.6 + 0.4]);
      function pintarCuadro(k, ojos) {
        const c = lienzo.getContext('2d'), w = 512, h = 352;
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#2c2a5e'); g.addColorStop(0.7, '#6b5aa8'); g.addColorStop(1, '#e9a7bf');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(255,255,255,.8)';
        for (const [x, y, r] of estrellas) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
        const mx = S.mix(110, 400, k), my = 110;
        const halo = c.createRadialGradient(mx, my, 20, mx, my, 110);
        halo.addColorStop(0, 'rgba(255,230,160,.55)'); halo.addColorStop(1, 'rgba(255,230,160,0)');
        c.fillStyle = halo; c.fillRect(0, 0, w, h);
        c.fillStyle = '#fff1bd'; c.beginPath(); c.arc(mx, my, 48, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#6b5b7a'; c.lineWidth = 4; c.lineCap = 'round';
        for (const s of [-1, 1]) {
          if (ojos > 0.5) {
            c.fillStyle = '#fff'; c.beginPath(); c.arc(mx + s * 17, my - 4, 8, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#2b2140'; c.beginPath(); c.arc(mx + s * 17 + 2, my - 3, 4, 0, Math.PI * 2); c.fill();
          } else { c.beginPath(); c.arc(mx + s * 17, my - 6, 9, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }
        }
        c.fillStyle = '#3d3570';
        c.beginPath(); c.ellipse(120, h + 40, 260, 120, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#2f2960';
        c.beginPath(); c.ellipse(420, h + 60, 240, 130, 0, 0, Math.PI * 2); c.fill();
        cuadroTx.needsUpdate = true;
      }
      let lunaK = 0, lunaObj = 0, ojos = 0, prisa = 0, dibujado = -1;
      pintarCuadro(0, 0);
      ctx.interactivo(relojPie, { etiqueta: 'mira el cuadro', hover(on) { lunaObj = on ? 1 : 0; } });
      ctx.interactivo(cuadro, { etiqueta: 'mira el reloj', hover(on) { prisa = on ? 1 : 0; } });

      /* ---------- ventana flotante a otra noche ---------- */
      const otraNoche = kit.textura(256, 320, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#1c1f4a'); g.addColorStop(1, '#7a6ab8');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = '#fff';
        for (let i = 0; i < 60; i++) { c.globalAlpha = rnd(); c.fillRect(rnd() * w, rnd() * h * 0.8, 2, 2); }
        c.globalAlpha = 1;
      });
      const ventanaFlot = new T.Group();
      ventanaFlot.add(new T.Mesh(new T.PlaneGeometry(1.3, 1.7), new T.MeshBasicMaterial({ map: otraNoche })));
      const blanco = kit.pintura('#fbf6f2');
      for (const [x, y, w, h] of [[0, 0.9, 1.5, 0.1], [0, -0.9, 1.5, 0.1], [-0.7, 0, 0.1, 1.9], [0.7, 0, 0.1, 1.9], [0, 0, 0.05, 1.7], [0, 0, 1.3, 0.05]]) {
        ventanaFlot.add(kit.en(kit.caja(w, h, 0.1, blanco, { r: 0.01 }), x, y, 0.02));
      }
      ventanaFlot.position.set(-5.6, 3.2, -1.5);
      ventanaFlot.rotation.y = 1.0;
      scene.add(ventanaFlot);

      // nubes lejanas y motas
      for (let i = 0; i < 14; i++) {
        const a = rnd() * Math.PI * 2, r = 16 + rnd() * 16;
        const n = kit.nube({ tam: 3 + rnd() * 3, semilla: 330 + i });
        n.position.set(Math.cos(a) * r, -6 + rnd() * 12, Math.sin(a) * r);
        scene.add(n);
      }
      scene.add(kit.motas(140, [0, 3, 0, 12, 7, 12], { color: '#fff6e8', tam: 24, opacidad: 0.55, sube: 0.05 }));

      const ruta = kit.ruta([
        [0.00, [0, 3.2, 12.5], [0, 1.4, 0]],
        [0.18, [-6.5, 3.6, 8], [0.5, 1.4, -0.5]],
        [0.40, [6.8, 2.6, 4.2], [2.4, 1.9, -2.6]],
        [0.62, [-3.5, 5.2, 7], [1, 4.2, -1.5]],
        [0.82, [0.6, 5.8, 1.4], [-2.6, 6.4, -2.4]],
        [1.00, [-2.6, 9.6, -0.6], [-2.4, 15, -3.2]],
      ]);

      let minutos = 0;
      return {
        scene, fov: 40,
        camara: (t, cam) => ruta(t, cam),
        animar(t, dt, c) {
          const tt = c.tiempo;
          for (const pe of peldanos) {
            pe.cur = S.amort(pe.cur || 0, pe.sube, 6, dt);
            pe.p.position.y = pe.y0 + pe.cur * 0.14;
          }
          for (const d of puertas) {
            d.pu.grupo.position.y = d.y + Math.sin(tt * 0.6 + d.fase) * 0.18;
            d.pu.grupo.rotation.z = Math.sin(tt * 0.4 + d.fase) * 0.03;
            d.pu.actualizar(dt);
          }
          pendulo.rotation.z = Math.sin(tt * 2.2) * 0.32 * (1 + prisa);
          minutos += dt * (0.5 + prisa * 40);
          esfera.fijar(minutos / 60, minutos % 60);
          lunaK = S.amort(lunaK, lunaObj, 2.2, dt);
          ojos = S.amort(ojos, lunaObj, 5, dt);
          const firma = Math.round(lunaK * 120) + (ojos > 0.5 ? 1000 : 0);
          if (firma !== dibujado) { dibujado = firma; pintarCuadro(lunaK, ojos); }
          ventanaFlot.position.y = 3.2 + Math.sin(tt * 0.5) * 0.2;
        },
      };
    },
  });
})();
