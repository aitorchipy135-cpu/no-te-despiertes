/* ESCENA 6 · SE DESHACE
   La pesadilla. La isla de la escena 1 se rompe en pedazos que flotan en
   una niebla roja; la luna está partida, las ovejas tienen los ojos rojos
   y te miran, y un ojo gigante sigue al cursor. */
(() => {
  'use strict';
  const S = window.SUENO;

  S.escena({
    n: 6, nombre: 'Se deshace', tinta: '#f3dfe5', velo: '#12060f', tintaVelo: '#ff4d63',

    construir(ctx) {
      const { T } = ctx, kit = S.kit;
      const scene = new T.Scene();
      const rnd = S.azar(606);
      const OJO = new T.Vector3(0, 3, -6);

      const cielo = kit.cielo(scene, { arriba: '#0b0407', horizonte: '#3f1024', abajo: '#120509', sol: [0, 0.2, -1], solColor: '#ff3b5c', solFuerza: 0.5 });
      kit.entorno(scene, cielo);
      scene.environmentIntensity = 0.35;
      scene.fog = new T.Fog('#1e0811', 6, 38);
      kit.hemi(scene, '#6a2238', '#080205', 0.55);
      kit.sol(scene, [-4, 12, -14], '#ff7486', 1.6, 12);
      const rojas = [0, 1, 2].map(i => {
        const l = new T.PointLight('#ff2a48', 10, 16, 1.6);
        l.position.set(Math.cos(i * 2.1) * 6, 1 + i, Math.sin(i * 2.1) * 6 - 3);
        scene.add(l);
        return l;
      });

      /* ---------- la isla rota ---------- */
      const yeso = kit.yeso('#b98e93'), yesoTop = kit.yeso('#d1aab0');
      const trozos = [];
      for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 4; iz++) {
        const w = 1.9 + rnd() * 0.2, d = 1.9 + rnd() * 0.2;
        const t = kit.caja(w, 0.7 + rnd() * 0.5, d, rnd() < 0.5 ? yeso : yesoTop, { r: 0.06 });
        const base = new T.Vector3(-4 + ix * 2, -0.4, -1.5 + iz * 2 - 3);
        const dir = base.clone().sub(new T.Vector3(0, -2, -4)).normalize().multiplyScalar(2.5 + rnd() * 5);
        dir.y += rnd() * 3 - 0.5;
        t.position.copy(base);
        scene.add(t);
        trozos.push({ t, base, dir, giro: new T.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(2.4) });
      }

      /* ---------- restos del sueño ---------- */
      const restos = [];
      const anadir = (obj, x, y, z) => {
        obj.position.set(x, y, z);
        scene.add(obj);
        restos.push({ obj, p: obj.position.clone(), eje: new T.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), v: 0.2 + rnd() * 0.5, fase: rnd() * 6 });
      };
      anadir(kit.cama({ manta: '#8e3550', madera: '#6e4a4f', sabana: '#d9c5cb' }), -5.5, 2.5, -2);
      const puertas = [];
      for (let i = 0; i < 3; i++) {
        const p = kit.puerta({ color: '#5b2a45', luz: '#ff3050', fuerza: 3, abierta: 0.3 + rnd() * 0.5 });
        p.actualizar(1);
        puertas.push(p);
        anadir(p.grupo, (rnd() - 0.5) * 14, 1 + rnd() * 5, -4 - rnd() * 8);
      }
      const relojes = [];
      for (let i = 0; i < 5; i++) {
        const r = kit.reloj(0.35, { color: '#5b3a5e' });
        relojes.push({ r, v: 2 + rnd() * 8 });
        anadir(r.grupo, (rnd() - 0.5) * 12, 1 + rnd() * 6, -2 - rnd() * 9);
      }
      for (let i = 0; i < 8; i++) anadir(kit.caja(0.85, 0.24, 0.58, kit.tela('#c9b3ba'), { r: 0.11, seg: 4 }), (rnd() - 0.5) * 14, rnd() * 7, -1 - rnd() * 10);

      /* ---------- la luna partida ---------- */
      const lunaMat = new T.MeshStandardMaterial({ color: '#d2c2a8', roughness: 1, emissive: new T.Color('#5a2a2a'), emissiveIntensity: 0.6, bumpMap: kit.ruido(), bumpScale: 3 });
      const grieta = kit.luz('#ff3a55', 6);
      const mitades = [0, 1].map(k => {
        const g = new T.Group();
        // k = 0: mitad derecha (x ≥ 0) · k = 1: mitad izquierda; la cara roja es el corte
        const m = new T.Mesh(new T.SphereGeometry(2.2, 48, 32, Math.PI / 2 + k * Math.PI, Math.PI), lunaMat);
        g.add(m);
        const cara = new T.Mesh(new T.CircleGeometry(2.18, 48), grieta);
        cara.rotation.y = k ? Math.PI / 2 : -Math.PI / 2;
        g.add(cara);
        g.position.set(7, 8, -20);
        scene.add(g);
        return g;
      });

      /* ---------- ovejas que te miran ---------- */
      const ovejas = [];
      for (let i = 0; i < 7; i++) {
        const o = kit.oveja({ malvada: true, semilla: 60 + i });
        o.scale.setScalar(1.2);
        scene.add(o);
        ovejas.push({ o, a: i / 7 * Math.PI * 2, r: 5 + rnd() * 3, y: rnd() * 4, v: 0.05 + rnd() * 0.08 });
      }

      /* ---------- el ojo ---------- */
      const ojoTx = kit.textura(1024, 512, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, '#f3c6cc'); g.addColorStop(0.25, '#fff7f4'); g.addColorStop(0.5, '#f3c6cc'); g.addColorStop(0.75, '#d68a98'); g.addColorStop(1, '#f3c6cc');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        // venas
        c.strokeStyle = 'rgba(190,20,50,.55)'; c.lineCap = 'round';
        for (let i = 0; i < 60; i++) {
          let x = rnd() < 0.5 ? 256 + (rnd() < 0.5 ? -1 : 1) * (150 + rnd() * 120) : rnd() * w, y = rnd() * h;
          c.lineWidth = 1 + rnd() * 2.5;
          c.beginPath(); c.moveTo(x, y);
          for (let k = 0; k < 8; k++) { x += (256 - x) * 0.08 + (rnd() - 0.5) * 30; y += (256 - y) * 0.08 + (rnd() - 0.5) * 30; c.lineTo(x, y); }
          c.stroke();
        }
        // iris y pupila mirando a +z (u = 0.25)
        const cx = 256, cy = 256;
        const ir = c.createRadialGradient(cx, cy, 10, cx, cy, 78);
        ir.addColorStop(0, '#050205'); ir.addColorStop(0.36, '#050205'); ir.addColorStop(0.4, '#8b0f2c'); ir.addColorStop(0.75, '#d1204a'); ir.addColorStop(0.95, '#3a0612'); ir.addColorStop(1, 'rgba(58,6,18,0)');
        c.fillStyle = ir; c.beginPath(); c.arc(cx, cy, 80, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(255,120,140,.35)'; c.lineWidth = 2;
        for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32); c.lineTo(cx + Math.cos(a) * 74, cy + Math.sin(a) * 74); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(cx - 22, cy - 24, 10, 0, Math.PI * 2); c.fill();
      });
      const ojo = new T.Group();
      ojo.position.copy(OJO);
      scene.add(ojo);
      const globo = new T.Mesh(new T.SphereGeometry(2, 64, 48), new T.MeshPhysicalMaterial({ map: ojoTx, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, emissive: new T.Color('#3a0a14'), emissiveIntensity: 0.4 }));
      ojo.add(globo);
      const piel = new T.MeshStandardMaterial({ color: '#2a0f1c', roughness: 0.65, side: T.DoubleSide });
      const parpados = [0, 1].map(k => {
        const p = new T.Mesh(new T.SphereGeometry(2.1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), piel);
        if (k) p.scale.y = -1;
        ojo.add(p);
        return p;
      });
      const brillo = new T.Sprite(new T.SpriteMaterial({ map: kit.puff(), color: new T.Color('#ff1e46'), blending: T.AdditiveBlending, transparent: true, opacity: 0.6, depthWrite: false }));
      brillo.scale.set(14, 14, 1);
      brillo.position.copy(OJO).add(new T.Vector3(0, 0, -2.5));
      scene.add(brillo);

      // ceniza que sube
      scene.add(kit.motas(400, [0, 3, -4, 24, 12, 20], { color: '#ff5a6e', tam: 26, opacidad: 0.8, sube: 0.35 }));

      /* ---------- cámara ---------- */
      const ruta = kit.ruta([
        [0.00, [0, 4, 15], [0, 3, -6]],
        [0.30, [-8, 6, 6], [0, 3, -6]],
        [0.60, [7, 1.6, 4], [0, 3, -6]],
        [0.85, [0.4, 3.2, 1.2], [0, 3, -6]],
        [1.00, [0, 3, -3.15], [0, 3, -6]],
      ]);
      const mira = new T.Vector3();
      let e = 0, parpadeo = 0, proximo = 3;
      const m = {
        scene, fov: 42, grano: 0.09, bloom: 0.7, glitch: 0.3, exposicion: 1.1,
        camara(t, cam, c) {
          ruta(t, cam);
          const tt = c.tiempo, k = 0.5 + t;
          cam.position.x += Math.sin(tt * 13.1) * 0.02 * k + Math.sin(tt * 2.3) * 0.08 * k;
          cam.position.y += Math.cos(tt * 11.7) * 0.02 * k;
          cam.rotateZ(Math.sin(tt * 0.7) * 0.07 * k);
        },
        animar(t, dt, c) {
          const tt = c.tiempo;
          e = S.suave(S.tramo(t, 0, 0.9));
          for (const tz of trozos) {
            tz.t.position.copy(tz.base).addScaledVector(tz.dir, e);
            tz.t.position.y += Math.sin(tt * 0.8 + tz.base.x) * 0.1;
            tz.t.rotation.set(tz.giro.x * e, tz.giro.y * e, tz.giro.z * e);
          }
          for (const r of restos) {
            r.obj.rotateOnAxis(r.eje, dt * r.v * (0.5 + e));
            r.obj.position.y = r.p.y + Math.sin(tt * 0.5 + r.fase) * 0.3;
          }
          for (const r of relojes) { const a = -tt * r.v; r.r.fijar(a / 12, a * 5); }
          for (const p of puertas) { p.abrir(0.3 + Math.abs(Math.sin(tt * 1.7 + p.grupo.position.x)) * 0.6); p.actualizar(dt); }
          mitades[0].position.x = 7 + 0.4 + e * 1.6; mitades[0].rotation.z = -e * 0.35;
          mitades[1].position.x = 7 - 0.4 - e * 1.6; mitades[1].rotation.z = e * 0.4;
          for (const ov of ovejas) {
            ov.a += ov.v * dt;
            ov.o.position.set(OJO.x + Math.cos(ov.a) * ov.r, ov.y + Math.sin(tt + ov.a) * 0.3, OJO.z + 4 + Math.sin(ov.a) * ov.r * 0.6);
            ov.o.lookAt(c.camera.position);
            ov.o.rotateY(-Math.PI / 2);
          }
          // el ojo sigue al cursor (o a ti)
          if (c.raton.dentro) c.puntoRaton(9, mira); else mira.copy(c.camera.position);
          globo.lookAt(mira);
          // parpadeo
          proximo -= dt;
          if (proximo < 0) { parpadeo = 1; proximo = 2.5 + Math.random() * 4; }
          parpadeo = Math.max(0, parpadeo - dt * 5);
          const cierre = Math.sin(parpadeo * Math.PI);
          parpados[0].rotation.x = -1.2 * (1 - cierre);
          parpados[1].rotation.x = 1.2 * (1 - cierre);
          for (const [i, l] of rojas.entries()) l.intensity = 8 + Math.sin(tt * (3 + i)) * 3 + (Math.random() < 0.04 ? -6 : 0);
          m.glitch = 0.25 + e * 0.55 + (Math.random() < 0.03 ? 0.8 : 0);
        },
      };
      return m;
    },
  });
})();
