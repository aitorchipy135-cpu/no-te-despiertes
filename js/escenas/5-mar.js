/* ESCENA 5 · EL MAR DE ARRIBA
   El mar es el techo: un plano de agua que refleja el suelo de arena. La
   luz atraviesa el agua y dibuja cáusticas en el suelo; los peces nadan
   por el aire, las medusas brillan y un barco flota boca abajo. La
   caracola baja la marea. */
(() => {
  'use strict';
  const S = window.SUENO;

  S.escena({
    n: 5, nombre: 'El mar de arriba', tinta: '#17324f', velo: '#e9f6ff', tintaVelo: '#17324f',

    construir(ctx) {
      const { T } = ctx, kit = S.kit;
      const scene = new T.Scene();
      const rnd = S.azar(505);
      let H = 7;

      const cielo = kit.cielo(scene, { arriba: '#6fb5e8', horizonte: '#bfe3f4', abajo: '#f6dcc4', sol: [0.2, 1, 0.3], solColor: '#ffffff', solFuerza: 0.4 });
      kit.entorno(scene, cielo);
      scene.fog = new T.Fog('#a9d3ee', 10, 50);
      kit.hemi(scene, '#c4e8ff', '#f2d8bd', 1.0);
      kit.sol(scene, [3, 20, 6], '#eaf7ff', 2.6, 14, { lejos: 40 });

      /* ---------- suelo de arena con cáusticas ---------- */
      const tiempoU = { value: 0 };
      const arena = kit.yeso('#f2dcc2', { roughness: 1 });
      arena.onBeforeCompile = sh => {
        sh.uniforms.uTime = tiempoU;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vMundo;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>
            varying vec3 vMundo;
            uniform float uTime;
            float causticas(vec2 p, float t){
              vec2 q = p;
              float c = 0.;
              for (int i = 0; i < 4; i++) {
                float fi = float(i);
                q = vec2(q.x + sin(q.y * 1.3 + t * .8 + fi * 1.7) * .9, q.y + cos(q.x * 1.1 - t * .6 + fi) * .9);
                c += 1. / length(vec2(sin(q.x * 1.9), cos(q.y * 1.9)) * 6.);
              }
              return pow(c / 4., 2.2);
            }`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
            float cs = causticas(vMundo.xz * .45, uTime) * (1. - smoothstep(0., .6, vMundo.y));
            totalEmissiveRadiance += vec3(.6, .88, 1.) * clamp(cs * 2.2, 0., 2.5) * .7;`);
      };
      const suelo = new T.Mesh(new T.CylinderGeometry(32, 32, 0.4, 96), arena);
      kit.uvCubo(suelo.geometry, 0.3);
      suelo.position.y = -0.2;
      suelo.receiveShadow = true;
      scene.add(suelo);

      // arquitectura sumergida
      const yeso = kit.yeso('#f6e2d2');
      const escalera = kit.escalera(9, 2, 0.26, 0.5, yeso);
      escalera.position.set(-4.5, 0, -2.5);
      escalera.rotation.y = 0.5;
      scene.add(escalera);
      const arco = new T.Mesh(kit.porticoGeo(4, 5.2, 2.4, 3.9, 0.5), kit.yeso('#f7d2cf'));
      arco.castShadow = arco.receiveShadow = true;
      arco.position.set(5.5, 0, -6);
      arco.rotation.y = -0.4;
      scene.add(arco);
      for (const [x, z, h] of [[-1.5, -6, 1.4], [-7, 3, 0.8], [7.5, 2.5, 1.8], [0.5, -9, 2.4]]) {
        scene.add(kit.en(kit.caja(1.1, h, 1.1, yeso, { r: 0.05 }), x, h / 2, z));
      }

      /* ---------- el mar, en el techo ---------- */
      const mar = kit.agua(110, 110, { techo: true, color: '#4f9fd8', ondas: 0.035, reflejo: 0.72 });
      mar.position.y = H;
      scene.add(mar);

      // rayos de luz que bajan del agua
      const rayoMat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
        uniforms: { uTime: tiempoU },
        vertexShader: /* glsl */`
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime;
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){
            float borde = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
            float a = smoothstep(0., 1., vUv.y) * borde * (.16 + .05 * sin(uTime * 1.3 + vUv.x * 20.));
            gl_FragColor = vec4(vec3(.85, .95, 1.) * a, a);
          }`,
      });
      const rayos = [];
      for (let i = 0; i < 8; i++) {
        const r = new T.Mesh(new T.CylinderGeometry(0.35 + rnd() * 0.4, 1.6 + rnd() * 1.4, 1, 32, 1, true), rayoMat);
        r.position.set((rnd() - 0.5) * 18, 0, (rnd() - 0.5) * 16);
        r.rotation.z = (rnd() - 0.5) * 0.3;
        scene.add(r);
        rayos.push({ r, fase: rnd() * 6 });
      }

      /* ---------- el barco, visto desde abajo ---------- */
      const casco = new T.Shape();
      casco.moveTo(-0.75, 0); casco.quadraticCurveTo(-0.7, -0.55, 0, -0.62); casco.quadraticCurveTo(0.7, -0.55, 0.75, 0); casco.lineTo(-0.75, 0);
      const cascoGeo = new T.ExtrudeGeometry(casco, { depth: 2.8, bevelEnabled: false, curveSegments: 16, steps: 16 });
      cascoGeo.translate(0, 0, -1.4);
      { const p = cascoGeo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 - Math.pow(Math.abs(p.getZ(i)) / 1.4, 2) * 0.85; p.setX(i, p.getX(i) * k); } cascoGeo.computeVertexNormals(); }
      const barco = new T.Mesh(cascoGeo, kit.pintura('#f4f0ea', { roughness: 0.6 }));
      barco.castShadow = true;
      const franja = new T.Mesh(cascoGeo, kit.pintura('#e1726f'));
      franja.scale.set(1.01, 0.35, 1.01);
      franja.position.y = -0.4;
      barco.add(franja);
      scene.add(barco);

      /* ---------- algas que cuelgan del mar ---------- */
      const algaMat = new T.MeshStandardMaterial({ color: '#5fae8a', roughness: 0.7, side: T.DoubleSide, transparent: true, opacity: 0.85 });
      const algas = [];
      for (let i = 0; i < 14; i++) {
        const largo = 1.5 + rnd() * 2.5;
        const g = new T.PlaneGeometry(0.22, largo, 1, 10);
        g.translate(0, -largo / 2, 0);
        const p = g.attributes.position;
        for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) + Math.sin(p.getY(k) * 3) * 0.08);
        const a = new T.Mesh(g, algaMat);
        a.position.set((rnd() - 0.5) * 20, 0, (rnd() - 0.5) * 20);
        a.rotation.y = rnd() * 3;
        scene.add(a);
        algas.push({ a, fase: rnd() * 6 });
      }

      /* ---------- peces que nadan por el aire ---------- */
      const coloresPez = ['#ff8f7e', '#ffd26b', '#7cb9ff', '#f7a1c4', '#a6e3c8'];
      const cuerpoGeo = new T.SphereGeometry(1, 24, 16);
      const colaShape = new T.Shape();
      colaShape.moveTo(0, 0); colaShape.quadraticCurveTo(0.12, -0.2, 0.05, -0.32); colaShape.lineTo(0, -0.22); colaShape.lineTo(-0.05, -0.32); colaShape.quadraticCurveTo(-0.12, -0.2, 0, 0);
      const colaGeo = new T.ShapeGeometry(colaShape);
      colaGeo.rotateX(Math.PI / 2);
      colaGeo.rotateZ(Math.PI / 2);
      const ojoMat = new T.MeshStandardMaterial({ color: '#111', roughness: 0.1 });
      const peces = [];
      for (let i = 0; i < 26; i++) {
        const color = coloresPez[i % coloresPez.length];
        const mat = new T.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15, iridescence: 0.6, iridescenceIOR: 1.4, sheen: 0.4 });
        const pez = new T.Group();
        const cuerpo = new T.Mesh(cuerpoGeo, mat);
        cuerpo.scale.set(0.09, 0.15, 0.3);
        pez.add(cuerpo);
        const cola = new T.Group();
        cola.position.z = -0.26;
        const aleta = new T.Mesh(colaGeo, new T.MeshPhysicalMaterial({ color, roughness: 0.4, side: T.DoubleSide, transmission: 0.3 }));
        aleta.scale.setScalar(1.2);
        cola.add(aleta);
        pez.add(cola);
        for (const s of [-1, 1]) {
          const o = new T.Mesh(cuerpoGeo, ojoMat);
          o.scale.setScalar(0.022); o.position.set(s * 0.07, 0.04, 0.2);
          pez.add(o);
        }
        kit.sombra(pez, true, false);
        const esc = 0.8 + rnd() * 1.1;
        pez.scale.setScalar(esc);
        scene.add(pez);
        peces.push({
          pez, cola, c: new T.Vector3((rnd() - 0.5) * 6, 1.4 + rnd() * 4, (rnd() - 0.5) * 6),
          R: 2.5 + rnd() * 7, w: (0.12 + rnd() * 0.2) * (rnd() < 0.5 ? 1 : -1), fase: rnd() * 6.28, ola: rnd() * 6,
        });
      }

      /* ---------- medusas ---------- */
      const medusas = [];
      for (let i = 0; i < 6; i++) {
        const mat = new T.MeshPhysicalMaterial({ color: '#ffc2dc', roughness: 0.15, transmission: 0.7, thickness: 0.5, side: T.DoubleSide, emissive: new T.Color('#ff7fb8'), emissiveIntensity: 0.35, clearcoat: 1, transparent: true });
        const g = new T.Group();
        const campana = new T.Mesh(new T.SphereGeometry(0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
        campana.scale.y = 0.85;
        g.add(campana);
        const tentaculos = [];
        for (let k = 0; k < 9; k++) {
          const a = k / 9 * Math.PI * 2;
          const tg = new T.CylinderGeometry(0.012, 0.004, 1.3 + rnd() * 0.6, 4, 6);
          tg.translate(0, -0.7, 0);
          const tm = new T.Mesh(tg, mat);
          tm.position.set(Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26);
          g.add(tm);
          tentaculos.push(tm);
        }
        g.position.set((rnd() - 0.5) * 14, 2.5 + rnd() * 3, (rnd() - 0.5) * 12);
        scene.add(g);
        const md = { g, campana, mat, tentaculos, y: g.position.y, fase: rnd() * 6, brillo: 0 };
        medusas.push(md);
        ctx.interactivo(g, { etiqueta: 'brilla', hover(on) { md.brillo = on ? 1 : 0; } });
      }

      /* ---------- la caracola ---------- */
      const pedestal = kit.caja(0.9, 1.0, 0.9, yeso, { r: 0.05 });
      pedestal.position.set(2.2, 0.5, 1.2);
      scene.add(pedestal);
      const rayas = kit.textura(256, 128, (c, w, h) => {
        for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? '#ffb3c6' : '#ffd8e0'; c.fillRect(i * w / 14, 0, w / 14 + 1, h); }
      });
      const caracola = new T.Mesh(new T.SphereGeometry(0.34, 40, 20, 0, Math.PI, 0, Math.PI / 2), new T.MeshPhysicalMaterial({ map: rayas, roughness: 0.4, clearcoat: 0.8, sheen: 0.6, side: T.DoubleSide }));
      caracola.scale.set(1, 0.75, 1.15);
      caracola.rotation.y = -Math.PI / 2;
      caracola.position.set(2.2, 1.0, 1.2);
      caracola.castShadow = true;
      scene.add(caracola);
      let marea = 0, mareaObj = 0, latido = 0;
      ctx.interactivo(caracola, {
        etiqueta: () => (mareaObj ? 'sube la marea' : 'baja la marea'),
        hover(on) { latido = on ? 1 : 0; },
        click() { mareaObj = mareaObj ? 0 : 1; },
      });

      const burbujas = kit.motas(320, [0, 3.5, 0, 26, 7, 26], { color: '#ffffff', tam: 30, opacidad: 0.55, sube: 0.6, deriva: 0.2 });
      scene.add(burbujas);

      /* ---------- cámara: mirar arriba… y darse la vuelta ---------- */
      const ruta = kit.ruta([
        [0.00, [0, 1.4, 12], [0, 6.5, 0]],
        [0.25, [-6, 2.2, 7], [0, 4.6, -2]],
        [0.48, [5.4, 2.1, 5.4], [2.2, 1.2, 1.2]],
        [0.70, [3, 1.6, -4], [-2, 4.5, 2]],
        [1.00, [0, 2.4, 3], [0, 8, -1]],
      ]);
      const sig = new T.Vector3();
      return {
        scene, fov: 44,
        camara(t, cam) {
          ruta(t, cam);
          cam.rotateZ(S.suave(S.tramo(t, 0.7, 1)) * Math.PI);
        },
        animar(t, dt, c) {
          const tt = c.tiempo;
          tiempoU.value = tt;
          marea = S.amort(marea, mareaObj, 0.9, dt);
          H = S.mix(7, 4.6, marea);
          mar.position.y = H;
          barco.position.set(-2, H - 0.32 + Math.sin(tt * 0.8) * 0.05, -3);
          barco.rotation.set(Math.sin(tt * 0.7) * 0.05, 0.6, Math.sin(tt * 0.9) * 0.06);
          for (const r of rayos) {
            r.r.scale.y = H;
            r.r.position.y = H / 2;
            r.r.rotation.x = Math.sin(tt * 0.3 + r.fase) * 0.08;
          }
          for (const a of algas) {
            a.a.position.y = H;
            a.a.rotation.z = Math.sin(tt * 0.8 + a.fase) * 0.2;
            a.a.rotation.x = Math.cos(tt * 0.6 + a.fase) * 0.15;
          }
          for (const p of peces) {
            const th = tt * p.w + p.fase;
            const yTope = Math.min(p.c.y, H - 0.6);
            const pos = (u, out) => out.set(p.c.x + Math.cos(u) * p.R, yTope + Math.sin(u * 2 + p.ola) * 0.4, p.c.z + Math.sin(u) * p.R);
            pos(th, p.pez.position);
            pos(th + 0.05 * Math.sign(p.w), sig);
            p.pez.lookAt(sig);
            p.cola.rotation.y = Math.sin(tt * 9 + p.fase) * 0.45;
          }
          for (const md of medusas) {
            const pulso = Math.sin(tt * 1.6 + md.fase);
            md.g.position.y = Math.min(md.y + pulso * 0.25, H - 0.8);
            md.campana.scale.set(1 + pulso * 0.06, 0.85 - pulso * 0.08, 1 + pulso * 0.06);
            md.tentaculos.forEach((tm, k) => { tm.rotation.x = Math.sin(tt * 1.2 + k + md.fase) * 0.25; tm.rotation.z = Math.cos(tt + k) * 0.2; });
            md.cur = S.amort(md.cur || 0, md.brillo, 5, dt);
            md.mat.emissiveIntensity = 0.35 + md.cur * 2.4;
          }
          const s = 1 + Math.sin(tt * 4) * 0.04 * latido;
          caracola.scale.set(s, 0.75 * s, 1.15 * s);
        },
      };
    },
  });
})();
