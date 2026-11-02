# Integración con facturación electrónica Aliaddo

Para la configuración paso a paso, consulta la
[guía de parametrización de Aliaddo](./guia-parametrizacion-aliaddo.md).

La integración sigue los endpoints de Aliaddo/Orka descritos en
[`facturación electronica.txt`](./facturación%20electronica.txt). Cada empresa
configura su cuenta y resolución en **Settings → Electronic Invoicing (Aliaddo)**.
Al completar una venta POS, la aplicación genera y envía la factura con la venta,
el comprador y sus productos.

## Configuración

En el panel de parametrización se configuran el token (cifrado en la base de
datos y nunca devuelto al navegador), URL HTTPS, modo, tipo de documento,
prefijo y consecutivo, códigos de moneda/impuestos/unidad, ubicación de sucursal,
valores fiscales predeterminados del comprador y resolución DIAN. La URL de
pruebas inicial es `https://orka.test.aliaddo.net`; configura la URL de producción
proporcionada por Aliaddo antes de seleccionar `Production`.

Cada ficha de cliente permite guardar identificación tributaria, tipo de persona,
régimen, responsabilidades fiscales y códigos de ubicación DIAN. La factura
automática requiere un cliente asociado con identificación tributaria.

La solicitud al proveedor usa estos encabezados:

```bash
curl --request GET "https://orka.test.aliaddo.net/v2/documents/invoices/{id}" \
  --header "Authorization: Bearer <token-configurado-por-la-empresa>" \
  --header "Content-Type: application/json"
```

La aplicación agrega esos encabezados automáticamente. No llames Aliaddo
directamente desde el navegador ni expongas el token.

## Endpoints de la aplicación

La emisión automática se ejecuta en el servidor después de confirmar cada venta
POS, si la empresa habilitó la integración. Un fallo del proveedor no revierte la
venta ni el inventario; la venta queda marcada como fallida y la aplicación
muestra un aviso. Las seis rutas de integración manual requieren una sesión
autenticada y verificada. Crear documentos requiere el permiso `create-sales`;
consultarlos requiere `view-sales`. Las solicitudes POST deben enviar
`Content-Type: application/json` y, al usar sesiones web, incluir la protección
CSRF habitual de Laravel.

Las ventas muestran el estado y consecutivo de su factura electrónica. Si una
emisión falla, un usuario con permiso `create-sales` puede reintentarla desde la
lista de ventas después de corregir la configuración o los datos fiscales del
comprador. Las facturas ya emitidas no se duplican al reintentar.

- `POST /integrations/aliaddo/invoices`: crea una factura
  (`POST /v2/documents/invoices` en Aliaddo).
- `GET /integrations/aliaddo/invoices/{uuid}`: consulta por ID.
- `GET /integrations/aliaddo/invoices/find-by-prefix-and-consecutive?prefix=...&consecutive=...`:
  consulta por prefijo y consecutivo.
- `POST /integrations/aliaddo/equivalent-documents`: crea un documento
  equivalente POS (`POST /v2/documents/equivalent-documents`).
- `GET /integrations/aliaddo/equivalent-documents/{uuid}`: consulta por ID.
- `GET /integrations/aliaddo/equivalent-documents/find-by-prefix-and-consecutive?prefix=...&consecutive=...`:
  consulta por prefijo y consecutivo.

El cuerpo de creación es el documento Aliaddo directamente, no un objeto
envolvente. Debe contener `code`, `typeOperation`, `mode` (`Test` o
`Production`), `format`, `prefix`, `consecutive`, `currencyCode`, `customer`,
`lines` y `totals`. Los campos restantes del documento se reenvían sin
transformación. La guía de parametrización incluye los campos requeridos del
contrato `POST /v2/documents/invoices`, las estructuras de resolución, cliente y
detalle, las diferencias entre el contrato del proveedor y las validaciones de
Alfil SaaS, y un ejemplo con marcadores ficticios.

Las respuestas de Aliaddo conservan su código HTTP. La aplicación devuelve
`503` si falta el token y `502` si no puede establecer conexión con el proveedor.
