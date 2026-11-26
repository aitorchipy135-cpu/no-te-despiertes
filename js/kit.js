/* =====================================================================
   NO TE DESPIERTES — kit de piezas
   Todo lo que comparten las escenas: materiales (yeso, sábanas, lana,
   cristal), cielo, agua que refleja, nubes, luces con sombras suaves y
   objetos del sueño (cama, lámpara, puertas, relojes, ovejas, luna…).
   Todo se genera con código: no hay modelos ni imágenes externas.
   ===================================================================== */
(() => {
  'use strict';
  const S = window.SUENO;
  const kit = (S.kit = {});
  let T, M, ctx;
  const relojes = []; // funciones que se llaman en cada frame

  kit.iniciar = c => {
    ctx = c; T = c.T; M = c.M;
    kit.T = T;
    kit.pmrem = new T.PMREMGenerator(c.renderer);
  };
  kit.tick = c => { for (const f of relojes) f(c); };
  kit.cadaFrame = f => relojes.push(f);

  /* ------------------------------------------------------------------
     TEXTURAS DIBUJADAS CON CANVAS
     ------------------------------------------------------------------ */
  kit.lienzo = (w, h, dibujar) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    dibujar(c.getContext('2d'), w, h);
    return c;
  };
  kit.textura = (w, h, dibujar, op = {}) => {
    const tx = new T.CanvasTexture(kit.lienzo(w, h, dibujar));
    if (op.color !== false) tx.colorSpace = T.SRGBColorSpace;
    if (op.repetir) { tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(op.repetir[0], op.repetir[1]); }
    tx.anisotropy = 8;
    return tx;
  };

  // ruido de valor, repetible, para el relieve del yeso
  let _ruido = null;
  kit.ruido = () => {
    if (_ruido) return _ruido;
    const N = 256, rnd = S.azar(11);
    const capas = [[8, 0.45], [16, 0.25], [32, 0.16], [64, 0.09], [128, 0.05]].map(([g, a]) => {
      const v = new Float32Array(g * g);
      for (let i = 0; i < v.length; i++) v[i] = rnd();
      return { g, a, v };
    });
    const suave = t => t * t * (3 - 2 * t);
    _ruido = kit.textura(N, N, (c) => {
      const img = c.createImageData(N, N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let s = 0;
        for (const { g, a, v } of capas) {
          const fx = x / N * g, fy = y / N * g;
          const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = suave(fx - x0), ty = suave(fy - y0);
          const at = (i, j) => v[((j % g) * g) + (i % g)];
          const a0 = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
          const a1 = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
          s += (a0 + (a1 - a0) * ty) * a;
        }
        const k = (y * N + x) * 4, b = Math.round(s * 255);
        img.data[k] = img.data[k + 1] = img.data[k + 2] = b; img.data[k + 3] = 255;
      }
      c.putImageData(img, 0, 0);
    }, { color: false, repetir: [1, 1] });
    return _ruido;
  };

  // nube: una bola suave de algodón
  let _puff = null;
  kit.puff = () => _puff || (_puff = kit.textura(128, 128, (c, w, h) => {
    const rnd = S.azar(5);
    for (let i = 0; i < 9; i++) {
      const x = w / 2 + (rnd() - 0.5) * w * 0.34, y = h / 2 + (rnd() - 0.5) * h * 0.3, r = w * (0.2 + rnd() * 0.18);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.25)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
  }));

  /* ------------------------------------------------------------------
     MATERIALES
     ------------------------------------------------------------------ */
  kit.yeso = (color, op = {}) => new T.MeshStandardMaterial(Object.assign({
    color, roughness: 0.93, metalness: 0, bumpMap: kit.ruido(), bumpScale: 1.4,
  }, op));
  kit.pintura = (color, op = {}) => new T.MeshPhysicalMaterial(Object.assign({
    color, roughness: 0.45, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.35,
  }, op));
  kit.tela = (color, op = {}) => new T.MeshPhysicalMaterial(Object.assign({
    color, roughness: 0.95, sheen: 1, sheenColor: new T.Color('#ffffff'), sheenRoughness: 0.55,
  }, op));
  kit.madera = (color = '#c79d82', op = {}) => new T.MeshPhysicalMaterial(Object.assign({
    color, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4, bumpMap: kit.ruido(), bumpScale: 0.5,
  }, op));
  kit.metal = (color = '#e6c98a', op = {}) => new T.MeshPhysicalMaterial(Object.assign({
    color, roughness: 0.22, metalness: 1,
  }, op));
  kit.vidrio = (op = {}) => new T.MeshPhysicalMaterial(Object.assign({
    color: '#ffffff', roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.5, ior: 1.42,
    iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessMinimum: 180, iridescenceThicknessMaximum: 720, clearcoat: 1, clearcoatRoughness: 0.04,
    envMapIntensity: 1.25,
  }, op));
  kit.luz = (color, fuerza = 3) => new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(fuerza), toneMapped: true });

  /* ------------------------------------------------------------------
     GEOMETRÍA BÁSICA
     ------------------------------------------------------------------ */
  kit.sombra = (obj, cast = true, recibe = true) => {
    obj.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = recibe; } });
    return obj;
  };
  /** UVs proyectadas por caras (como un cubo): el relieve tiene la misma escala en objetos grandes y pequeños */
  kit.uvCubo = (geo, escala = 0.5) => {
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (ax >= ay && ax >= az) uv.setXY(i, z * escala, y * escala);
      else if (ay >= az) uv.setXY(i, x * escala, z * escala);
      else uv.setXY(i, x * escala, y * escala);
    }
    uv.needsUpdate = true;
    return geo;
  };
  kit.caja = (w, h, d, mat, op = {}) => {
    const r = Math.min(op.r != null ? op.r : 0.04, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const geo = kit.uvCubo(r > 0.002 ? new M.RoundedBoxGeometry(w, h, d, op.seg || 3, r) : new T.BoxGeometry(w, h, d), op.uv || 0.45);
    const m = new T.Mesh(geo, mat);
    m.castShadow = op.sombra !== false; m.receiveShadow = true;
    return m;
  };
  kit.en = (obj, x = 0, y = 0, z = 0, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; return obj; };

  /** Muro con huecos. huecos: [{ x, y, w, h, arco }] (x centro, y base). El muro va de y=0 a y=h. */
  kit.muro = (w, h, grosor, huecos, mat, op = {}) => {
    const s = new T.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
    for (const q of huecos || []) {
      const p = new T.Path();
      const x0 = q.x - q.w / 2, x1 = q.x + q.w / 2, y0 = q.y, y1 = q.y + q.h;
      p.moveTo(x0, y0); p.lineTo(x1, y0);
      if (q.arco) { const r = q.w / 2; p.lineTo(x1, y1 - r); p.absarc(q.x, y1 - r, r, 0, Math.PI, false); }
      else { p.lineTo(x1, y1); p.lineTo(x0, y1); }
      p.lineTo(x0, y0);
      s.holes.push(p);
    }
    const geo = new T.ExtrudeGeometry(s, {
      depth: grosor, bevelEnabled: op.bisel !== false, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 20,
    });
    geo.translate(0, 0, -grosor / 2);
    geo.computeVertexNormals();
    kit.uvCubo(geo, 0.45);
    const m = new T.Mesh(geo, mat);
    m.castShadow = m.receiveShadow = true;
    return m;
  };

  /** Pórtico: un muro con un arco de paso que llega hasta el suelo. Geometría (sin malla). */
  kit.porticoGeo = (w, h, luzW, luzH, grosor) => {
    const s = new T.Shape();
    const r = luzW / 2;
    s.moveTo(-w / 2, 0); s.lineTo(-r, 0); s.lineTo(-r, luzH - r);
    s.absarc(0, luzH - r, r, Math.PI, 0, true);
    s.lineTo(r, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
    const geo = new T.ExtrudeGeometry(s, { depth: grosor, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 28 });
    geo.translate(0, 0, -grosor / 2);
    geo.computeVertexNormals();
    return kit.uvCubo(geo, 0.45);
  };

  /** Escalera maciza que sube hacia -z */
  kit.escalera = (n, ancho, alto, fondo, mat) => {
    const g = new T.Group();
    for (let i = 0; i < n; i++) {
      const c = kit.caja(ancho, alto * (i + 1), fondo, mat, { r: 0.02 });
      c.position.set(0, alto * (i + 1) / 2, -i * fondo);
      g.add(c);
    }
    return g;
  };

  /** Isla flotante: losa + zigurat invertido debajo */
  kit.isla = (w, d, mat, op = {}) => {
    const g = new T.Group();
    const losa = kit.caja(w, 0.7, d, op.matTop || mat, { r: 0.22, seg: 4 });
    losa.position.y = -0.35;
    g.add(losa);
    const pisos = op.pisos || [[0.82, 0.8], [0.58, 0.8], [0.32, 1.0], [0.14, 1.2]];
    let y = -0.7;
    for (const [f, h] of pisos) {
      const c = kit.caja(w * f, h, d * f, mat, { r: 0.12 });
      y -= h / 2; c.position.y = y; y -= h / 2;
      g.add(c);
    }
    return g;
  };

  /* ------------------------------------------------------------------
     LUZ, CIELO Y ENTORNO
     ------------------------------------------------------------------ */
  kit.sol = (scene, pos, color, fuerza, area = 10, op = {}) => {
    const l = new T.DirectionalLight(color, fuerza);
    l.position.set(pos[0], pos[1], pos[2]);
    l.castShadow = true;
    const s = l.shadow;
    s.mapSize.set(op.mapa || 2048, op.mapa || 2048);
    Object.assign(s.camera, { left: -area, right: area, top: area, bottom: -area, near: 0.5, far: op.lejos || 80 });
    s.camera.updateProjectionMatrix();
    s.bias = -0.0004; s.normalBias = 0.035; s.radius = op.radio != null ? op.radio : 5;
    const m = op.mira || [0, 0, 0];
    l.target.position.set(m[0], m[1], m[2]);
    scene.add(l, l.target);
    return l;
  };
  kit.hemi = (scene, cielo, suelo, f) => { const h = new T.HemisphereLight(cielo, suelo, f); scene.add(h); return h; };

  const SKY_VS = /* glsl */`
    varying vec3 vDir;
    void main(){
      vDir = position;
      gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + position, 1.0);
    }`;
  const SKY_FS = /* glsl */`
    uniform vec3 uTop, uHor, uBot, uSun, uSunCol;
    uniform float uSunFuerza, uStars, uTime;
    varying vec3 vDir;
    float hash3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    void main(){
      vec3 d = normalize(vDir);
      float h = d.y;
      vec3 col = h > 0. ? mix(uHor, uTop, pow(clamp(h, 0., 1.), .55)) : mix(uHor, uBot, pow(clamp(-h, 0., 1.), .45));
      float s = max(dot(d, normalize(uSun)), 0.);
      col += uSunCol * (pow(s, 1200.) * 4. + pow(s, 28.) * .32 + pow(s, 4.) * .07) * uSunFuerza;
      if (uStars > 0.) {
        vec3 g = floor(d * 210.);
        float r = hash3(g);
        float st = step(.9972, r) * (.55 + .45 * sin(uTime * (1. + r * 3.) + r * 40.));
        col += vec3(st) * uStars * smoothstep(-.05, .25, h) * 1.4;
      }
      gl_FragColor = vec4(col, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  /** Cielo degradado con sol. op: { arriba, horizonte, abajo, sol:[x,y,z], solColor, solFuerza } */
  kit.cielo = (scene, op) => {
    const u = {
      uTop: { value: new T.Color(op.arriba) }, uHor: { value: new T.Color(op.horizonte) }, uBot: { value: new T.Color(op.abajo || op.horizonte) },
      uSun: { value: new T.Vector3().fromArray(op.sol || [0.5, 0.4, -1]).normalize() },
      uSunCol: { value: new T.Color(op.solColor || '#fff1dc') }, uSunFuerza: { value: op.solFuerza != null ? op.solFuerza : 1 },
      uStars: { value: 0 }, uTime: { value: 0 },
    };
    const mat = new T.ShaderMaterial({ uniforms: u, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: T.BackSide, depthWrite: false, fog: false });
    const mesh = new T.Mesh(new T.SphereGeometry(150, 48, 24), mat);
    mesh.frustumCulled = false; mesh.renderOrder = -10;
    scene.add(mesh);
    relojes.push(c => { u.uTime.value = c.tiempo; });
    return { mesh, u };
  };
  /** Mapa de entorno (reflejos) a partir del cielo de la escena */
  kit.entorno = (scene, cielo, extras = []) => {
    const env = new T.Scene();
    env.add(new T.Mesh(cielo.mesh.geometry, cielo.mesh.material));
    for (const e of extras) env.add(e);
    const rt = kit.pmrem.fromScene(env, 0.03);
    scene.environment = rt.texture;
    return rt.texture;
  };

  /* ------------------------------------------------------------------
     NUBES (sprites suaves que se apilan)
     ------------------------------------------------------------------ */
  const matsNube = new Map();
  function matNube(color, opacidad) {
    const k = color + opacidad;
    if (!matsNube.has(k)) matsNube.set(k, new T.SpriteMaterial({ map: kit.puff(), color: new T.Color(color), transparent: true, opacity: opacidad, depthWrite: false, fog: true }));
    return matsNube.get(k);
  }
  /** op: { tam, puffs, luz, sombra, semilla, opacidad } */
  kit.nube = (op = {}) => {
    const g = new T.Group();
    const rnd = S.azar(op.semilla || 1);
    const tam = op.tam || 3, n = op.puffs || 14;
    const tonos = [op.luz || '#ffffff', op.medio || '#fbeef0', op.sombra || '#e9d2e0'];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
      const x = Math.cos(a) * r * tam, z = Math.sin(a) * r * tam * 0.55, y = (rnd() - 0.35) * tam * 0.38 * (1 - r * 0.6);
      const tono = y > tam * 0.05 ? 0 : y > -tam * 0.05 ? 1 : 2;
      const sp = new T.Sprite(matNube(tonos[tono], op.opacidad || 0.95));
      const s = tam * (0.75 + rnd() * 0.7) * (1 - r * 0.35);
      sp.scale.set(s, s * 0.82, 1);
      sp.position.set(x, y, z);
      g.add(sp);
    }
    return g;
  };

  /* ------------------------------------------------------------------
     AGUA QUE REFLEJA
     ------------------------------------------------------------------ */
  const SHADER_AGUA = {
    name: 'AguaSueno',
    uniforms: {
      color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
      uColor: { value: null }, uTime: { value: 0 }, uRipple: { value: 0.02 }, uRefl: { value: 0.9 },
      uFogColor: { value: null }, uFogNear: { value: 1e5 }, uFogFar: { value: 2e5 }, uBrillo: { value: 0.06 },
    },
    vertexShader: /* glsl */`
      uniform mat4 textureMatrix;
      varying vec4 vUv;
      varying vec3 vW;
      void main(){
        vUv = textureMatrix * vec4(position, 1.0);
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform vec3 uColor, uFogColor;
      uniform float uTime, uRipple, uRefl, uFogNear, uFogFar, uBrillo;
      varying vec4 vUv;
      varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        vec2 w = vec2(sin(p.x * 1.1 + uTime * .8 + sin(p.y * .7 + uTime * .3) * 1.6), cos(p.y * 1.4 - uTime * .6 + sin(p.x * .6) * 1.3));
        w += .55 * vec2(sin(p.y * 3.3 + uTime * 1.4 + p.x), cos(p.x * 2.9 - uTime * 1.2 - p.y * .5));
        w += .25 * vec2(sin(p.x * 7.1 - uTime * 2.), cos(p.y * 6.3 + uTime * 1.7));
        vec4 q = vUv;
        q.xy += w * uRipple * q.w;
        vec3 refl = texture2DProj(tDiffuse, q).rgb;
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1. - abs(V.y), 3.);
        vec3 col = mix(uColor, refl, clamp(uRefl * (.6 + .4 * fres), 0., 1.));
        col += uBrillo * smoothstep(1.25, 1.95, w.x + w.y);
        float f = smoothstep(uFogNear, uFogFar, length(cameraPosition - vW));
        col = mix(col, uFogColor, f);
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  };
  /** Plano de agua que refleja la escena. Mira hacia +y (o hacia -y con op.techo). */
  kit.agua = (w, d, op = {}) => {
    const dprA = Math.min(devicePixelRatio || 1, 1.5);
    const res = op.res || 0.5;
    const ref = new M.Reflector(new T.PlaneGeometry(w, d), {
      textureWidth: Math.round(innerWidth * dprA * res), textureHeight: Math.round(innerHeight * dprA * res),
      color: 0xffffff, clipBias: 0.003, multisample: 0, shader: SHADER_AGUA,
    });
    ref.rotation.x = op.techo ? Math.PI / 2 : -Math.PI / 2;
    const u = ref.material.uniforms;
    u.uColor.value = new T.Color(op.color || '#a9bccb');
    u.uRipple.value = op.ondas != null ? op.ondas : 0.02;
    u.uRefl.value = op.reflejo != null ? op.reflejo : 0.9;
    u.uFogColor.value = new T.Color('#ffffff');
    relojes.push(c => {
      u.uTime.value = c.tiempo;
      let s = ref; while (s.parent) s = s.parent;
      if (s.fog) { u.uFogColor.value.copy(s.fog.color); u.uFogNear.value = s.fog.near; u.uFogFar.value = s.fog.far; }
    });
    return ref;
  };

  /* ------------------------------------------------------------------
     PARTÍCULAS: motas de polvo, nieve, burbujas, ceniza
     ------------------------------------------------------------------ */
  /** caja: [cx, cy, cz, sx, sy, sz]. op: { color, tam, sube, deriva, opacidad, aditivo } */
  kit.motas = (n, caja, op = {}) => {
    const rnd = S.azar(op.semilla || 9);
    const pos = new Float32Array(n * 3), sem = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rnd() - 0.5) * caja[3];
      pos[i * 3 + 1] = (rnd() - 0.5) * caja[4];
      pos[i * 3 + 2] = (rnd() - 0.5) * caja[5];
      sem[i] = rnd();
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new T.BufferAttribute(sem, 1));
    const u = {
      uTime: { value: 0 }, uOff: { value: 0 }, uTam: { value: op.tam || 40 }, uColor: { value: new T.Color(op.color || '#ffffff') },
      uAlto: { value: caja[4] }, uOpacidad: { value: op.opacidad != null ? op.opacidad : 0.8 }, uDeriva: { value: op.deriva != null ? op.deriva : 0.3 },
      uPix: { value: Math.min(devicePixelRatio || 1, 1.5) },
    };
    const mat = new T.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false,
      blending: op.aditivo === false ? T.NormalBlending : T.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aSeed;
        uniform float uTime, uOff, uTam, uAlto, uDeriva, uPix;
        varying float vA;
        void main(){
          vec3 p = position;
          float sp = .4 + aSeed;
          p.y = mod(p.y + uOff * sp + uAlto * .5, uAlto) - uAlto * .5;
          p.x += sin(uTime * .3 * sp + aSeed * 40.) * uDeriva;
          p.z += cos(uTime * .25 * sp + aSeed * 23.) * uDeriva;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_PointSize = uTam * uPix * (.35 + aSeed * .9) / max(.5, -mv.z);
          vA = (.4 + .6 * fract(aSeed * 13.7)) * (.65 + .35 * sin(uTime * (1.2 + aSeed * 2.) + aSeed * 30.));
          vA *= 1. - smoothstep(uAlto * .38, uAlto * .5, abs(p.y));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        uniform float uOpacidad;
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - .5);
          float a = 1. - smoothstep(0., .5, d);
          gl_FragColor = vec4(uColor, a * a * vA * uOpacidad);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const pts = new T.Points(geo, mat);
    pts.position.set(caja[0], caja[1], caja[2]);
    pts.frustumCulled = false;
    pts.userData.u = u;
    const sube = op.sube || 0;
    relojes.push(c => { u.uTime.value = c.tiempo; u.uOff.value += sube * c.dt; });
    return pts;
  };

  /* ------------------------------------------------------------------
     CÁMARA: ruta suave por puntos clave
     ------------------------------------------------------------------ */
  /** claves: [[t, [px,py,pz], [mx,my,mz]], ...]. Devuelve (t, cam) => coloca la cámara. */
  kit.ruta = claves => {
    const P = new T.CatmullRomCurve3(claves.map(k => new T.Vector3().fromArray(k[1])), false, 'catmullrom', 0.5);
    const L = new T.CatmullRomCurve3(claves.map(k => new T.Vector3().fromArray(k[2])), false, 'catmullrom', 0.5);
    const n = claves.length - 1, mira = new T.Vector3();
    return (t, cam) => {
      let k = 0;
      while (k < n - 1 && t > claves[k + 1][0]) k++;
      const l = S.clamp((t - claves[k][0]) / (claves[k + 1][0] - claves[k][0]));
      const e = S.mix(l, S.suave(l), 0.55); // se frena un poco en cada punto: da tiempo a leer
      const u = (k + e) / n;
      P.getPoint(u, cam.position);
      L.getPoint(u, mira);
      cam.lookAt(mira);
      return mira;
    };
  };

  /* ------------------------------------------------------------------
     OBJETOS DEL SUEÑO
     ------------------------------------------------------------------ */
  /** Luna con cara: 'dormida', 'despierta' o 'sonrie' */
  kit.luna = (r, op = {}) => {
    const rnd = S.azar(op.semilla || 21);
    const crateres = [];
    for (let i = 0; i < 55; i++) crateres.push([rnd() * 1024, 60 + rnd() * 392, 6 + rnd() * rnd() * 46, 0.08 + rnd() * 0.14]);
    const cara = modo => kit.textura(1024, 512, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fff7df'); g.addColorStop(0.5, '#fff1cc'); g.addColorStop(1, '#f4dcaa');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (const [x, y, rr, a] of crateres) {
        if (Math.abs(x - 256) < 120 && Math.abs(y - 270) < 90) continue; // la cara queda limpia
        const cg = c.createRadialGradient(x - rr * 0.2, y - rr * 0.2, rr * 0.2, x, y, rr);
        cg.addColorStop(0, `rgba(205,160,95,${a})`); cg.addColorStop(0.8, `rgba(215,170,105,${a * 0.6})`); cg.addColorStop(1, 'rgba(255,240,210,0)');
        c.fillStyle = cg; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
      }
      // cara (mirando a +z → u = 0.25)
      const cx = 256, cy = 262;
      c.strokeStyle = '#7a6587'; c.fillStyle = '#7a6587'; c.lineWidth = 7; c.lineCap = 'round';
      c.fillStyle = 'rgba(255,140,170,.35)';
      c.beginPath(); c.ellipse(cx - 78, cy + 32, 24, 13, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx + 78, cy + 32, 24, 13, 0, 0, Math.PI * 2); c.fill();
      if (modo === 'dormida') {
        c.beginPath(); c.arc(cx - 50, cy - 6, 22, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        c.beginPath(); c.arc(cx + 50, cy - 6, 22, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        c.fillStyle = '#7a6587'; c.beginPath(); c.arc(cx, cy + 52, 9, 0, Math.PI * 2); c.fill();
      } else {
        for (const s of [-1, 1]) {
          c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx + s * 50, cy - 4, 20, 0, Math.PI * 2); c.fill();
          c.lineWidth = 5; c.stroke();
          c.fillStyle = '#2b2140'; c.beginPath(); c.arc(cx + s * 50 + 3, cy - 2, 10, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx + s * 50 + 6, cy - 6, 3, 0, Math.PI * 2); c.fill();
        }
        c.lineWidth = 7;
        if (modo === 'sonrie') { c.beginPath(); c.arc(cx, cy + 30, 34, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
        else { c.beginPath(); c.ellipse(cx, cy + 52, 8, 11, 0, 0, Math.PI * 2); c.stroke(); }
      }
    });
    const caras = {};
    const mat = new T.MeshStandardMaterial({ roughness: 1, emissive: new T.Color('#ffe9c2'), emissiveIntensity: op.brillo != null ? op.brillo : 0.9 });
    const mesh = new T.Mesh(new T.SphereGeometry(r, 64, 40), mat);
    mesh.userData.poner = modo => {
      if (!caras[modo]) caras[modo] = cara(modo);
      mat.map = caras[modo]; mat.emissiveMap = caras[modo]; mat.needsUpdate = true;
    };
    mesh.userData.poner(op.modo || 'dormida');
    return mesh;
  };

  /** Reloj de mesa (mira a +z). Devuelve { grupo, fijar(horas, minutos) } */
  kit.reloj = (r, op = {}) => {
    const g = new T.Group();
    const cuerpo = new T.Mesh(new T.CylinderGeometry(r, r, r * 0.45, 48), kit.pintura(op.color || '#9c86c8', { metalness: 0.15 }));
    cuerpo.rotation.x = Math.PI / 2;
    g.add(cuerpo);
    const esfera = kit.textura(256, 256, (c, w) => {
      c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#2b2140'; c.lineCap = 'round';
      for (let i = 0; i < 60; i++) {
        const a = i / 60 * Math.PI * 2, big = i % 5 === 0;
        c.lineWidth = big ? 5 : 2;
        const r0 = w * (big ? 0.36 : 0.41), r1 = w * 0.45;
        c.beginPath(); c.moveTo(w / 2 + Math.sin(a) * r0, w / 2 - Math.cos(a) * r0); c.lineTo(w / 2 + Math.sin(a) * r1, w / 2 - Math.cos(a) * r1); c.stroke();
      }
    });
    const cara = new T.Mesh(new T.CircleGeometry(r * 0.86, 48), new T.MeshStandardMaterial({ map: esfera, roughness: 0.6 }));
    cara.position.z = r * 0.226;
    g.add(cara);
    const vidrio = new T.Mesh(new T.CircleGeometry(r * 0.88, 48), new T.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.05, clearcoat: 1 }));
    vidrio.position.z = r * 0.25;
    g.add(vidrio);
    const aguja = (largo, grosor) => {
      const geo = new T.BoxGeometry(grosor, largo, grosor * 0.5);
      geo.translate(0, largo / 2 - grosor, 0);
      const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: '#2b2140', roughness: 0.5 }));
      m.position.z = r * 0.235;
      g.add(m);
      return m;
    };
    const horas = aguja(r * 0.48, r * 0.07), minutos = aguja(r * 0.72, r * 0.05);
    if (op.campanas !== false) {
      for (const s of [-1, 1]) {
        const c = new T.Mesh(new T.SphereGeometry(r * 0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), kit.metal('#e8cf96'));
        c.position.set(s * r * 0.55, r * 0.92, 0);
        c.rotation.z = -s * 0.5;
        g.add(c);
        const pata = new T.Mesh(new T.CylinderGeometry(r * 0.05, r * 0.05, r * 0.4, 8), kit.metal('#e8cf96'));
        pata.position.set(s * r * 0.55, -r * 1.02, 0);
        pata.rotation.z = s * 0.4;
        g.add(pata);
      }
    }
    kit.sombra(g);
    return {
      grupo: g,
      fijar(h, m) { horas.rotation.z = -(h / 12) * Math.PI * 2; minutos.rotation.z = -(m / 60) * Math.PI * 2; },
    };
  };

  // materiales compartidos de las ovejas
  let matsOveja = null;
  function materialesOveja() {
    if (matsOveja) return matsOveja;
    matsOveja = {
      lana: kit.tela('#f8f3f1', { sheenColor: new T.Color('#ffffff'), sheenRoughness: 0.7 }),
      lanaMala: kit.tela('#b7a8b2', { sheenColor: new T.Color('#e5c9d6') }),
      cara: new T.MeshStandardMaterial({ color: '#4a4152', roughness: 0.75 }),
      caraMala: new T.MeshStandardMaterial({ color: '#1e141f', roughness: 0.6 }),
      ojo: new T.MeshStandardMaterial({ color: '#111', roughness: 0.2 }),
      ojoMalo: kit.luz('#ff2238', 6),
    };
    return matsOveja;
  }
  /** Oveja de lana (mira a +x). op: { malvada, semilla } */
  kit.oveja = (op = {}) => {
    const mt = materialesOveja();
    const g = new T.Group();
    const rnd = S.azar(op.semilla || 3);
    const lana = op.malvada ? mt.lanaMala : mt.lana;
    const bola = new T.SphereGeometry(1, 20, 14);
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2, b = (rnd() - 0.5) * Math.PI * 0.9;
      const m = new T.Mesh(bola, lana);
      const r = 0.14 + rnd() * 0.08;
      m.scale.setScalar(r);
      m.position.set(Math.cos(a) * Math.cos(b) * 0.3, 0.56 + Math.sin(b) * 0.16, Math.sin(a) * Math.cos(b) * 0.17);
      g.add(m);
    }
    const nucleo = new T.Mesh(bola, lana); nucleo.scale.set(0.4, 0.26, 0.26); nucleo.position.y = 0.56; g.add(nucleo);
    const cabeza = new T.Group();
    const craneo = new T.Mesh(bola, op.malvada ? mt.caraMala : mt.cara);
    craneo.scale.set(0.15, 0.13, 0.12);
    cabeza.add(craneo);
    for (const s of [-1, 1]) {
      const oreja = new T.Mesh(bola, op.malvada ? mt.caraMala : mt.cara);
      oreja.scale.set(0.035, 0.03, 0.08); oreja.position.set(-0.03, 0.05, s * 0.13); oreja.rotation.x = s * 0.5;
      cabeza.add(oreja);
      const ojo = new T.Mesh(bola, op.malvada ? mt.ojoMalo : mt.ojo);
      ojo.scale.setScalar(op.malvada ? 0.026 : 0.022); ojo.position.set(0.1, 0.035, s * 0.06);
      cabeza.add(ojo);
    }
    for (let i = 0; i < 3; i++) {
      const m = new T.Mesh(bola, lana); m.scale.setScalar(0.06); m.position.set(-0.04 + i * 0.03, 0.12, (i - 1) * 0.05); cabeza.add(m);
    }
    cabeza.position.set(0.44, 0.66, 0);
    g.add(cabeza);
    const pataGeo = new T.CylinderGeometry(0.035, 0.03, 0.4, 8);
    const patas = [];
    for (const [x, z] of [[0.2, 0.1], [0.2, -0.1], [-0.2, 0.1], [-0.2, -0.1]]) {
      const p = new T.Mesh(pataGeo, op.malvada ? mt.caraMala : mt.cara);
      p.position.set(x, 0.2, z);
      g.add(p); patas.push(p);
    }
    kit.sombra(g, true, false);
    g.userData = { cabeza, patas };
    return g;
  };

  /** Manta con pliegues que cae por los lados y los pies */
  function manta(W, Lz, caida, mat) {
    const r = 0.07, curva = r * Math.PI / 2;
    const totalW = W + 2 * (curva + caida), totalL = Lz + curva + caida;
    const geo = new T.PlaneGeometry(totalW, totalL, 72, 60);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const dobla = s => {
      if (s <= 0) return [0, 0];
      if (s < curva) { const a = s / r; return [r * Math.sin(a), -(r - r * Math.cos(a))]; }
      return [r, -r - (s - curva)];
    };
    for (let i = 0; i < pos.count; i++) {
      const x0 = pos.getX(i), z0 = pos.getZ(i) + totalL / 2; // z0: 0 en la cabecera
      const pl = 0.028 * Math.sin(x0 * 5.3 + z0 * 2.1) + 0.016 * Math.sin(z0 * 7.7 + x0 * 1.9) + 0.012 * Math.sin(x0 * 11 - z0 * 3);
      const [dx, dy] = dobla(Math.abs(x0) - W / 2);
      const [dz, dy2] = dobla(z0 - Lz);
      const x = Math.abs(x0) > W / 2 ? Math.sign(x0) * (W / 2 + dx) : x0;
      const z = z0 > Lz ? Lz + dz : z0;
      const borde = Math.max(0, 1 - Math.max(Math.abs(x0) - W / 2, z0 - Lz, 0) * 3);
      pos.setXYZ(i, x + (Math.abs(x0) > W / 2 ? Math.sign(x0) * pl * 0.6 : 0), dy + dy2 + pl * borde, z);
    }
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, mat);
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  /** Cama (cabecero hacia -z). op: { madera, manta, sabana } */
  kit.cama = (op = {}) => {
    const g = new T.Group();
    const W = 1.55, L = 2.3;
    const mad = kit.madera(op.madera || '#c9a184');
    const base = kit.caja(W + 0.1, 0.3, L + 0.1, mad, { r: 0.05 }); base.position.y = 0.33; g.add(base);
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const p = kit.caja(0.09, 0.2, 0.09, mad, { r: 0.02 }); p.position.set(x * (W / 2 - 0.02), 0.1, z * (L / 2 - 0.02)); g.add(p);
    }
    const cab = kit.caja(W + 0.14, 1.15, 0.1, mad, { r: 0.05 }); cab.position.set(0, 0.78, -L / 2 - 0.03); g.add(cab);
    const pie = kit.caja(W + 0.14, 0.62, 0.08, mad, { r: 0.04 }); pie.position.set(0, 0.5, L / 2 + 0.03); g.add(pie);
    const colchon = kit.caja(W, 0.26, L, kit.tela(op.sabana || '#fbf8f6'), { r: 0.1, seg: 4 }); colchon.position.y = 0.61; g.add(colchon);
    for (const s of [-1, 1]) {
      const alm = kit.caja(0.68, 0.17, 0.46, kit.tela('#ffffff'), { r: 0.08, seg: 4 });
      alm.position.set(s * 0.37, 0.82, -L / 2 + 0.33);
      alm.rotation.set(-0.12, s * 0.04, s * 0.03);
      alm.scale.set(1, 1, 1);
      g.add(alm);
    }
    const m = manta(W, L - 0.72, 0.34, kit.tela(op.manta || '#f1b6c6', { side: T.DoubleSide }));
    m.position.set(0, 0.8, -L / 2 + 0.72); // por encima del colchón aunque los pliegues bajen
    g.add(m);
    return g;
  };

  /** Lámpara de mesilla con luz real. Devuelve { grupo, luz, set(0..1) } */
  kit.lampara = (op = {}) => {
    const g = new T.Group();
    const base = new T.Mesh(new T.CylinderGeometry(0.14, 0.17, 0.05, 32), kit.metal('#e4c58e'));
    base.position.y = 0.025; g.add(base);
    const pie = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.42, 12), kit.metal('#e4c58e'));
    pie.position.y = 0.24; g.add(pie);
    const pantallaMat = new T.MeshPhysicalMaterial({ color: op.color || '#f7c4cf', roughness: 0.9, side: T.DoubleSide, sheen: 1, sheenColor: new T.Color('#fff'), emissive: new T.Color('#ffb67a'), emissiveIntensity: 0.8, transmission: 0.25, thickness: 0.05 });
    const pantalla = new T.Mesh(new T.CylinderGeometry(0.15, 0.24, 0.27, 40, 1, true), pantallaMat);
    pantalla.position.y = 0.52; g.add(pantalla);
    const bombillaMat = kit.luz('#ffd9a0', 4);
    const bombilla = new T.Mesh(new T.SphereGeometry(0.05, 16, 12), bombillaMat);
    bombilla.position.y = 0.48; g.add(bombilla);
    const luz = new T.PointLight('#ffc78a', 3, 7, 2);
    luz.position.y = 0.48; g.add(luz);
    kit.sombra(g, true, true);
    pantalla.castShadow = false;
    const base0 = bombillaMat.color.clone();
    return {
      grupo: g, luz, pantalla,
      set(v, fuerza = 3) {
        luz.intensity = v * fuerza;
        pantallaMat.emissiveIntensity = 0.1 + v * 1.2;
        bombillaMat.color.copy(base0).multiplyScalar(0.15 + v * 0.85);
      },
    };
  };

  /** Puerta con marco, bisagra y luz detrás. Devuelve { grupo, abrir(bool), actualizar(dt) } */
  kit.puerta = (op = {}) => {
    const W = op.w || 1.05, H = op.h || 2.15;
    const g = new T.Group();
    const marcoMat = kit.pintura(op.marco || '#f6eee8');
    const izq = kit.caja(0.12, H + 0.12, 0.22, marcoMat, { r: 0.02 }); izq.position.set(-W / 2 - 0.06, (H + 0.12) / 2, 0);
    const der = izq.clone(); der.position.x = W / 2 + 0.06;
    const sup = kit.caja(W + 0.36, 0.12, 0.22, marcoMat, { r: 0.02 }); sup.position.set(0, H + 0.06, 0);
    g.add(izq, der, sup);
    const portal = new T.Mesh(new T.PlaneGeometry(W, H), kit.luz(op.luz || '#ffe6b5', op.fuerza || 2.6));
    portal.position.set(0, H / 2, -0.07);
    g.add(portal);
    const bisagra = new T.Group();
    bisagra.position.set(-W / 2, 0, 0);
    g.add(bisagra);
    const hojaMat = kit.pintura(op.color || '#a890d8');
    const hoja = kit.caja(W - 0.02, H - 0.02, 0.07, hojaMat, { r: 0.02 });
    hoja.position.set(W / 2, H / 2, 0);
    bisagra.add(hoja);
    for (const [y, h] of [[H * 0.7, H * 0.36], [H * 0.27, H * 0.3]]) {
      const pan = kit.caja(W * 0.68, h, 0.03, hojaMat, { r: 0.015 });
      pan.position.set(W / 2, y, 0.04);
      bisagra.add(pan);
    }
    const pomo = new T.Mesh(new T.SphereGeometry(0.045, 16, 12), kit.metal('#e8cc8e'));
    pomo.position.set(W - 0.12, H * 0.47, 0.08);
    bisagra.add(pomo);
    kit.sombra(g);
    portal.castShadow = false;
    let objetivo = op.abierta || 0, ang = objetivo;
    return {
      grupo: g, hoja, bisagra,
      abrir(v) { objetivo = typeof v === 'number' ? v : (v ? 1 : 0); },
      actualizar(dt) { ang = S.amort(ang, objetivo, 3.2, dt); bisagra.rotation.y = -ang * 1.95; },
    };
  };
})();
