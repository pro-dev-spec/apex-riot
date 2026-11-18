# Créditos de los modelos 3D

Los archivos `assets/models/*.apxc` son versiones **simplificadas** (para la web) de modelos 3MF
hechos por terceros. Se generan con `python tools/build_models_3mf.py <carpeta_con_3mf> assets/models`.

| Archivo | Modelo original | Autor | Licencia |
|---|---|---|---|
| `jersey-stripes.apxc` | Jersey de fútbol (solo cuerpo, rayas, cuello y puños; se omiten escudo y nombre). En el sitio lleva el estampado de marca APEX RIOT 07 | Officina Gladiatoria (MakerWorld) | Standard Digital File License |
| `tee-apex.apxc` | Derivado de *Unicorn Shirt – Cute 3D Decoration*: se quitó el unicornio y se añadió un panel liso para el estampado APEX RIOT 21 (`tools/flatten_relief.py`). El original está en `tools/models-src/tee-unicorn.apxc` y no se publica | Officina Gladiatoria (MakerWorld) | Standard Digital File License |
| `goggles-brick.apxc` | Brick Mountainbike/Motocross Goggles 5:1 ratio | The_Lions_Claw | CC BY-NC-SA |

## Personalización de marca
Los estampados (logo A, «APEX RIOT», 07 y 21) son del equipo. Se generan con
`python tools/build_decals.py` en `assets/img/decals/` y el visor 3D los proyecta sobre el modelo.

## Antes de publicar
- **Gafas (BY-NC-SA):** exige atribución, uso **no comercial** y compartir igual. Sirve para un proyecto académico; mantén este crédito visible.
- **Jersey y camiseta (Standard Digital File License):** es una licencia de uso personal que normalmente **no permite redistribuir los archivos**. Como los `.apxc` son derivados del modelo, no los subas a un repositorio público sin permiso del autor: usa un repositorio privado o reemplázalos por modelos propios.
- Los productos (nombres, precios, marca APEX RIOT) son ficticios.
