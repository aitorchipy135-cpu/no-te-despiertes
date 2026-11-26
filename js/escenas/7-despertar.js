/* ESCENA 7 · EL DESPERTAR
   Un dormitorio de verdad, por la mañana. El sol entra por la ventana y
   dibuja su sombra en el suelo; el polvo flota en el rayo de luz. Suena el
   despertador. En la mesa, una bola de nieve con la isla del sueño dentro.
   Y al final, por la ventana… la luna te está mirando. */
(() => {
  'use strict';
  const S = window.SUENO;

  S.escena({
    n: 7, nombre: 'El despertar', tinta: '#2b2140', velo: '#fff8ec',

    construir(ctx) {
      const { T } = ctx, kit = S.kit;
      const scene = new T.Scene();
      const rnd = S.azar(707);
      const SOL = new T.Vector3(-4.2, 8, -16);

      const cielo = kit.cielo(scene, { arriba: '#8dbdf0', horizonte: '#ffe3c6', abajo: '#f7d2b8', sol: SOL.toArray(), solColor: '#fff3dc', solFuerza: 1.2 });
      kit.entorno(scene, cielo);
      scene.environmentIntensity = 1.0;
      scene.fog = new T.Fog('#f8e2cf', 30, 90);
      kit.hemi(scene, '#fff3ea', '#e2b9a4', 1.15);
      const sol = kit.sol(scene, SOL.toArray(), '#ffe2bf', 6.5, 7, { lejos: 40, mira: [0.6, 0, 0.8], radio: 3 });
      // la luz que rebota en el suelo soleado ilumina la habitación
      const rebote = new T.PointLight('#ffd9b4', 14, 9, 1.4);
      rebote.position.set(0.8, 0.5, 0.4);
      scene.add(rebote);
      const relleno = new T.PointLight('#fff0e4', 6, 10, 1.4);
      relleno.position.set(0, 3.0, 2.5);
      scene.add(relleno);

      /* ---------- la habitación ---------- */
      const tablas = kit.textura(1024, 1024, (c, w) => {
        const filas = 8, h = w / filas;
        for (let i = 0; i < filas; i++) {
          const off = (i % 2) * w * 0.37;
          for (let k = -1; k < 3; k++) {
            const x = off + k * w * 0.5;
            const tono = 200 + rnd() * 25;
            c.fillStyle = `rgb(${tono + 22},${tono - 18},${tono - 50})`;
            c.fillRect(x, i * h, w * 0.5, h);
            c.strokeStyle = 'rgba(120,70,40,.18)';
            for (let v = 0; v < 9; v++) {
              c.lineWidth = 1 + rnd() * 2;
              c.beginPath();
              const y = i * h + rnd() * h;
              c.moveTo(x, y);
              c.bezierCurveTo(x + w * 0.15, y + (rnd() - 0.5) * 12, x + w * 0.3, y + (rnd() - 0.5) * 12, x + w * 0.5, y + (rnd() - 0.5) * 6);
              c.stroke();
            }
            c.fillStyle = 'rgba(80,45,25,.45)';
            c.fillRect(x, i * h, 2, h);
          }
          c.fillStyle = 'rgba(80,45,25,.5)';
          c.fillRect(0, i * h, w, 2);
        }
      }, { repetir: [1, 1] });
      const suelo = kit.caja(8, 0.1, 8, new T.MeshPhysicalMaterial({ map: tablas, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3 }), { r: 0.01, uv: 0.22 });
      suelo.position.y = -0.05;
      scene.add(suelo);
      const pared = kit.yeso('#f5e3da');
      const fondo = kit.muro(8.4, 3.6, 0.3, [{ x: -0.2, y: 0.95, w: 2.4, h: 2.05 }], pared);
      fondo.position.set(0, 0, -4.15);
      scene.add(fondo);
      const derecha = kit.muro(8.4, 3.6, 0.3, [], kit.yeso('#f1dcd3'));
      derecha.rotation.y = -Math.PI / 2;
      derecha.position.set(4.15, 0, 0);
      scene.add(derecha);
      const izquierda = kit.muro(8.4, 3.6, 0.3, [], kit.yeso('#f2ddd4'));
      izquierda.rotation.y = Math.PI / 2;
      izquierda.position.set(-4.15, 0, 0);
      scene.add(izquierda);
      const techo = kit.caja(8.6, 0.2, 8.6, kit.yeso('#fbefe9'), { r: 0.01 });
      techo.position.y = 3.6;
      scene.add(techo);
      const rodapie = kit.pintura('#fbf6f2');
      for (const [x, z, w, d] of [[0, -3.98, 8, 0.04], [3.98, 0, 0.04, 8], [-3.98, 0, 0.04, 8]]) scene.add(kit.en(kit.caja(w, 0.12, d, rodapie, { r: 0.01 }), x, 0.06, z));

      // la ventana
      const marcoMat = kit.pintura('#fbf6f2');
      const ventana = new T.Group();
      ventana.position.set(-0.2, 0.95, -4.15);
      for (const [x, y, w, h] of [[0, 0, 2.5, 0.09], [0, 2.05, 2.5, 0.09], [-1.2, 1.02, 0.09, 2.1], [1.2, 1.02, 0.09, 2.1], [0, 1.02, 0.06, 2.0], [0, 1.25, 2.4, 0.05]]) {
        ventana.add(kit.en(kit.caja(w, h, 0.12, marcoMat, { r: 0.01 }), x, y, 0.05));
      }
      const alfeizar = kit.caja(2.8, 0.07, 0.4, marcoMat, { r: 0.02 });
      alfeizar.position.set(0, -0.02, 0.2);
      ventana.add(alfeizar);
      scene.add(ventana);
      // cortinas finas
      const cortinaMat = new T.MeshPhysicalMaterial({ color: '#ffe4ea', roughness: 0.9, side: T.DoubleSide, transparent: true, opacity: 0.6, sheen: 1, sheenColor: new T.Color('#fff') });
      const cortinas = [-1, 1].map(s => {
        const g = new T.PlaneGeometry(0.9, 2.9, 30, 1);
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 18) * 0.06);
        g.computeVertexNormals();
        g.translate(0, -1.45, 0);
        const c = new T.Mesh(g, cortinaMat);
        c.position.set(-0.2 + s * 1.55, 3.35, -3.92);
        scene.add(c);
        return c;
      });
      const barra = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 4.2, 12), kit.metal());
      barra.rotation.z = Math.PI / 2;
      barra.position.set(-0.2, 3.37, -3.9);
      scene.add(barra);

      /* ---------- muebles ---------- */
      const cama = kit.cama({ manta: '#f3b9c8' });
      cama.position.set(2.4, 0, -1.8);
      scene.add(cama);
      const madera = kit.madera('#d1ab90');
      const mesilla = new T.Group();
      mesilla.add(kit.en(kit.caja(0.55, 0.55, 0.45, madera, { r: 0.03 }), 0, 0.275, 0));
      mesilla.position.set(1.05, 0, -3.4);
      scene.add(mesilla);
      const lampara = kit.lampara();
      lampara.grupo.position.set(1.18, 0.55, -3.5);
      lampara.set(0, 0);
      scene.add(lampara.grupo);
      const despertador = kit.reloj(0.12, { color: '#ff8fa8' });
      despertador.fijar(7, 0);
      despertador.grupo.position.set(0.95, 0.68, -3.3);
      despertador.grupo.rotation.y = 0.4;
      scene.add(despertador.grupo);
      let sonando = true, silencio = 0;
      ctx.interactivo(despertador.grupo, {
        etiqueta: () => (sonando ? 'pospón la alarma' : '5 minutos más'),
        click() { sonando = false; silencio = 8; },
      });

      const mesa = new T.Group();
      mesa.add(kit.en(kit.caja(1.7, 0.06, 0.75, madera, { r: 0.02 }), 0, 0.78, 0));
      for (const [x, z] of [[0.78, 0.3], [-0.78, 0.3], [0.78, -0.3], [-0.78, -0.3]]) mesa.add(kit.en(kit.caja(0.06, 0.76, 0.06, madera, { r: 0.01 }), x, 0.38, z));
      mesa.position.set(-2.6, 0, -3.4);
      scene.add(mesa);
      const silla = new T.Group();
      silla.add(kit.en(kit.caja(0.5, 0.06, 0.5, madera, { r: 0.02 }), 0, 0.46, 0));
      silla.add(kit.en(kit.caja(0.5, 0.5, 0.05, madera, { r: 0.02 }), 0, 0.72, 0.23));
      for (const [x, z] of [[0.22, 0.22], [-0.22, 0.22], [0.22, -0.22], [-0.22, -0.22]]) silla.add(kit.en(kit.caja(0.04, 0.45, 0.04, madera, { r: 0.01 }), x, 0.22, z));
      silla.position.set(-2.4, 0, -2.4);
      silla.rotation.y = 0.3;
      scene.add(silla);
      const libros = ['#9cc6ec', '#f2a7bd', '#f6cf86'];
      libros.forEach((c, i) => scene.add(kit.en(kit.caja(0.22, 0.05, 0.3, kit.pintura(c), { r: 0.01 }), -3.15, 0.835 + i * 0.05, -3.35, i * 0.2)));
      const alfombra = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 0.02, 56), kit.tela('#c9dcf0'));
      alfombra.position.set(0.3, 0.01, 0.4);
      alfombra.receiveShadow = true;
      scene.add(alfombra);
      const puerta = kit.puerta({ color: '#f1e4f6' });
      puerta.grupo.position.set(3.97, 0, 1.4);
      puerta.grupo.rotation.y = -Math.PI / 2;
      puerta.grupo.children.forEach(o => { if (o.material && o.material.isMeshBasicMaterial) o.visible = false; });
      scene.add(puerta.grupo);
      // cuadro con la luna en la pared izquierda
      const cuadroTx = kit.textura(256, 320, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#2c2a5e'); g.addColorStop(1, '#e9a7bf');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = '#fff1bd'; c.beginPath(); c.arc(w / 2, h * 0.35, 40, 0, Math.PI * 2); c.fill();
      });
      const cuadro = new T.Group();
      cuadro.add(kit.caja(0.9, 1.1, 0.05, kit.metal('#dcc08a', { roughness: 0.35 }), { r: 0.01 }));
      cuadro.add(kit.en(new T.Mesh(new T.PlaneGeometry(0.78, 0.98), new T.MeshStandardMaterial({ map: cuadroTx, roughness: 0.8 })), 0, 0, 0.03));
      cuadro.position.set(-3.97, 1.8, -0.4);
      cuadro.rotation.y = Math.PI / 2;
      scene.add(cuadro);

      /* ---------- la bola de nieve ---------- */
      const bola = new T.Group();
      bola.position.set(-2.55, 0.81, -3.25);
      const peana = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.12, 40), kit.madera('#8e5f4a'));
      peana.position.y = 0.06;
      bola.add(peana);
      const cristal = new T.Mesh(new T.SphereGeometry(0.29, 64, 48), kit.vidrio({ thickness: 0.15, iridescence: 0.4, roughness: 0.01 }));
      cristal.position.y = 0.38;
      bola.add(cristal);
      const mini = kit.isla(10, 8, kit.yeso('#efcfc7'), { matTop: kit.yeso('#f6e2da') });
      mini.scale.setScalar(0.022);
      mini.position.y = 0.36;
      const miniCama = kit.cama();
      miniCama.scale.setScalar(0.85);
      mini.add(miniCama);
      bola.add(mini);
      const miniLuna = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), kit.luz('#fff0c8', 2));
      miniLuna.position.set(-0.1, 0.52, -0.08);
      bola.add(miniLuna);
      const nieve = kit.motas(90, [0, 0.4, 0, 0.36, 0.34, 0.36], { color: '#ffffff', tam: 5, opacidad: 0.95, sube: -0.06, deriva: 0.04, aditivo: false });
      bola.add(nieve);
      scene.add(bola);
      kit.sombra(bola);

      /* ---------- el rayo de sol con polvo ---------- */
      const dirSol = SOL.clone().negate().normalize();
      const centroVentana = new T.Vector3(-0.2, 2.0, -4.0);
      const largo = 6.5;
      const rayo = new T.Mesh(new T.BoxGeometry(2.3, 1.95, largo), new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
        uniforms: { uL: { value: largo } },
        vertexShader: /* glsl */`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform float uL; varying vec3 vP;
          void main(){
            float k = clamp((vP.z + uL * .5) / uL, 0., 1.);
            float a = .05 * (1. - k * .7) * smoothstep(0., .25, k + .02);
            gl_FragColor = vec4(vec3(1., .9, .75) * a, a);
          }`,
      }));
      rayo.position.copy(centroVentana).addScaledVector(dirSol, largo / 2);
      rayo.lookAt(centroVentana.clone().addScaledVector(dirSol, largo));
      scene.add(rayo);
      const polvo = kit.motas(260, [0, 0, 0, 2.2, 6, 1.8], { color: '#fff1d8', tam: 14, opacidad: 0.9, sube: 0.03, deriva: 0.08 });
      polvo.position.copy(rayo.position);
      polvo.quaternion.copy(rayo.quaternion);
      polvo.rotateX(Math.PI / 2);
      scene.add(polvo);

      /* ---------- fuera: nubes y la luna ---------- */
      for (let i = 0; i < 12; i++) {
        const n = kit.nube({ tam: 3 + rnd() * 4, semilla: 720 + i, sombra: '#f1d9d6' });
        n.position.set(-25 + rnd() * 45, 2 + rnd() * 14, -30 - rnd() * 25);
        scene.add(n);
      }
      const luna = kit.luna(3.2, { brillo: 0.55 });
      luna.position.set(-7, 10, -42);
      scene.add(luna);
      let caraLuna = 'dormida';

      /* ---------- cámara ---------- */
      const ruta = kit.ruta([
        [0.00, [2.4, 1.02, -2.35], [2.1, 3.4, -0.9]],
        [0.14, [2.3, 1.55, -1.6], [-0.4, 1.5, -4]],
        [0.32, [0.6, 1.55, 1.2], [1.0, 0.75, -3.3]],
        [0.55, [-1.3, 1.35, -1.5], [-2.55, 1.15, -3.25]],
        [0.74, [-2.42, 1.22, -2.62], [-2.55, 1.15, -3.25]],
        [0.88, [-0.3, 1.7, -1.6], [-7, 10, -42]],
        [1.00, [-0.3, 2.0, -3.25], [-7, 10, -42]],
      ]);
      return {
        scene, fov: 46, exposicion: 1.12,
        camara: (t, cam) => ruta(t, cam),
        animar(t, dt, c) {
          const tt = c.tiempo;
          silencio = Math.max(0, silencio - dt);
          if (!silencio) sonando = true;
          const vib = sonando ? 1 : 0;
          despertador.grupo.rotation.z = Math.sin(tt * 48) * 0.09 * vib;
          despertador.grupo.position.x = 0.95 + Math.sin(tt * 61) * 0.006 * vib;
          cortinas.forEach((cc, i) => { cc.rotation.x = Math.sin(tt * 0.9 + i) * 0.05; cc.rotation.z = Math.sin(tt * 0.6 + i * 2) * 0.02; });
          mini.rotation.y = tt * 0.15;
          luna.lookAt(c.camera.position);
          const quiere = t > 0.92 ? 'sonrie' : 'dormida';
          if (quiere !== caraLuna) { caraLuna = quiere; luna.userData.poner(quiere); }
        },
      };
    },
  });
})();
