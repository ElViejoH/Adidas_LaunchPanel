# Guía breve de demostración

Esta guía propone un recorrido de 6 a 8 minutos por las capacidades principales del panel.

El resultado de la inspección de escritorio y móvil se documenta en [QA visual final](qa-visual.md).

## Preparación

1. Inicia la API en `http://localhost:4000`.
2. Inicia el frontend en `http://localhost:5173`.
3. Usa cualquiera de estas cuentas locales con la contraseña `password123`:

| Perfil | Correo |
| --- | --- |
| Creador | `creator@adidas.com` |
| Aprobador | `approver@adidas.com` |
| Administrador | `admin@adidas.com` |

La base semilla incluye lanzamientos en distintos estados, mercados y fechas.

## Recorrido sugerido

1. **Login e idioma.** Muestra la campaña visual de la zona izquierda, selecciona una cuenta de demostración y cambia entre `ES` y `EN` desde la esquina superior derecha.
2. **Dashboard del creador.** Explica los indicadores, próximos lanzamientos y tareas disponibles. Entra como creador y selecciona **Nuevo lanzamiento**.
3. **Creación y assets.** Completa nombre, descripción, mercado y fecha. Guarda el borrador, agrega un asset por URL y usa **Enviar a revisión**.
4. **Filtros y calendario.** Abre **Lanzamientos** y combina búsqueda, mercado, estado y fechas. Luego abre **Calendario** para localizar el lanzamiento y entrar a su detalle.
5. **Flujo de aprobación.** Cierra sesión, entra como aprobador y abre el lanzamiento enviado. Demuestra **Solicitar cambios** o **Aprobar lanzamiento**. Si lo apruebas, completa con **Publicar lanzamiento**.
6. **Trazabilidad.** En el detalle, señala el historial de estados, el responsable de cada cambio y sus comentarios.
7. **Administración.** Entra como administrador, abre **Usuarios y permisos** y cambia el rol de una cuenta que no sea la propia. Explica que la API vuelve a validar el permiso.
8. **Responsive.** Reduce el ancho de la ventana para mostrar el menú móvil y comprobar que el selector de idioma sigue disponible.

## Capturas de referencia

| Vista | Evidencia |
| --- | --- |
| Login | [01-login.png](screenshots/01-login.png) |
| Dashboard del creador | [02-dashboard-creador.png](screenshots/02-dashboard-creador.png) |
| Listado y filtros | [03-listado-lanzamientos.png](screenshots/03-listado-lanzamientos.png) |
| Calendario | [04-calendario.png](screenshots/04-calendario.png) |
| Detalle | [05-detalle-lanzamiento.png](screenshots/05-detalle-lanzamiento.png) |
| Usuarios y permisos | [06-usuarios-permisos.png](screenshots/06-usuarios-permisos.png) |
| Dashboard móvil | [07-dashboard-admin-movil.png](screenshots/07-dashboard-admin-movil.png) |

## Regenerar las capturas

Las capturas usan la base E2E aislada y no modifican `backend/prisma/dev.db`.

Desde PowerShell:

```powershell
cd frontend
$env:CAPTURE_DEMO = '1'
npx playwright test e2e/demo-capture.spec.js
Remove-Item Env:CAPTURE_DEMO
```

El proceso recrea `docs/screenshots/` con una resolución de escritorio de 1440 × 900 y una vista móvil de 390 × 844.
