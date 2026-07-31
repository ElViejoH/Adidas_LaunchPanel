# QA visual final

## Resultado

La revisión visual queda aprobada para el alcance local del reto. Se inspeccionaron las vistas principales en escritorio a 1440 × 900 y el dashboard administrativo en móvil a 390 × 844.

| Vista | Comprobaciones | Resultado |
| --- | --- | --- |
| Login | Imagen completa en el panel izquierdo, logo legible, formulario, roles y selector de idioma | Aprobado |
| Dashboard del creador | Jerarquía, métricas, tarjetas, acciones y sidebar | Aprobado |
| Listado | Filtros, tabla, badges, acciones y contador de resultados | Aprobado |
| Calendario | Navegación mensual, filtros, cuadrícula, eventos y fecha actual | Aprobado |
| Detalle | Acciones, datos principales, assets, flujo e historial | Aprobado |
| Usuarios y permisos | Colores por rol, filtros, tabla y texto de seguridad | Aprobado |
| Dashboard móvil | Menú, selector de idioma, CTA, métricas, tarjetas y panel de permisos | Aprobado |

## Criterios transversales

- No se detectó desbordamiento horizontal en las capturas de escritorio ni móvil.
- Las imágenes cargaron sin enlaces rotos.
- Las fuentes terminaron de cargar antes de cada captura.
- Los encabezados, CTA y etiquetas no presentan recortes ni saltos problemáticos.
- El selector `ES / EN` permanece visible en la esquina superior derecha.
- Los roles conservan el sistema solicitado: administrador dorado, aprobador negro y creador blanco.
- Los controles interactivos mantienen estados de hover, foco visible y contraste consistente con el sistema actual.

## Ajustes realizados durante el QA

1. Se eliminó la repetición del total en el listado, que mostraba `4 4 resultados`.
2. Se corrigió la capitalización de la fecha larga en español para conservar preposiciones en minúscula.

Las capturas finales y el recorrido están disponibles en la [guía de demostración](demo-guide.md).
