/* =====================================================================
   NO TE DESPIERTES — motor
   · Carga Three.js (+ extras) y Lenis desde la CDN
   · Construye las 7 escenas y las precalienta detrás de la pantalla de carga
   · Lenis suaviza el scroll; el progreso del scroll elige escena y mueve
     su cámara
   · Postproceso: bloom + grano de película, aberración cromática, viñeta,
     glitch de pesadilla y la "disolución" entre escenas
   · Raycasting: los objetos que se pueden tocar reaccionan al ratón
   ===================================================================== */
(() => {
  'use strict';
  const S = window.SUENO;
  const root = document.documentElement;

  const esperaFrame = () => new Promise(r => requestAnimationFrame(() => r()));

  /* ---------- pantalla de carga ---------- */
  const carga = {
    barra: document.querySelector('.cargando-barra'),
    pct: document.querySelector('.cargando-pct'),
    set(f) {
      this.barra.style.setProperty('--c', f.toFixed(3));
      this.pct.textContent = Math.round(f * 100) + '%';
    },
  };

  /* ---------- shader final: grano, aberración, viñeta, velo, glitch ---------- */
  const SHADER_FINAL = {
    name: 'SuenoFinal',
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uVeil: { value: 0 },
      uVeilColor: { value: null },
      uGlitch: { value: 0 },
      uVel: { value: 0 },
      uGrain: { value: 0.06 },
      uVignette: { value: 0.55 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform float uTime, uVeil, uGlitch, uVel, uGrain, uVignette;
      uniform vec3 uVeilColor;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float vnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      void main(){
        vec2 uv = vUv;
        // pesadilla: bandas que se desplazan
        if (uGlitch > 0.) {
          float tk = floor(uTime * 14.);
          float band = floor(uv.y * 28.);
          float r = hash(vec2(band, tk));
          if (r > 1. - .10 * uGlitch) uv.x += (hash(vec2(band, tk + 3.)) - .5) * .09 * uGlitch;
        }
        // el velo deforma la imagen como un recuerdo que se derrite
        uv += (vec2(vnoise(uv * 5. + uTime * .6), vnoise(uv * 5. - uTime * .5 + 9.)) - .5) * .045 * uVeil;
        vec2 c = uv - .5;
        float d = dot(c, c);
        float ca = .0018 + d * .010 + min(abs(uVel), 2.) * .0025 + uGlitch * .008;
        vec3 col;
        col.r = texture2D(tDiffuse, uv - c * ca * 2.).r;
        col.g = texture2D(tDiffuse, uv).g;
        col.b = texture2D(tDiffuse, uv + c * ca * 2.).b;
        col *= 1. - d * uVignette;
        // scanlines en la pesadilla
        col *= 1. - uGlitch * .10 * step(.5, fract(gl_FragCoord.y * .5));
        // disolución hacia el color del velo
        float n = vnoise(vUv * 3.5 + uTime * .15) * .6 + vnoise(vUv * 11. - uTime * .2) * .3;
        float v = smoothstep(n - .12, n + .12, uVeil * 1.5 - .3);
        col = mix(col, uVeilColor, v);
        // grano de película
        float g = hash(gl_FragCoord.xy * .9 + fract(uTime * 7.) * 731.) - .5;
        col += g * uGrain * (1. - v * .5);
        gl_FragColor = vec4(col, 1.);
      }`,
  };

  async function arrancar() {
    /* ---------- librerías ---------- */
    let T, M;
    try {
      const [three, rbox, refl, comp, rpass, bloom, spass, opass] = await Promise.all([
        import('three'),
        import('three/addons/geometries/RoundedBoxGeometry.js'),
        import('three/addons/objects/Reflector.js'),
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'),
        import('three/addons/postprocessing/ShaderPass.js'),
        import('three/addons/postprocessing/OutputPass.js'),
      ]);
      T = three;
      M = {
        RoundedBoxGeometry: rbox.RoundedBoxGeometry, Reflector: refl.Reflector,
        EffectComposer: comp.EffectComposer, RenderPass: rpass.RenderPass,
        UnrealBloomPass: bloom.UnrealBloomPass, ShaderPass: spass.ShaderPass, OutputPass: opass.OutputPass,
      };
    } catch (err) {
      console.error('[sueño] No se pudo cargar Three.js', err);
      root.classList.add('sin-3d');
      return;
    }
    carga.set(0.08);

    let Lenis = null;
    try { Lenis = (await import('lenis')).default; } catch (err) { console.warn('[sueño] Lenis no se pudo cargar; scroll normal.', err); }

    /* ---------- renderer ---------- */
    const canvas = document.getElementById('mundo');
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    } catch (err) {
      console.error('[sueño] WebGL no disponible', err);
      root.classList.add('sin-3d');
      return;
    }
    let dpr = Math.min(devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.toneMapping = T.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;

    const camera = new T.PerspectiveCamera(40, innerWidth / innerHeight, 0.05, 400);

    const ctx = (S.ctx = {
      T, M, renderer, camera,
      raton: { x: 0, y: 0, sx: 0, sy: 0, px: innerWidth / 2, py: innerHeight / 2, dentro: false },
      tiempo: 0, dt: 0, vel: 0,
      interactivos: null,
      /** Registra un objeto que reacciona al ratón: { etiqueta, hover(on), click(), activo() } */
      interactivo(obj, op) { this.interactivos.push(Object.assign({ obj }, op)); return obj; },
    });

    S.kit.iniciar(ctx);

    /* ---------- construir las escenas ---------- */
    const defs = S.escenas.slice().sort((a, b) => a.n - b.n);
    const mundos = [];
    for (let i = 0; i < defs.length; i++) {
      await esperaFrame();
      ctx.interactivos = [];
      try {
        const m = defs[i].construir(ctx);
        m.def = defs[i];
        m.interactivos = ctx.interactivos;
        mundos.push(m);
      } catch (err) {
        console.error(`[sueño] Falló la escena ${defs[i].n}`, err);
        throw err;
      }
      carga.set(0.08 + 0.42 * (i + 1) / defs.length);
    }

    /* ---------- postproceso ---------- */
    const rt = new T.WebGLRenderTarget(innerWidth * dpr, innerHeight * dpr, { type: T.HalfFloatType, samples: 4 });
    const composer = new M.EffectComposer(renderer, rt);
    composer.setPixelRatio(dpr);
    composer.setSize(innerWidth, innerHeight);
    const renderPass = new M.RenderPass(mundos[0].scene, camera);
    const bloom = new M.UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.32, 0.65, 0.88);
    const final = new M.ShaderPass(SHADER_FINAL);
    final.uniforms.uVeilColor.value = new T.Color('#fbf4ee');
    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(new M.OutputPass());
    composer.addPass(final);

    /* ---------- precalentar: compilar y pintar cada escena una vez ---------- */
    for (let i = 0; i < mundos.length; i++) {
      const m = mundos[i];
      await esperaFrame();
      ponerCamara(m, 0.5);
      try { await renderer.compileAsync(m.scene, camera); } catch (_) { renderer.compile(m.scene, camera); }
      m.animar && m.animar(0.5, 0.016, ctx);
      renderPass.scene = m.scene;
      composer.render(0.016);
      carga.set(0.5 + 0.5 * (i + 1) / mundos.length);
    }

    /* ---------- Lenis ---------- */
    let lenis = null;
    if (Lenis && !S.reduce) {
      lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 0.85, smoothWheel: true, anchors: { duration: 4.5 }, autoRaf: false });
    }
    S.lenis = lenis;
    let lastY = scrollY;
    function leerScroll() {
      const max = Math.max(1, root.scrollHeight - innerHeight);
      if (lenis) return { p: S.clamp(lenis.scroll / max), v: lenis.velocity || 0 };
      const y = scrollY, v = y - lastY; lastY = y;
      return { p: S.clamp(y / max), v };
    }

    /* ---------- ratón ---------- */
    const R = ctx.raton;
    let movido = true;
    addEventListener('pointermove', e => {
      R.x = (e.clientX / innerWidth) * 2 - 1;
      R.y = -((e.clientY / innerHeight) * 2 - 1);
      R.px = e.clientX; R.py = e.clientY;
      R.dentro = true; movido = true;
      if (e.pointerType === 'mouse') cursor.classList.add('vivo');
    }, { passive: true });
    document.addEventListener('pointerleave', () => { R.dentro = false; cursor.classList.remove('vivo'); });

    const ray = new T.Raycaster();
    const ndc = new T.Vector2();
    /** Punto del mundo bajo el ratón, a una distancia dada de la cámara */
    ctx.puntoRaton = (dist, destino) => {
      ndc.set(R.sx, R.sy);
      ray.setFromCamera(ndc, camera);
      return ray.ray.at(dist, destino);
    };

    const cursor = document.querySelector('.cursor');
    const cursorLabel = cursor.querySelector('.cursor-label');
    let encima = null;
    function setEncima(it) {
      if (it === encima) return;
      if (encima && encima.hover) encima.hover(false);
      encima = it;
      if (encima && encima.hover) encima.hover(true);
      cursor.classList.toggle('toca', !!encima);
      if (encima) cursorLabel.textContent = (typeof encima.etiqueta === 'function' ? encima.etiqueta() : encima.etiqueta) || '';
      canvas.style.cursor = encima ? 'pointer' : '';
    }
    function buscar(m) {
      if (!R.dentro || !m.interactivos.length) return setEncima(null);
      ndc.set(R.x, R.y);
      ray.setFromCamera(ndc, camera);
      const lista = m.interactivos.filter(it => !it.activo || it.activo());
      const hit = ray.intersectObjects(lista.map(it => it.obj), true)[0];
      let found = null;
      if (hit) {
        for (let o = hit.object; o && !found; o = o.parent) found = lista.find(it => it.obj === o) || null;
      }
      setEncima(found);
    }
    canvas.addEventListener('click', () => {
      if (!encima || !encima.click) return;
      encima.click();
      cursorLabel.textContent = (typeof encima.etiqueta === 'function' ? encima.etiqueta() : encima.etiqueta) || '';
    });
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      // en pantallas táctiles: tocar = pasar por encima + hacer clic
      R.x = (e.clientX / innerWidth) * 2 - 1;
      R.y = -((e.clientY / innerHeight) * 2 - 1);
      R.dentro = true;
      buscar(mundos[actual]);
      if (encima) { encima.click && encima.click(); const it = encima; setTimeout(() => { if (encima === it) setEncima(null); }, 1600); }
    });

    /* ---------- tamaño ---------- */
    function medir() {
      const w = innerWidth, h = innerHeight;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      composer.setPixelRatio(dpr);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      S.textos && S.textos.medir();
    }
    addEventListener('resize', medir);

    /* ---------- cámara ---------- */
    function ponerCamara(m, t) {
      camera.up.set(0, 1, 0);
      const fov = (m.fov || 40) * (camera.aspect < 0.8 ? 1.25 : 1);
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      m.camara(t, camera, ctx);
    }

    /* ---------- HUD ---------- */
    const hud = {
      num: document.querySelector('.depth-num'),
      bar: document.querySelector('.bar'),
      hint: document.querySelector('.hint'),
      pct: -1,
    };
    function profundidad(p) {
      // baja hasta el 100% al llegar al despertar… y al final vuelve a subir
      if (p < 0.8696) return Math.round(p / 0.8696 * 100);
      if (p < 0.98043) return Math.round(S.mix(100, 3, S.tramo(p, 0.8696, 0.98043)));
      if (p < 0.99087) return 3;
      return Math.round(S.mix(3, 100, S.tramo(p, 0.99087, 0.99348)));
    }

    /* ---------- bucle ---------- */
    let actual = 0, prev = performance.now(), tinta = '';
    const veilColor = new T.Color();
    let medidas = [], dprBajado = 0;
    const autoDpr = !/[?&]hq\b/.test(location.search); // ?hq = no bajar nunca la resolución

    root.classList.add('listo');
    S.textos && S.textos.iniciar();

    function frame(time) {
      const dt = Math.min(0.05, (time - prev) / 1000);
      prev = time;
      ctx.dt = dt;
      ctx.tiempo += dt;
      if (lenis) lenis.raf(time);

      const { p, v } = leerScroll();
      ctx.vel = S.amort(ctx.vel, S.clamp(v / 40, -2, 2), 6, dt);
      ctx.p = p;
      R.sx = S.amort(R.sx, R.x, 3, dt);
      R.sy = S.amort(R.sy, R.y, 3, dt);

      // ¿qué escena toca y cuánto velo hay?
      const B = S.BORDES;
      let i = 0;
      while (i < mundos.length - 1 && p >= B[i + 1]) i++;
      const t = S.clamp((p - B[i]) / (B[i + 1] - B[i]));
      let velo = 0, kVelo = -1;
      for (let k = 1; k < Math.min(B.length - 1, mundos.length); k++) {
        const d = Math.abs(p - B[k]);
        if (d < 0.014) { velo = 1 - d / 0.014; kVelo = k; }
      }

      if (i !== actual) {
        setEncima(null);
        actual = i;
        S.textos && S.textos.escena(mundos[i].def);
      }
      const m = mundos[i];
      ctx.t = t;
      ponerCamara(m, t);
      // un poco de paralaje con el ratón
      camera.rotateY(-R.sx * 0.04);
      camera.rotateX(R.sy * 0.028);
      m.animar && m.animar(t, dt, ctx);
      S.kit.tick(ctx);

      if (movido || (ctx.tiempo * 30 | 0) % 3 === 0) { buscar(m); movido = false; }

      // postproceso
      const fu = final.uniforms;
      fu.uTime.value = ctx.tiempo;
      fu.uVeil.value = S.suave(velo);
      if (kVelo > 0) veilColor.set(mundos[kVelo].def.velo || '#fbf4ee');
      fu.uVeilColor.value.copy(veilColor);
      fu.uGlitch.value = m.glitch || 0;
      fu.uVel.value = ctx.vel;
      fu.uGrain.value = m.grano != null ? m.grano : 0.06;
      bloom.strength = m.bloom != null ? m.bloom : 0.32;
      renderer.toneMappingExposure = m.exposicion || 1;
      renderPass.scene = m.scene;
      composer.render(dt);

      // color de los textos
      const tn = velo > 0.35 && kVelo > 0 ? (mundos[kVelo].def.tintaVelo || '#2b2140') : (m.tinta || m.def.tinta || '#2b2140');
      if (tn !== tinta) { tinta = tn; root.style.setProperty('--ink', tn); }

      // HUD y textos
      const pct = profundidad(p);
      if (pct !== hud.pct) { hud.pct = pct; hud.num.textContent = pct + '%'; }
      hud.bar.style.transform = `scaleX(${p.toFixed(4)})`;
      hud.hint.style.opacity = S.clamp((0.012 - p) * 90).toFixed(3);
      S.textos && S.textos.actualizar(p, ctx.vel, R, dt);
      cursor.style.transform = `translate3d(${R.px}px, ${R.py}px, 0)`;

      // si el ordenador va justo, bajamos la resolución
      medidas.push(dt);
      if (medidas.length >= 90) {
        const media = medidas.reduce((a, b) => a + b, 0) / medidas.length;
        medidas = [];
        if (autoDpr && media > 0.03 && dprBajado < 2 && !document.hidden) {
          dpr = Math.max(0.75, dpr - 0.35); dprBajado++;
          medir();
        }
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  addEventListener('DOMContentLoaded', () => {
    arrancar().catch(err => {
      console.error('[sueño] Error al arrancar', err);
      root.classList.add('sin-3d');
    });
  });
})();
