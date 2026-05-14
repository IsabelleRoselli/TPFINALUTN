CATTLEYA · Tienda de Flores

Descripción del proyecto

CATTLEYA es una plataforma web de administración y venta online pensada para florerías y negocios afines. Ofrece un catálogo público de productos, sistema de categorías, soporte para imágenes y un panel de administración seguro para la gestión de artículos, todo respaldado por una API RESTful y autenticación de usuarios vía Token (JWT).

Esquema de Base de Datos
El sistema está soportado sobre MongoDB. Las principales colecciones y su estructura son:
products
- `_id`: ObjectId
- `name`: String
- `description`: String
- `sku`: String (identificador de producto)
- `priceCents`: Number (precio en centavos)
- `stock`: Number
- `category`: String (slug o nombre de categoría)
- `status`: String (`active` o `archived`)
- `imageUrl`: String (URL de la imagen del producto)
categories
- `_id`: ObjectId
- `name`: String
- `slug`: String
users
- `_id`: ObjectId
- `username`: String
- `passwordHash`: String (contraseña hasheada)
- `rol`: String (`admin`)


Tecnologías utilizadas
- Node.js y Express.js para el backend/API
- MongoDB y Mongoose para la base de datos
- JWT (JSON Web Tokens) para autenticación de usuarios
- Multer para carga de archivos/imágenes
- HTML5, CSS3 y JavaScript ES6 puro para el frontend
- bcryptjs para el hashing de contraseñas
- dotenv para manejo de variables de entorno
- VSCode Live Server


Instrucciones de instalación y ejecución
Prerrequisitos: Node.js (v18 o superior), npm, y MongoDB en ejecución local (o URI de Atlas).
1. Clonar el repositorio
```sh
git clone https://github.com/tucuenta/cattleya-tp.git
cd cattleya-tp
```
2. Instalar dependencias
```sh
cd backend
npm install
```
3. Configurar el archivo `.env`
Crear el archivo `.env` en la carpeta `backend` y completar con las variables necesarias:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/cattleya
JWT_SECRET=Artefloral26
```
4. Iniciar el backend
```sh
npm start
```
O con nodemon:
```sh
npm run dev
```
5. Iniciar el frontend
Utilizar Live Server desde VSCode en la carpeta `/front` o abrir manualmente `index.html` y `admin/index.html` en el navegador.

Endpoints disponibles
Nota:Toda ruta bajo `/admin` requiere autenticación usando el header `Authorization: Bearer <token>`
 
 Login
- `POST /admin/login`  
  - Cuerpo:
    ```json
    {
      "username": "admin",
      "password": "tu_contraseña"
    }
    ```
  - Respuesta:
    ```json
    {
      "token": "<jwt_token>"
    }
    ```

Productos
- `GET /products` — Listado público
- `GET /products/:id` — Detalle público
- `GET /admin/products` — Listado para administración *(requiere token)*
- `POST /admin/products` — Cargar producto *(requiere token)*
- `PUT /admin/products/:id` — Editar producto *(requiere token)*
- `DELETE /admin/products/:id` — Archivar producto *(requiere token)*

Categorías
- `GET /categories` — Listado de categorías

Subida de imágenes
- `POST /admin/upload`  
  - Carga de archivos `multipart/form-data` usando el campo `image`  
  - Devuelve la URL para asignarla a productos *(requiere token)*

Ejemplo de datos Mock para solicitudes POST

Ejemplo para crear un producto (_/admin/products_):
```json
{
  "name": "Ramo de Girasoles",
  "description": "Ramo grande de girasoles seleccionados, presentación premium.",
  "sku": "C-GIR",
  "priceCents": 30000,
  "stock": 5,
  "category": "flores-ramos",
  "status": "active",
  "imageUrl": "http://localhost:3001/uploads/1672883813_ramo_girasoles.jpg"
}

Autor y contacto
Desarrollado por Isabelle Roselli  
