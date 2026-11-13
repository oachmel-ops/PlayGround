# Umbral de Ceniza

**Umbral de Ceniza** es una aventura de acción 2D con exploración metroidvania y fantasía oscura, creada como juego web instalable.

## Jugar

Abre `index.html` en un navegador moderno o sirve esta carpeta en un servidor web. No necesita dependencias ni compilación.

- **Windows:** mueve con `←` / `→` o `A` / `D`; salta con `Espacio`; ataca con `J` / `X`; esquiva con `K` / `C`; lanza magia con `L` / `V`.
- **Android:** abre el juego en Chrome y usa los controles táctiles; desde el menú del navegador se puede instalar como aplicación web (PWA).

El juego incluye una introducción de historia, tres brasas coleccionables, enemigos, combate cuerpo a cuerpo y magia, santuarios, un jefe final y controles adaptados a móvil.

## APK y Windows

Esta entrega es multiplataforma en navegador y PWA instalable; no incluye todavía un APK firmado ni un instalador `.exe`. Para generar APK/paquete de escritorio hay que envolver la aplicación web con Capacitor (Android) y Tauri o Electron (Windows), y compilar/firma en los entornos correspondientes.
