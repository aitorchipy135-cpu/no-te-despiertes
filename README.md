# No te despiertes

Un sueño en 7 escenas, en 3D, hecho con **HTML y CSS**, con una capa de **JavaScript** encima: scroll suave con [Lenis](https://lenis.darkroom.engineering/) y una capa WebGL con [Three.js](https://threejs.org/).

Proyecto de clase hecho completamente con IA.

## Cómo verlo

Abre `index.html` en **Chrome o Edge** y haz scroll despacio: el scroll mueve la cámara a través del sueño.

Three.js y Lenis se cargan desde una CDN, así que hace falta conexión a internet. Sin ella, el sueño sigue funcionando igual, solo con CSS.

## Las escenas

1. **La cama flotante**: una isla en el cielo, ovejas saltando una valla y una luna dormida.
2. **La caída**: caes por un pozo de almohadas, relojes y puertas.
3. **La habitación sin paredes**: puertas flotantes y una escalera que no lleva a ninguna parte.
4. **El pasillo infinito**: la puerta del fondo nunca se acerca.
5. **El mar de arriba**: el mar está en el techo y los peces vuelan.
6. **Se deshace**: la pesadilla. El mundo se desmonta y un ojo te sigue.
7. **El despertar**: ¿de verdad te has despertado?

## Cosas que puedes tocar

- La **luna** (escena 1): pásale el ratón por encima.
- La **lámpara** de la mesilla (escena 1): apaga la luz.
- El **reloj de pie** (escena 3): mira qué pasa en el cuadro.
- Las **puertas** (escenas 1, 3 y 4): ábrelas.
- La **caracola** (escena 5): baja la marea.
- El **ojo** (escena 6): te sigue a donde vayas.
- El **orbe del sueño** (todas): mueve el ratón y haz scroll rápido para verlo deformarse.

## Cómo funciona

### El mundo (HTML + CSS)

- **La cámara** son variables CSS registradas con `@property` y animadas con `animation-timeline: scroll()`.
- **Los objetos 3D** son cajas de 6 caras colocadas con `rotate` y `translateZ` dentro de `transform-style: preserve-3d`.
- **Las islas** son discos apilados.
- **Luna, nubes, ovejas y estrellas** son *billboards*: giran justo al revés que la cámara para mirarte siempre de frente.
- **Las interacciones** usan `:hover`, `:has()` y el truco del checkbox con `<label>`.
- **El ojo que te sigue** usa una rejilla invisible de celdas y `:has(.celda:hover)`.

### La capa JavaScript (`js/sueno.js`)

- **Lenis** suaviza el scroll nativo. Como las animaciones CSS leen el scroll de la página, toda la cámara del sueño se mueve con esa inercia sin cambiar el CSS. El botón *volver a dormir* rebobina el sueño despacio.
- **Three.js** pinta un `<canvas>` transparente encima de las escenas:
  - **El orbe del sueño**: una esfera deformada con ruido simplex en un *shader* propio, con brillo iridiscente tipo pompa de jabón (efecto Fresnel + paleta nacarada). En cada escena cambia de sitio, tamaño y color, se estira con la velocidad del scroll, tiembla al cambiar de escena, se vuelve roja y con saltos en la pesadilla, y **estalla al despertar**.
  - **El polvo de sueño**: partículas que flotan y suben cuando caes. Cuanto más rápido haces scroll, más rápido van.
- Los **textos** se inclinan un poco según la velocidad del scroll.
- Si tienes activado *reducir movimiento* en el sistema, Lenis se desactiva y todo va más despacio.
