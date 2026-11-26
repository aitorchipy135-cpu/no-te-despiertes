/* ESCENA 4 · EL PASILLO INFINITO
   Una galería de arcos de colores pastel sobre agua quieta. El sol entra
   por las arcadas y dibuja franjas de luz. Al fondo, una puerta encendida
   que nunca se acerca (y si intentas tocarla, se escapa). */
(() => {
  'use strict';
  const S = window.SUENO;

  S.escena({
    n: 4, nombre: 'El pasillo infinito', tinta: '#2b2140', velo: '#fffaf0',

    construir(ctx) {
      const { T } = ctx, kit = S.kit;
      const scene = new T.Scene();
      const LARGO = 220, ANCHO = 4.6, ALTO = 6;

      const cielo = kit.cielo(scene, { arriba: '#a2bcf0', horizonte: '#fbdcd0', abajo: '#f2c4cf', sol: [0.8, 0.75, -0.2], solColor: '#fff2dc' });
      kit.entorno(scene, cielo);
      scene.fog = new T.Fog('#f7d9cf', 9, 62);
      kit.hemi(scene, '#fff5f0', '#d7b3c4', 0.75);
      const sol = kit.sol(scene, [14, 13, -4], '#ffe8cf', 3.4, 13, { lejos: 60 });

      /* ---------- agua ---------- */
      const agua = kit.agua(ANCHO + 0.2, LARGO, { color: '#c9d6e0', ondas: 0.014, reflejo: 0.92 });
      agua.position.set(0, 0, -LARGO / 2 + 8);
      scene.add(agua);

      /* ---------- muros ---------- */
      const yesoIzq = kit.yeso('#f3d6cd');
      const izq = kit.muro(LARGO, ALTO, 0.5, [], yesoIzq);
      izq.rotation.y = Math.PI / 2;
      izq.position.set(-ANCHO / 2 - 0.25, -0.4, -LARGO / 2 + 8);
      scene.add(izq);
      const huecos = [];
      for (let z = -LARGO / 2 + 3; z < LARGO / 2 - 3; z += 4) huecos.push({ x: z, y: 1.3, w: 2.2, h: 3.4, arco: true });
      const der = kit.muro(LARGO, ALTO, 0.5, huecos, kit.yeso('#f6dfd6'));
      der.rotation.y = -Math.PI / 2;
      der.position.set(ANCHO / 2 + 0.25, -0.4, -LARGO / 2 + 8);
      scene.add(der);

      /* ---------- arcos que cruzan el pasillo (instanciados) ---------- */
      const N = 40, PASO = 5.4;
      const arcoGeo = kit.porticoGeo(ANCHO + 1.2, ALTO + 0.8, ANCHO - 0.2, ALTO - 1.4, 0.55);
      const arcos = new T.InstancedMesh(arcoGeo, kit.yeso('#ffffff'), N);
      arcos.castShadow = arcos.receiveShadow = true;
      const pastel = ['#f7c3cf', '#fad7bf', '#fcecc4', '#d2ead8', '#c9dcf4', '#ddcbf3'].map(c => new T.Color(c));
      const mtx = new T.Matrix4();
      for (let i = 0; i < N; i++) {
        mtx.makeTranslation(0, -0.4, 2 - i * PASO);
        arcos.setMatrixAt(i, mtx);
        arcos.setColorAt(i, pastel[i % pastel.length]);
      }
      scene.add(arcos);

      /* ---------- apliques de luz en la pared ---------- */
      const NL = 28;
      const apliques = new T.InstancedMesh(new T.SphereGeometry(0.13, 20, 12), kit.luz('#ffe3b0', 4), NL);
      const brazos = new T.InstancedMesh(new T.CylinderGeometry(0.02, 0.02, 0.35, 8), kit.metal('#e8cc8e'), NL);
      for (let i = 0; i < NL; i++) {
        const z = -0.7 - i * PASO * 1.5;
        mtx.makeTranslation(-ANCHO / 2 + 0.26, 2.7, z);
        apliques.setMatrixAt(i, mtx);
        mtx.makeRotationZ(Math.PI / 2).setPosition(-ANCHO / 2 + 0.1, 2.62, z);
        brazos.setMatrixAt(i, mtx);
      }
      scene.add(apliques, brazos);
      const luces = [0, 1, 2].map(() => { const l = new T.PointLight('#ffcf94', 5, 9, 2); scene.add(l); return l; });

      /* ---------- la puerta del fondo ---------- */
      const fondo = new T.Group();
      const muroFondo = new T.Mesh(kit.porticoGeo(ANCHO + 0.4, ALTO, 1.3, 2.35, 0.4), kit.yeso('#f8e6dd'));
      muroFondo.castShadow = muroFondo.receiveShadow = true;
      muroFondo.position.y = -0.4;
      fondo.add(muroFondo);
      const puerta = kit.puerta({ color: '#a991da', w: 1.05, h: 2.0, luz: '#fff2d2', fuerza: 5 });
      puerta.grupo.position.y = -0.05;
      fondo.add(puerta.grupo);
      const luzFondo = new T.PointLight('#fff0cc', 14, 14, 1.5);
      luzFondo.position.set(0, 1.4, 0.8);
      fondo.add(luzFondo);
      scene.add(fondo);
      let huida = 0, huidaObj = 0, apertura = 0.35;
      ctx.interactivo(fondo, {
        etiqueta: 'tócala',
        hover(on) { huidaObj = on ? 28 : 0; },
        click() { huidaObj = 60; setTimeout(() => { huidaObj = 0; }, 1800); },
      });

      /* ---------- una pompa de cristal flotando sobre el agua ---------- */
      const pompa = new T.Mesh(new T.SphereGeometry(0.7, 64, 48), kit.vidrio({ thickness: 0.8 }));
      pompa.castShadow = true;
      pompa.position.set(0.95, 0.95, -34);
      scene.add(pompa);

      const motas = kit.motas(220, [0, 2.6, 0, ANCHO, 5, 30], { color: '#fff4dc', tam: 22, opacidad: 0.6, sube: 0.04 });
      scene.add(motas);

      /* ---------- cámara: caminar hacia delante ---------- */
      const mira = new T.Vector3();
      let camZ = 3;
      const m = {
        scene, fov: 42,
        camara(t, cam) {
          const e = S.mix(t, S.suave(t), 0.25);
          camZ = S.mix(3, -92, e);
          const x = Math.sin(camZ * 0.12) * 0.45;
          cam.position.set(x, 1.6 + Math.sin(camZ * 2.3) * 0.025, camZ);
          const abajo = S.campana(t, 0.66, 0.92, 0.08) * 1.9;
          const arriba = S.suave(S.tramo(t, 0.9, 1)) * 16;
          mira.set(x * 0.4, 1.5 - abajo + arriba, camZ - 10 + S.tramo(t, 0.9, 1) * 7);
          cam.lookAt(mira);
        },
        animar(t, dt, c) {
          const tt = c.tiempo;
          huida = S.amort(huida, huidaObj, huidaObj > huida ? 2.5 : 0.8, dt);
          fondo.position.set(0, 0, camZ - 36 - huida);
          apertura = S.amort(apertura, huidaObj ? 0.05 : 0.35 + Math.sin(tt * 0.7) * 0.1, 3, dt);
          puerta.abrir(apertura);
          puerta.actualizar(dt);
          // las luces siguen a los apliques más cercanos por delante
          const i0 = Math.max(0, Math.floor((-camZ - 0.7) / (PASO * 1.5)));
          luces.forEach((l, k) => l.position.set(-ANCHO / 2 + 0.5, 2.6, -0.7 - (i0 + k) * PASO * 1.5));
          sol.position.set(14, 13, camZ - 4);
          sol.target.position.set(0, 0, camZ - 12);
          motas.position.z = camZ - 12;
          pompa.position.y = 0.95 + Math.sin(tt * 0.8) * 0.12;
          pompa.rotation.y = tt * 0.2;
        },
      };
      return m;
    },
  });
})();
