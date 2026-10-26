# Distribuidora Pueyrredón · web mayorista

Sitio para comercios: https://distribuidora-pueyrredon.github.io

- **Inicio** (`index.html`): presentación y rubros.
- **Catálogo** (`catalogo/`): el catálogo de la base `malbeldas/catalogo-web`, armado con `scripts/alta.mjs` en una subcarpeta. Los productos salen de la planilla de Google "Distribuidora Pueyrredón" (pestañas `Web` y `Ajustes` publicadas, links en `catalogo/tienda.json`), **sin precios**. El comercio arma una consulta y la manda por WhatsApp al 11 7603-3649. `catalogo/core/` no se edita acá: se actualiza desde la base. La tarea `respaldo` guarda cada 6 horas la última copia buena en `catalogo/catalogo-respaldo.json`. `catalogo.html` redirige al nuevo, también los links viejos con `#r=` o `#q=`.
- **Probador** (`probador.html`): el comercio sube una foto de su cliente, ubica productos a medida real, los ve prendidos de noche y descarga una imagen con los datos de SU comercio (sin nuestra marca).

Es un sitio estático publicado con GitHub Pages desde la rama `main`. Las páginas se generan con un script a partir de nuestras listas en PDF; `catalogo.json` es la lista anterior: la usan las páginas de rubros, el catálogo ya no.

Medición de uso: poner el ID de Google Analytics en `assets/comun.js` (`GA_ID`).
