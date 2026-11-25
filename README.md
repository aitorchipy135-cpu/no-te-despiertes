# No te despiertes

Un sueño en 7 escenas, en 3D, hecho **solo con HTML y CSS**. Sin una sola línea de JavaScript.

Proyecto de clase hecho completamente con IA.

## Cómo verlo

Abre `index.html` en **Chrome o Edge** y haz scroll despacio: el scroll mueve la cámara a través del sueño.

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

## Cómo funciona (sin JavaScript)

- **La cámara** son variables CSS registradas con `@property` y animadas con `animation-timeline: scroll()`.
- **Los objetos 3D** son cajas de 6 caras colocadas con `rotate` y `translateZ` dentro de `transform-style: preserve-3d`.
- **Las islas** son discos apilados.
- **Luna, nubes, ovejas y estrellas** son *billboards*: giran justo al revés que la cámara para mirarte siempre de frente.
- **Las interacciones** usan `:hover`, `:has()` y el truco del checkbox con `<label>`.
- **El ojo que te sigue** usa una rejilla invisible de celdas y `:has(.celda:hover)`.
