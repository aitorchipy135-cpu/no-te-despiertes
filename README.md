# No te despiertes

Un sueño en 7 escenas en 3D realista, hecho con **Three.js (WebGL)**. Lo controlas con el scroll, que [Lenis](https://lenis.darkroom.engineering/) hace suave.

Proyecto de clase hecho completamente con IA.

## Cómo verlo

Abre `index.html` en un navegador actualizado (Chrome, Edge, Firefox o Safari) y haz scroll despacio: el scroll mueve la cámara a través del sueño.

- Está preparada para abrirse con doble clic. Si tu navegador no la carga así, ábrela con un servidor local (por ejemplo, la extensión *Live Server* de VS Code).
- Hace falta **conexión a internet**: Three.js, Lenis y las fuentes se cargan desde una CDN.
- Al abrirla verás "cerrando los ojos…" unos segundos mientras se construyen las escenas.
- Si el ordenador va justo, la web baja sola la resolución. Para forzar la máxima calidad, añade `?hq` al final de la dirección.

## Las escenas

1. **La cama flotante**: una isla de yeso sobre las nubes, con un estanque que refleja el cielo, ovejas saltando la valla y la luna dormida.
2. **La caída**: caes por un pozo altísimo con ventanas al cielo, entre almohadas, relojes, puertas y plumas.
3. **La habitación sin paredes**: un suelo de baldosas brillantes en el cielo, puertas flotando y una escalera de caracol que no lleva a ninguna parte.
4. **El pasillo infinito**: arcos de colores sobre agua quieta; la puerta del fondo nunca se acerca.
5. **El mar de arriba**: el mar es el techo, los peces nadan por el aire y la luz dibuja cáusticas en la arena.
6. **Se deshace**: la pesadilla. La isla se rompe, las ovejas tienen los ojos rojos y un ojo gigante te sigue.
7. **El despertar**: un dormitorio de verdad, por la mañana… ¿de verdad te has despertado?

## Cosas que puedes tocar

El cursor crece y te dice qué hacer cuando pasas por encima de algo que reacciona.

- La **luna** (escena 1): pásale el ratón por encima.
- La **lámpara** de la mesilla (escena 1): haz clic y se hace de noche.
- Las **puertas** (escenas 1 y 3): se abren al pasar por encima.
- Los **peldaños** de la escalera (escena 3): suben al pasar el ratón.
- El **reloj de pie** (escena 3): mira qué pasa en el cuadro. Y el cuadro acelera el reloj.
- La **puerta del fondo** (escena 4): intenta tocarla.
- Las **medusas** y la **caracola** (escena 5): la caracola sube y baja la marea.
- El **ojo** (escena 6): sigue a tu cursor.
- El **despertador** (escena 7): pospón la alarma.

Los **textos** también reaccionan: entran letra a letra, se apartan del cursor, se inclinan con la velocidad del scroll y en la pesadilla se desordenan y tiemblan.

## Cómo está hecho

```
index.html            estructura: canvas 3D, textos, HUD, cursor y pantalla de carga
css/sueno.css         estilos de la capa de textos e interfaz
js/nucleo.js          espacio de nombres compartido y utilidades
js/kit.js             piezas reutilizables: yeso, cielo, agua que refleja, nubes,
                      cristal, luna, relojes, ovejas, cama, lámpara, puertas…
js/escenas/*.js       una escena por archivo
js/textos.js          animaciones e interacciones de los textos
js/motor.js           render, postproceso, scroll con Lenis, cámara e interacción
```

- **Todo está generado con código**: no hay modelos 3D ni imágenes. Las texturas (baldosas, madera, la luna, el cuadro, el ojo…) se dibujan con `<canvas>`.
- **Realismo**: materiales físicos (yeso con relieve, telas con brillo, cristal iridiscente, madera barnizada), luz de sol con sombras suaves, iluminación del cielo (mapas de entorno), niebla y agua que refleja la escena de verdad (`Reflector`).
- **Postproceso**: bloom, grano de película, aberración cromática, viñeta, el glitch de la pesadilla y la "disolución" entre escenas.
- **Cámara**: cada escena tiene una ruta de puntos clave. El progreso del scroll decide en qué escena estás y por dónde va la cámara, y el ratón añade un poco de paralaje.
- **Interacción**: *raycasting* desde el cursor hacia los objetos 3D.
- Son scripts clásicos (no módulos) para que la página funcione abriendo el archivo con doble clic. Three.js se importa con `import()` usando un *import map*.
