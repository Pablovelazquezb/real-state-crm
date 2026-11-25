# Welcome to Real Estate CRM: Empowering Real Estate Agents with Modern CRM Tools

Real Estate CRM is an innovative Customer Relationship Management (CRM) solution designed exclusively for Real Estate Agents. Streamline your workflow, enhance client interactions, and boost your business with our feature-packed CRM.

## **Explore our repository to discover**

1. Intuitive Interface: A user-friendly dashboard tailored to the needs of Real Estate professionals.
2. MERN Stack Powered: Built on the robust MERN (MongoDB, Express, ReactJS, Node.js) stack for high performance.
3. Customization: Open-source architecture allows you to tailor the CRM to your unique requirements.
4. Responsive Design: Access your CRM anytime, anywhere, from any device.
5. Seamless Communication: Foster better client relationships with integrated communication tools.

Ready to revolutionize your Real Estate business? Dive into our documentation below and take the first step towards enhancing your productivity.

## **Demo**

Here are the demo link credentials.

https://real-estate-crm-jet.vercel.app/

**Admin access:**
Username: admin@gmail.com
Password: admin123

**Regular access:**
Username: user@gmail.com
Password: user123

## **Installation**

Getting started with RealEstateCRM is a breeze. Follow our comprehensive installation guide to set up the CRM in your local environment. Whether you're an experienced developer or new to the stack, our step-by-step instructions will have you up and running in no time.

[Installation Guide](https://github.com/prolinkinfo/RealEstateCRM/discussions/2)

## **Contributing**

We believe in the power of collaboration! Join us in making RealEstateCRM even better. Whether you're a developer, designer, or Real Estate enthusiast, your contributions are invaluable. Check out our contribution guidelines and dive into our codebase.

Contribution Guidelines

## **Support**

We're here to support your journey with RealEstateCRM. If you have questions, encounter issues, or need assistance, don't hesitate to reach out. Our responsive support team is dedicated to helping you succeed.

For support inquiries, email us at: prolinkinfotechh@gmail.com

## **License**

RealEstateCRM is released under the MIT License. Feel free to use, modify, and distribute the software in accordance with the license terms.

## **Keeping in Touch**

We value your feedback and ideas. If you have suggestions for new features or customization options, we'd love to hear from you. Let's work together to shape the future of RealEstateCRM.

Contact us at: prolinkinfotechh@gmail.com

## **Social Media**

Stay connected with us on social media for the latest updates, tips, and community discussions. Join our growing network of Real Estate professionals using RealEstateCRM to elevate their business.

---

# Nova CRM — notas de esta instalación

## Módulo Prospector Facebook

El extinto proyecto `facebook group scrapper` (Streamlit + Python) ya vive dentro del CRM
como un módulo nativo en React + Express, visible en el menú como **Prospector FB**.

- **Prospectos**: publicaciones de grupos de Facebook clasificadas por intención
  (ofrece renta/venta, busca rentar/comprar, roomie), zona, precio, teléfono y score.
- **Cruces**: matchmaking automático entre demanda y oferta (y entre roomies), con el
  pitch de WhatsApp listo para enviar.
- **Grupos**: sectores y grupos de Facebook configurables (se migraron los 18 grupos
  originales de Monterrey) y extracción por sector.
- **Actividad**: extracciones en segundo plano con bitácora y métricas.
- **Ajustes**: token de Apify, llave de Gemini, verificación de conexiones e importación
  del catálogo histórico (46 publicaciones reales).

Los prospectos se guardan en MongoDB local (`FacebookLeads`) y el botón **Enviar al CRM**
crea el Lead correspondiente en Supabase (módulo *Leads*). Requiere un token válido de
[Apify](https://apify.com) para lanzar extracciones nuevas.

## Despliegue en Raspberry Pi

Guía completa: [DESPLIEGUE.md](DESPLIEGUE.md) — un solo proceso de Node sirve la interfaz
compilada y la API en el puerto 5001, con proxy HTTPS (Caddy) para tu dominio.

```bash
npm --prefix server install
npm --prefix client install
npm run build
npm run serve
```

## Panel del empleado

Los usuarios con un rol distinto a `superAdmin` (por ejemplo **Empleado**) entran a un
panel pensado para prospectar, no al dashboard administrativo:

- **Mi panel**: saludo, prospectos calientes del día con WhatsApp en un clic,
  cruces listos, actividad de extracciones y grupos monitoreados.
- **Prospector FB**: extractor, bandeja de prospectos, cruces, grupos y ajustes.
- El menú se arma según el rol: lo que no está habilitado en **Roles** no aparece.
- El perfil propio (`Mi perfil`, menú del avatar) muestra el rol asignado y permite
  editar nombre y teléfono (el rol y el correo solo los cambia un super administrador).

## Arranque local / producción

```bash
./scripts/nova.sh start     # compila si hace falta y arranca en http://localhost:5001
./scripts/nova.sh status
./scripts/nova.sh logs
./scripts/nova.sh stop
```

El servidor corre en un solo proceso (API + interfaz compilada) con reinicio limpio.
Si el puerto 5001 no responde, revisa `logs/nova-crm.log` y vuelve a lanzar el script.

### Si la página no carga (ERR_CONNECTION_REFUSED)

El proceso de Node no está escuchando en el puerto 5001. Verifica y reinicia:

```bash
./scripts/nova.sh status
./scripts/nova.sh restart
./scripts/nova.sh logs     # en otra terminal, para ver el detalle
```

El arranque ya sincroniza índices de Mongo después de conectar y no permite que una
sesión de Supabase (UUID) tumbe el servidor con un CastError; si algo falla, el log
queda en `logs/nova-crm.log`.

## Menú simplificado y diseño 2026

El CRM quedó enfocado en la operación inmobiliaria. El menú ahora muestra solo:

| Sección | Módulos |
| --- | --- |
| Operación | Inicio (resumen de cartera y prospección) |
| Prospección | Prospector FB |
| Cartera | Propiedades · Leads · Contactos |
| Administración | Usuarios · Roles |

Los módulos heredados (oportunidades, facturas, cuentas, tareas, juntas, llamadas,
correos, plantillas, pagos, documentos, reportes y las pantallas de configuración
avanzada) **quedan ocultos del menú** con `hidden: true` en `client/src/routes.js`.
Siguen existiendo por si algún enlace interno los usa; para eliminarlos por completo
basta con borrar su entrada en ese archivo.

Rediseño visual: paleta slate + índigo, tipografía Inter / Plus Jakarta Sans, tarjetas
con borde suave (radio 16 px), sidebar con secciones y colapsable, barra superior
delgada con el título de la página, tablas con encabezado pegajoso, badges de estado,
estados vacíos ilustrados, paginación compacta y pantalla de acceso renovada.

## Landing pública (`/portal`)

El catálogo de clientes se alimenta del CRM con un endpoint abierto y de solo lectura:

- `GET /api/public/properties` → propiedades publicadas + zonas detectadas.
- `GET /api/public/properties/:id` → ficha individual.
- `POST /api/public/inquiry` → solicitud de asesoría (crea un Lead con origen "Portal de clientes").

No hay datos de ejemplo: si el CRM no tiene inventario, la landing muestra un estado
vacío con llamada a la acción. Los filtros (texto, tipo, zona, presupuesto) se ejecutan
en el navegador sobre el inventario real, los tipos se normalizan a español
(Departamento, Casa, Residencial, Comercial…) y las fotos usan `property_photos`
cuando existe la columna; si no, se muestra una imagen de respaldo cuidada.
