# Administración de promociones

## Instalación

Usar el proyecto existente del receptor de solicitudes, que ya cuenta con acceso a la planilla y envío de correos. No reemplazar sus funciones de solicitudes, métricas o suscripciones.

1. Añadir `merchant-admin.gs` como archivo de secuencia de comandos y `Administrar.html` como HTML.
2. Añadir **al comienzo** de `doGet(e)`: `if(e && e.parameter && e.parameter.merchant==='1') return merchantPage_(e.parameter);`
3. Ejecutar `prepararAdministracionNegocios`. No envía correos. Crea tres pestañas privadas. No incluirlas en ningún endpoint público ni compartir la planilla con los comercios.
4. Actualizar la implementación existente con una nueva versión (ejecuta como propietario; acceso público). No crear permisos públicos nuevos para la planilla ni registrar contraseñas.
5. Las solicitudes con estado `Aprobada` vinculan el ID del negocio con su correo privado. Para fichas manuales, agregar una fila en `GESTORES_NEGOCIOS`: ID, correo verificado, Sí. Una asignación explícita reemplaza la solicitud anterior. `No` revoca el acceso inmediatamente.
6. Probar con dos negocios y correos de prueba controlados: solicitud, recepción de enlace, uso único, expiración, aislamiento entre negocios, guardar, pausar, reactivar, retirar y cerrar sesión. No enviar pruebas a comerciantes ni alterar promociones reales.
7. Solo tras probar: publicar `/administrar/` y su enlace en el pie de la web. El enlace de esa página apunta al receptor existente con `?merchant=1`. No requiere cambiar la configuración pública ni los permisos de la planilla.

Una sola promoción por ficha, sin fotos ni cambios de datos base en esta versión. No existe recuperación de correo sin revisión de administración. El enlace dura 20 minutos y la sesión 60; no se consumen enlaces al abrirlos, sino al tocar Entrar. Un acceso nuevo invalida las sesiones previas de ese correo. Las credenciales se guardan con hash; el correo de acceso no debe compartirse. La aplicación privada no carga recursos de terceros. Sesión en memoria, sin cookies persistentes. Al recargar el panel, solicitar otro enlace.

Los límites son cuatro solicitudes por correo/día, 90 segundos entre solicitudes y cuarenta globales/día. Las respuestas de solicitud no revelan si existe el responsable. La hoja GESTORES_NEGOCIOS es editable solo por la administración. La auditoría conserva las versiones para recuperación administrativa; retirar una promoción no borra la ficha ni su historial. En la web las fechas se evalúan según Uruguay, inclusive el último día. Las páginas abiertas pueden mostrar datos previos hasta su próxima actualización (caché pública de hasta tres minutos).

## Pruebas locales

`node scripts/test-merchant-admin.mjs`

Las pruebas usan servicios de Google simulados; no sustituyen la recepción de correo y la verificación de la implementación real.
