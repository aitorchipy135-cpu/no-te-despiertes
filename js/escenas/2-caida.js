/* ESCENA 2 · LA CAÍDA
   Un pozo de yeso altísimo con ventanas al cielo. Caes despacio entre
   almohadas, relojes, puertas y plumas; la luz del sol entra por las
   ventanas y dibuja rectángulos en las paredes. Abajo, un nido de luz. */
(() => {
  'use strict';
  const S = window.SUENO;

  S.escena({
    n: 2, nombre: 'La caída', tinta: '#2b2140', velo: '#fbf4ee',

    construir(ctx) {
      const { T } = ctx, kit = S.kit;
      const scene = new T.Scene();
      const rnd = S.azar(202);
      const FONDO = -140, ANCHO = 7;

      const cielo = kit.cielo(scene, { arriba: '#9fb6ec', horizonte: '#fbe1d6', abajo: '#f3c3d2', sol: [0.45, 0.85, 0.3], solColor: '#fff0d6' });
      kit.entorno(scene, cielo);
      const nieblaArriba = new T.Color('#efd3dc'), nieblaAbajo = new T.Color('#fbe0c6');
      scene.fog = new T.Fog(nieblaArriba.clone(), 8, 46);
      kit.hemi(scene, '#fff4f2', '#f0c6d2', 1.6);
      const sol = kit.sol(scene, [6, 16, 4], '#ffe7cf', 3.6, 7, { lejos: 40 });
      // luz suave que cae contigo para que el pozo no se vuelva oscuro
      const acompana = new T.PointLight('#fff1ea', 10, 14, 1.3);
      scene.add(acompana);

      /* ---------- el pozo ---------- */
      const yeso = kit.yeso('#f1d4cc');
      for (let lado = 0; lado < 4; lado++) {
        const huecos = [];
        for (let y = -4; y > FONDO + 8; y -= 6.5 + rnd() * 3) {
          const n = rnd() < 0.35 ? 2 : 1;
          for (let k = 0; k < n; k++) {
            const w = 0.9 + rnd() * 0.7, h = 1.6 + rnd() * 1.4;
            const x = n === 1 ? (rnd() - 0.5) * 3 : (k ? 1.6 : -1.6) + (rnd() - 0.5) * 0.4;
            huecos.push({ x, y: y - FONDO, w, h, arco: rnd() < 0.5 });
          }
        }
        const muro = kit.muro(ANCHO + 0.6, -FONDO + 4, 0.5, huecos, yeso);
        muro.position.y = FONDO;
        const a = lado * Math.PI / 2;
        muro.position.x = Math.sin(a) * (ANCHO / 2 + 0.25);
        muro.position.z = Math.cos(a) * (ANCHO / 2 + 0.25);
        muro.rotation.y = a;
        scene.add(muro);
      }
      // cornisa de arriba
      const cornisa = new T.Group();
      for (let lado = 0; lado < 4; lado++) {
        const c = kit.caja(ANCHO + 1.6, 0.35, 0.8, kit.yeso('#f7e4dc'), { r: 0.08 });
        const a = lado * Math.PI / 2;
        c.position.set(Math.sin(a) * (ANCHO / 2 + 0.4), 4.15, Math.cos(a) * (ANCHO / 2 + 0.4));
        c.rotation.y = a;
        cornisa.add(c);
      }
      scene.add(cornisa);

      /* ---------- el fondo: un nido de almohadas con luz ---------- */
      const nido = new T.Group();
      nido.position.y = FONDO;
      const tela = kit.tela('#fff6f2');
      for (let i = 0; i < 26; i++) {
        const a = rnd() * Math.PI * 2, r = rnd() * 2.8;
        const al = kit.caja(0.9 + rnd() * 0.4, 0.3, 0.6, tela, { r: 0.14, seg: 4 });
        al.position.set(Math.cos(a) * r, 0.2 + rnd() * 0.5, Math.sin(a) * r);
        al.rotation.set(rnd() - 0.5, rnd() * 6, rnd() - 0.5);
        nido.add(al);
      }
      const luzFondo = new T.PointLight('#ffd6a6', 40, 30, 1.6);
      luzFondo.position.y = 2.5;
      nido.add(luzFondo);
      const resplandor = new T.Mesh(new T.CircleGeometry(3.2, 48), kit.luz('#ffe7c4', 1.6));
      resplandor.rotation.x = -Math.PI / 2;
      resplandor.position.y = 0.05;
      nido.add(resplandor);
      scene.add(nido);

      /* ---------- cosas que caen contigo ---------- */
      const cosas = [];
      const plumaGeo = new T.PlaneGeometry(0.16, 0.6, 1, 6);
      { const p = plumaGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.pow(p.getY(i), 2) * 0.5); plumaGeo.computeVertexNormals(); }
      const plumaMat = kit.tela('#ffffff', { side: T.DoubleSide, transmission: 0.3 });
      const colores = ['#a991da', '#f2a7bd', '#9cc6ec', '#f6cf86'];
      for (let i = 0; i < 70; i++) {
        const y = -6 - rnd() * (-FONDO - 14);
        const tipo = rnd();
        let obj;
        if (tipo < 0.36) {
          obj = kit.caja(0.85, 0.24, 0.58, tela, { r: 0.11, seg: 4 });
        } else if (tipo < 0.56) {
          const r = kit.reloj(0.28, { color: colores[(rnd() * 4) | 0] });
          r.fijar(rnd() * 12, rnd() * 60);
          obj = r.grupo;
        } else if (tipo < 0.68) {
          const p = kit.puerta({ color: colores[(rnd() * 4) | 0], w: 0.8, h: 1.6, abierta: rnd() * 0.6 });
          p.actualizar(1);
          obj = p.grupo;
        } else {
          obj = new T.Mesh(plumaGeo, plumaMat);
          obj.castShadow = true;
        }
        const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * 2.1;
        obj.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        obj.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
        scene.add(obj);
        cosas.push({ obj, y, eje: new T.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), v: 0.2 + rnd() * 0.6, fase: rnd() * 10 });
      }

      // corrientes de polvo que suben mientras caes
      const polvo = kit.motas(500, [0, 0, 0, ANCHO - 0.6, 30, ANCHO - 0.6], { color: '#fff3e6', tam: 34, opacidad: 0.7, deriva: 0.15 });
      scene.add(polvo);

      /* ---------- cámara: caída en espiral ---------- */
      let y = 6;
      const mira = new T.Vector3();
      const m = {
        scene, fov: 50,
        camara(t, cam) {
          const e = S.mix(t, S.suave(t), 0.35);
          y = S.mix(7, FONDO + 7, e);
          const a = t * 5.5;
          const r = 1.1 + Math.sin(t * 7) * 0.3;
          cam.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
          mira.set(Math.cos(a + 1.2) * 0.8, y - 9, Math.sin(a + 1.2) * 0.8);
          // al final miras hacia la luz de abajo
          cam.up.set(Math.cos(a * 0.5), 0.15, Math.sin(a * 0.5)).normalize();
          cam.lookAt(mira);
        },
        animar(t, dt, c) {
          const tt = c.tiempo;
          for (const k of cosas) {
            k.obj.rotateOnAxis(k.eje, dt * k.v);
            k.obj.position.y = k.y + Math.sin(tt * 0.6 + k.fase) * 0.4;
          }
          // la luz del sol baja contigo para que las sombras sigan nítidas
          sol.position.set(6, y + 12, 4);
          sol.target.position.set(0, y - 4, 0);
          acompana.position.set(0, y - 3, 0);
          polvo.position.y = y - 8;
          polvo.userData.u.uOff.value += (0.6 + Math.abs(c.vel) * 6) * dt;
          // abajo todo se vuelve más cálido
          const k = S.tramo(t, 0.6, 1);
          scene.fog.color.lerpColors(nieblaArriba, nieblaAbajo, k);
          m.exposicion = S.mix(1, 1.15, k);
        },
      };
      return m;
    },
  });
})();
