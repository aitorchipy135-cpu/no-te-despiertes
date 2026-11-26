/* =====================================================================
   NO TE DESPIERTES — capa JavaScript
   · Lenis suaviza el scroll nativo. Las animaciones CSS que usan
     animation-timeline: scroll() leen ese scroll, así que toda la cámara
     del sueño se vuelve suave sin tocar el CSS.
   · Three.js pinta encima una capa WebGL transparente:
       - el "orbe del sueño": una burbuja iridiscente que respira, cambia
         de color y de sitio en cada escena y estalla al despertar
       - polvo de sueño que flota y sube cuando caes (cuanto más rápido
         haces scroll, más rápido va)
   · Es un script clásico que carga Three.js y Lenis desde la CDN con
     import(), así la página sigue funcionando al abrir index.html con
     doble clic (sin servidor).
   ===================================================================== */
(async () => {
  'use strict';

  const CDN = 'https://cdn.jsdelivr.net/npm/';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [lenisMod, threeMod] = await Promise.allSettled([
    import(CDN + 'lenis@1.3.28/dist/lenis.mjs'),
    import(CDN + 'three@0.187.0/build/three.module.js'),
  ]);

  /* ---------------------------------------------------------------
     1 · SCROLL SUAVE CON LENIS
     --------------------------------------------------------------- */
  let lenis = null;
  if (lenisMod.status === 'fulfilled' && !reduceMotion) {
    const Lenis = lenisMod.value.default;
    lenis = new Lenis({
      lerp: 0.075,            // cuanto más bajo, más "flotante"
      wheelMultiplier: 0.9,
      smoothWheel: true,
      anchors: { duration: 3.2 }, // "↺ volver a dormir" rebobina el sueño despacio
      autoRaf: false,         // lo movemos nosotros en el mismo bucle que Three.js
    });
  } else if (lenisMod.status === 'rejected') {
    console.warn('[sueño] Lenis no se pudo cargar; se usa el scroll normal.', lenisMod.reason);
  }

  // progreso 0..1 y velocidad, salgan de Lenis o del scroll nativo
  const root = document.documentElement;
  let lastY = window.scrollY;
  function leerScroll() {
    const max = Math.max(1, root.scrollHeight - root.clientHeight);
    if (lenis) {
      const p = Number.isFinite(lenis.progress) ? lenis.progress : lenis.scroll / max;
      return { p: Math.min(1, Math.max(0, p)), v: lenis.velocity || 0 };
    }
    const y = window.scrollY;
    const v = y - lastY;
    lastY = y;
    return { p: Math.min(1, Math.max(0, y / max)), v };
  }

  // los textos se inclinan un poco con la velocidad del scroll
  const caps = [...document.querySelectorAll('.cap:not(.final)')];
  let skewAplicado = 0;
  function inclinarTextos(vel) {
    const s = reduceMotion ? 0 : Math.round(vel * -2.2 * 100) / 100;
    if (Math.abs(s - skewAplicado) < 0.02) return;
    skewAplicado = s;
    const t = s === 0 ? '' : `skewY(${s}deg)`;
    for (const el of caps) el.style.transform = t;
  }

  /* ---------------------------------------------------------------
     2 · ESCENA WEBGL CON THREE.JS
     --------------------------------------------------------------- */
  let pintor = null;
  if (threeMod.status === 'fulfilled') {
    try {
      pintor = crearSueno(threeMod.value);
    } catch (err) {
      console.warn('[sueño] WebGL no está disponible; el sueño sigue solo con CSS.', err);
    }
  } else {
    console.warn('[sueño] Three.js no se pudo cargar.', threeMod.reason);
  }

  /* ---------------------------------------------------------------
     3 · BUCLE PRINCIPAL
     --------------------------------------------------------------- */
  let velSuave = 0;
  let prev = performance.now();
  function frame(time) {
    const dt = Math.min(0.05, (time - prev) / 1000);
    prev = time;
    if (lenis) lenis.raf(time);
    const { p, v } = leerScroll();
    const velN = Math.max(-2, Math.min(2, v / 40));
    velSuave += (velN - velSuave) * (1 - Math.exp(-dt * 6));
    inclinarTextos(velSuave);
    if (pintor) pintor(time / 1000, dt, p, velSuave);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.sueno = { lenis };

  /* =================================================================
     LA CAPA 3D
     ================================================================= */
  function crearSueno(THREE) {
    THREE.ColorManagement.enabled = false; // colores tal cual, en sRGB

    const canvas = document.getElementById('sueno');
    if (!canvas) throw new Error('falta <canvas id="sueno">');

    const renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0, 6);

    /* ---------- el guion: cómo es el orbe en cada escena ----------
       x, y: posición en pantalla (-1..1) · r: tamaño · amp/freq: cuánto
       se deforma · op: opacidad · cols: tres tonos del nácar ·
       dust: color del polvo · fall: cuánto sube el polvo solo · glitch */
    const BORDES = [0.1957, 0.3043, 0.4565, 0.5870, 0.7391, 0.8696];
    const ESCENAS = [
      { x: .56, y: .30, r: .78, amp: .11, freq: .85, speed: .32, op: .95, cols: ['#ffb3d6', '#b9a6ff', '#9ff0dc'], dust: '#ffffff', dustOp: .8, fall: .02, glitch: 0 }, // 1 · la cama flotante
      { x: .00, y: .02, r: .42, amp: .18, freq: 1.10, speed: .55, op: .90, cols: ['#ffd6a8', '#ff9ec4', '#9d8cff'], dust: '#fff4e0', dustOp: 1., fall: 1.6, glitch: 0 }, // 2 · la caída
      { x: -.58, y: .36, r: .62, amp: .10, freq: .85, speed: .28, op: .90, cols: ['#fff0c2', '#ffb0c8', '#a9c8ff'], dust: '#ffffff', dustOp: .7, fall: .03, glitch: 0 }, // 3 · la habitación sin paredes
      { x: .00, y: .56, r: .30, amp: .08, freq: .95, speed: .25, op: 1.0, cols: ['#ffe29a', '#ff9fbf', '#c3a6ff'], dust: '#fff7e6', dustOp: .7, fall: -.04, glitch: 0 }, // 4 · el pasillo infinito
      { x: .52, y: .42, r: .74, amp: .14, freq: .75, speed: .22, op: .85, cols: ['#8fe8ff', '#6fa8ff', '#fff1f7'], dust: '#e8fbff', dustOp: .9, fall: .25, glitch: 0 }, // 5 · el mar de arriba
      { x: -.52, y: .34, r: .82, amp: .28, freq: 1.35, speed: .75, op: .90, cols: ['#ff2a4a', '#5a0a3a', '#2af0ff'], dust: '#ff4d63', dustOp: 1., fall: -.08, glitch: 1 }, // 6 · se deshace
      { x: .46, y: .38, r: .56, amp: .09, freq: .80, speed: .26, op: .90, cols: ['#ffffff', '#cfe6ff', '#ffd9b8'], dust: '#ffffff', dustOp: .6, fall: .02, glitch: 0 }, // 7 · el despertar
    ];
    const NOCHE = ['#9d8cff', '#5b6bd8', '#ffe9b0']; // escena 1 con la luz apagada

    const NUM = ['x', 'y', 'r', 'amp', 'freq', 'speed', 'op', 'dustOp', 'fall', 'glitch'];
    for (const e of ESCENAS) {
      e.cols = e.cols.map(c => new THREE.Color(c));
      e.dust = new THREE.Color(e.dust);
    }
    const nocheCols = NOCHE.map(c => new THREE.Color(c));

    const suave = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    const objetivo = { cols: [new THREE.Color(), new THREE.Color(), new THREE.Color()], dust: new THREE.Color() };

    // mezcla el guion según el progreso; el cambio ocurre bajo el velo de cada escena
    function guion(p, noche) {
      const a = ESCENAS[0];
      for (const k of NUM) objetivo[k] = a[k];
      objetivo.cols.forEach((c, i) => c.copy(a.cols[i]));
      objetivo.dust.copy(a.dust);
      for (let i = 0; i < BORDES.length; i++) {
        const w = suave((p - (BORDES[i] - 0.012)) / 0.024);
        if (w <= 0) break;
        const b = ESCENAS[i + 1];
        for (const k of NUM) objetivo[k] += (b[k] - objetivo[k]) * w;
        objetivo.cols.forEach((c, j) => c.lerp(b.cols[j], w));
        objetivo.dust.lerp(b.dust, w);
      }
      if (noche > 0) objetivo.cols.forEach((c, j) => c.lerp(nocheCols[j], noche));
      return objetivo;
    }

    /* ---------- ruido simplex 3D (Ashima Arts / Stefan Gustavson, MIT) ---------- */
    const SIMPLEX = /* glsl */`
      vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x){ return mod289(((x * 34.0) + 10.0) * x); }
      vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v){
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }`;

    /* ---------- el orbe: una esfera que el ruido deforma ---------- */
    const orbUniforms = {
      uTime: { value: 0 },
      uAmp: { value: .2 },
      uFreq: { value: 1 },
      uSpeed: { value: .3 },
      uOpacity: { value: 0 },
      uC1: { value: new THREE.Color() },
      uC2: { value: new THREE.Color() },
      uC3: { value: new THREE.Color() },
    };
    const orbMat = new THREE.ShaderMaterial({
      uniforms: orbUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide, // Three.js pinta primero la cara de dentro y luego la de fuera: efecto pompa
      premultipliedAlpha: true,
      vertexShader: /* glsl */`
        uniform float uTime, uAmp, uFreq, uSpeed;
        varying vec3 vN;
        varying vec3 vView;
        varying float vNoise;
        ${SIMPLEX}
        float disp(vec3 p){
          float t = uTime * uSpeed;
          return snoise(p * uFreq + vec3(t, t * .6, -t * .4)) * uAmp
               + snoise(p * uFreq * 2.2 - t * .8) * uAmp * .18;
        }
        void main(){
          vec3 n = normalize(position);
          vec3 tg = normalize(cross(n, abs(n.y) < .99 ? vec3(0., 1., 0.) : vec3(1., 0., 0.)));
          vec3 bt = normalize(cross(n, tg));
          float e = .015;
          vec3 p1 = normalize(n + tg * e);
          vec3 p2 = normalize(n + bt * e);
          float d0 = disp(n);
          vec3 q0 = n  * (1. + d0);
          vec3 q1 = p1 * (1. + disp(p1));
          vec3 q2 = p2 * (1. + disp(p2));
          vec3 nn = normalize(cross(q1 - q0, q2 - q0));
          if (dot(nn, n) < 0.) nn = -nn;
          vNoise = d0;
          vec4 mv = modelViewMatrix * vec4(q0, 1.);
          vN = normalize(normalMatrix * nn);
          vView = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uOpacity;
        uniform vec3 uC1, uC2, uC3;
        varying vec3 vN;
        varying vec3 vView;
        varying float vNoise;
        vec3 nacar(float t){
          t = fract(t) * 3.;
          if (t < 1.) return mix(uC1, uC2, t);
          if (t < 2.) return mix(uC2, uC3, t - 1.);
          return mix(uC3, uC1, t - 2.);
        }
        void main(){
          vec3 N = normalize(vN) * (gl_FrontFacing ? 1. : -1.);
          vec3 V = normalize(vView);
          float ndv = clamp(dot(N, V), 0., 1.);
          float fres = pow(1. - ndv, 2.2);
          vec3 irid = nacar(ndv * 1.2 + vNoise * 1.6 + uTime * .04);
          vec3 L1 = normalize(vec3(-.5, .8, .6));
          vec3 L2 = normalize(vec3(.7, -.5, .5));
          float spec  = pow(max(dot(N, normalize(L1 + V)), 0.), 70.);
          float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.), 16.) * .3;
          vec3 col = irid * (.55 + .65 * fres) + vec3(spec) * 1.1 + irid * spec2;
          float a = clamp(.10 + fres * .95 + spec * .9, 0., 1.);
          a *= gl_FrontFacing ? 1. : .45;
          a *= uOpacity;
          gl_FragColor = vec4(col * a, a);
        }`,
    });
    const orbe = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), orbMat);
    scene.add(orbe);

    /* ---------- el polvo de sueño ---------- */
    const pequeno = Math.min(innerWidth, innerHeight) < 700;
    const N = pequeno ? 450 : 900;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 6.5;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 5;
      pos[i * 3 + 2] = Math.random() * -9 + 3.5;
      seed[i] = Math.random();
    }
    const polvoGeo = new THREE.BufferGeometry();
    polvoGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    polvoGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const polvoUniforms = {
      uTime: { value: 0 },
      uOff: { value: 0 },
      uVel: { value: 0 },
      uSize: { value: 30 },
      uPix: { value: 1 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color('#ffffff') },
    };
    const polvo = new THREE.Points(polvoGeo, new THREE.ShaderMaterial({
      uniforms: polvoUniforms,
      transparent: true,
      depthWrite: false,
      premultipliedAlpha: true,
      vertexShader: /* glsl */`
        attribute float aSeed;
        uniform float uTime, uOff, uVel, uSize, uPix;
        varying float vA;
        void main(){
          vec3 p = position;
          float sp = .35 + aSeed * .9;
          p.y = mod(p.y + uOff * sp + uTime * .04 * sp + 5., 10.) - 5.;
          p.x += sin(uTime * .25 + aSeed * 40.) * .25;
          p.z += cos(uTime * .20 + aSeed * 25.) * .2;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_PointSize = uSize * uPix * (.4 + aSeed) * (1. + abs(uVel) * .5) / -mv.z;
          vA = (.35 + .65 * fract(aSeed * 13.7)) * (.6 + .4 * sin(uTime * (1. + aSeed * 2.) + aSeed * 30.));
          vA *= smoothstep(-13., -8., mv.z) * (1. - smoothstep(-2.6, -1.2, mv.z));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - .5);
          float a = 1. - smoothstep(0., .5, d);
          a = a * a * vA * uOpacity;
          gl_FragColor = vec4(uColor * a, a * .6);
        }`,
    }));
    scene.add(polvo);

    /* ---------- tamaño ---------- */
    let vis = { w: 1, h: 1 }; // tamaño visible en z = 0, en unidades del mundo
    function medir() {
      const w = innerWidth, h = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const hh = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      vis = { w: hh * camera.aspect, h: hh };
      polvoUniforms.uPix.value = dpr;
    }
    medir();
    addEventListener('resize', medir);

    /* ---------- ratón ---------- */
    const raton = { x: 0, y: 0, sx: 0, sy: 0 };
    addEventListener('pointermove', e => {
      raton.x = (e.clientX / innerWidth) * 2 - 1;
      raton.y = -((e.clientY / innerHeight) * 2 - 1);
    }, { passive: true });

    /* ---------- estado que se va acercando al guion poco a poco ---------- */
    const est = {
      x: ESCENAS[0].x, y: ESCENAS[0].y, r: ESCENAS[0].r, amp: ESCENAS[0].amp, freq: ESCENAS[0].freq, speed: ESCENAS[0].speed,
      op: 0, dustOp: 0, fall: 0, glitch: 0,
      cols: ESCENAS[0].cols.map(c => c.clone()), dust: ESCENAS[0].dust.clone(),
    };
    const nocheInput = document.getElementById('noche');
    let noche = 0, offset = 0, pulso = 0, escenaPrev = 0, jx = 0, jy = 0, rotX = 0, rotY = 0;

    canvas.classList.add('on');

    return function pintar(t, dt, p, vel) {
      // ¿estamos en la escena 1 con la luz apagada?
      const nocheObj = nocheInput && nocheInput.checked && p < BORDES[0] ? 1 : 0;
      noche += (nocheObj - noche) * (1 - Math.exp(-dt * 2.5));

      const g = guion(p, noche);
      const k = 1 - Math.exp(-dt * 3.2);
      for (const key of NUM) est[key] += (g[key] - est[key]) * k;
      est.cols.forEach((c, i) => c.lerp(g.cols[i], k));
      est.dust.lerp(g.dust, k);

      // al cruzar a otra escena, el orbe "tiembla"
      let escena = 0;
      while (escena < BORDES.length && p >= BORDES[escena]) escena++;
      if (escena !== escenaPrev) { pulso = 1; escenaPrev = escena; }
      pulso *= Math.exp(-dt * 1.8);

      // pesadilla: saltos bruscos de imagen
      if (!reduceMotion && est.glitch > .05 && Math.random() < .07) {
        jx = (Math.random() - .5) * .12 * est.glitch;
        jy = (Math.random() - .5) * .08 * est.glitch;
      } else {
        jx *= .8; jy *= .8;
      }

      // al despertar, la burbuja estalla
      const pop = suave((p - .975) / .014);

      raton.sx += (raton.x - raton.sx) * (1 - Math.exp(-dt * 2.5));
      raton.sy += (raton.y - raton.sy) * (1 - Math.exp(-dt * 2.5));

      const ritmo = reduceMotion ? .3 : 1;
      const tamano = est.r * .28 * vis.h * Math.min(1, camera.aspect * 1.15);
      const bob = Math.sin(t * .6) * .035 * vis.h * ritmo;
      orbe.position.set(
        (est.x + jx) * vis.w / 2 + raton.sx * .18,
        (est.y + jy) * vis.h / 2 + bob + raton.sy * .12,
        0
      );
      const estira = 1 + Math.max(-.12, Math.min(.12, vel * .06));
      const s = tamano * (1 + pop * .9) * (1 + pulso * .08);
      orbe.scale.set(s / Math.sqrt(estira), s * estira, s / Math.sqrt(estira));
      rotY += ((raton.sx * .6 + t * .05 * ritmo) - rotY) * .05;
      rotX += ((-raton.sy * .4) - rotX) * .05;
      orbe.rotation.set(rotX, rotY, 0);

      orbUniforms.uTime.value = t * ritmo;
      orbUniforms.uAmp.value = est.amp * (1 + Math.min(1.5, Math.abs(vel)) * .55 + pulso * 1.2) * (1 + pop);
      orbUniforms.uFreq.value = est.freq;
      orbUniforms.uSpeed.value = est.speed;
      orbUniforms.uOpacity.value = est.op * (1 - pop);
      orbUniforms.uC1.value.copy(est.cols[0]);
      orbUniforms.uC2.value.copy(est.cols[1]);
      orbUniforms.uC3.value.copy(est.cols[2]);

      // el polvo sube cuando bajas (y cae cuando subes)
      offset += (vel * .045 + est.fall * dt) * ritmo;
      polvoUniforms.uOff.value = offset;
      polvoUniforms.uTime.value = t * ritmo;
      polvoUniforms.uVel.value = vel;
      polvoUniforms.uOpacity.value = est.dustOp * (1 - pop * .6);
      polvoUniforms.uColor.value.copy(est.dust);

      // un poco de paralaje con el ratón
      camera.position.x += (raton.sx * .25 - camera.position.x) * .05;
      camera.position.y += (raton.sy * .15 - camera.position.y) * .05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
  }
})();
