// Datos de todos los productos
const productosData = [
    // FLORES Y RAMOS
    {
        id: 'ramo-clasico',
        nombre: 'Ramo Clásico',
        categoria: 'Flores y Ramos',
        precio: 4500,
        imagen: 'https://via.placeholder.com/250x250?text=Ramo+Clásico',
        descripcion: 'Un hermoso ramo de flores frescas y elegantes, perfecto para cualquier ocasión.',
        detalles: [
            'Flores frescas seleccionadas diariamente',
            'Arranque profesional y cuidado',
            'Entrega en Buenos Aires',
            'Ideal para sorprender a alguien especial',
            'Disponible en diferentes colores'
        ]
    },
    {
        id: 'ramo-premium',
        nombre: 'Ramo Premium',
        categoria: 'Flores y Ramos',
        precio: 6500,
        imagen: 'https://via.placeholder.com/250x250?text=Ramo+Premium',
        descripcion: 'Ramo de lujo con flores importadas y frescas, para los momentos más especiales.',
        detalles: [
            'Flores importadas de calidad superior',
            'Flores frescas 7 días garantizado',
            'Diseño personalizado',
            'Incluye envío a domicilio',
            'Tarjeta personalizada incluida'
        ]
    },
    {
        id: 'ramo-especial',
        nombre: 'Ramo Especial',
        categoria: 'Flores y Ramos',
        precio: 7500,
        imagen: 'https://via.placeholder.com/250x250?text=Ramo+Especial',
        descripcion: 'Un ramo exclusivo con flores seleccionadas y diseño único para ocasiones extraordinarias.',
        detalles: [
            'Flores seleccionadas manualmente',
            'Diseño exclusivo y personalizado',
            'Aromas frescos y naturales',
            'Presentación en caja premium',
            'Disponible para pedidos especiales'
        ]
    },

    // ORQUÍDEAS
    {
        id: 'orquidea-blanca',
        nombre: 'Orquídea Blanca',
        categoria: 'Orquídeas',
        precio: 5500,
        imagen: 'https://via.placeholder.com/250x250?text=Orquídea+Blanca',
        descripcion: 'Elegante orquídea blanca que durará semanas en tu hogar.',
        detalles: [
            'Orquídea blanca natural',
            'Duración: 6 a 8 semanas',
            'Incluye maceta decorativa',
            'Cuidados simples',
            'Perfecta para regalar o decorar'
        ]
    },
    {
        id: 'orquidea-morada',
        nombre: 'Orquídea Morada',
        categoria: 'Orquídeas',
        precio: 5800,
        imagen: 'https://via.placeholder.com/250x250?text=Orquídea+Morada',
        descripcion: 'Hermosa orquídea morada con flores vibrantes y largas.',
        detalles: [
            'Orquídea morada de calidad',
            'Flores grandes y vistosas',
            'Duración: 6 a 8 semanas',
            'Incluye maceta y soporte',
            'Ideal para espacios iluminados'
        ]
    },
    {
        id: 'orquidea-rosada',
        nombre: 'Orquídea Rosada',
        categoria: 'Orquídeas',
        precio: 6000,
        imagen: 'https://via.placeholder.com/250x250?text=Orquídea+Rosada',
        descripcion: 'Delicada orquídea rosada con flores perfumadas y elegantes.',
        detalles: [
            'Orquídea rosada natural',
            'Aroma delicado y natural',
            'Flores grandes y radiantes',
            'Duración prolongada',
            'Perfecto para espacios sofisticados'
        ]
    },

    // PLANTAS
    {
        id: 'planta-monstera',
        nombre: 'Planta Monstera',
        categoria: 'Plantas',
        precio: 5500,
        imagen: 'https://via.placeholder.com/250x250?text=Planta+Monstera',
        descripcion: 'Moderna y elegante, la Monstera es perfecta para cualquier ambiente.',
        detalles: [
            'Planta Monstera deliciosa',
            'Tamaño mediano a grande',
            'Cuidados mínimos',
            'Purifica el aire',
            'Ideal para interiores modernos'
        ]
    },
    {
        id: 'planta-pothos',
        nombre: 'Planta Pothos',
        categoria: 'Plantas',
        precio: 4500,
        imagen: 'https://via.placeholder.com/250x250?text=Planta+Pothos',
        descripcion: 'Una planta resistente y fácil de cuidar, perfecta para principiantes.',
        detalles: [
            'Planta Pothos resistente',
            'Requiere poco mantenimiento',
            'Crece rápidamente',
            'Purifica el aire del hogar',
            'Ideal para cualquier habitación'
        ]
    },
    {
        id: 'planta-alocasia',
        nombre: 'Planta Alocasia',
        categoria: 'Plantas',
        precio: 6500,
        imagen: 'https://via.placeholder.com/250x250?text=Planta+Alocasia',
        descripcion: 'Planta tropical con hojas grandes y vistosas, muy decorativa.',
        detalles: [
            'Planta Alocasia tropical',
            'Hojas grandes y coloridas',
            'Cuidados especializados',
            'Crece en ambientes luminosos',
            'Perfecta para coleccionistas'
        ]
    },

    // REGALOS
    {
        id: 'caja-rosas-ferrero',
        nombre: 'Caja Rosas con Ferrero',
        categoria: 'Regalos',
        precio: 8500,
        imagen: 'https://via.placeholder.com/250x250?text=Caja+Rosas+Ferrero',
        descripcion: 'Combinación perfecta de rosas frescas y chocolates Ferrero Rocher.',
        detalles: [
            'Rosas rojas frescas',
            'Chocolates Ferrero Rocher incluidos',
            'Presentación en caja premium',
            'Ideal para San Valentín',
            'Envío a domicilio disponible'
        ]
    },
    {
        id: 'ramo-chocolates',
        nombre: 'Ramo con Chocolates',
        categoria: 'Regalos',
        precio: 7500,
        imagen: 'https://via.placeholder.com/250x250?text=Ramo+Chocolates',
        descripcion: 'Hermoso ramo de flores acompañado de chocolates gourmet.',
        detalles: [
            'Ramo de flores seleccionadas',
            'Chocolates gourmet de calidad',
            'Presentación elegante',
            'Perfecta para sorprender',
            'Disponible todo el año'
        ]
    },
    {
        id: 'arreglo-especial',
        nombre: 'Arreglo Especial',
        categoria: 'Regalos',
        precio: 9000,
        imagen: 'https://via.placeholder.com/250x250?text=Arreglo+Especial',
        descripcion: 'Un arreglo exclusivo con flores, plantas y detalles especiales.',
        detalles: [
            'Flores y plantas premium',
            'Diseño personalizado',
            'Detalles decorativos incluidos',
            'Presentación de lujo',
            'Disponible para ocasiones especiales'
        ]
    },

    // PELUCHES
    {
        id: 'peluche-oso',
        nombre: 'Peluche Oso',
        categoria: 'Peluches',
        precio: 3500,
        imagen: 'https://via.placeholder.com/250x250?text=Peluche+Oso',
        descripcion: 'Adorable peluche de oso suave y acogedor para todas las edades.',
        detalles: [
            'Peluche de oso de calidad',
            'Material suave y cómodo',
            'Ideal para niños y adultos',
            'Disponible en varios tamaños',
            'Perfecto para acompañar flores'
        ]
    },
    {
        id: 'peluche-conejo',
        nombre: 'Peluche Conejo',
        categoria: 'Peluches',
        precio: 3500,
        imagen: 'https://via.placeholder.com/250x250?text=Peluche+Conejo',
        descripcion: 'Tierno peluche de conejo, perfecto para regalar con flores.',
        detalles: [
            'Peluche de conejo suave',
            'Material de calidad premium',
            'Ojos y detalles bordados',
            'Ideal para niñas',
            'Complemento perfecto para regalos'
        ]
    },
    {
        id: 'peluche-pinguino',
        nombre: 'Peluche Pingüino',
        categoria: 'Peluches',
        precio: 3500,
        imagen: 'https://via.placeholder.com/250x250?text=Peluche+Pingüino',
        descripcion: 'Lindo peluche de pingüino, perfecto para decorar cualquier espacio.',
        detalles: [
            'Peluche de pingüino adorable',
            'Material suave y duradero',
            'Detalles cuidadosamente bordados',
            'Disponible en diferentes tamaños',
            'Gran regalo para cualquier edad'
        ]
    },

    // BOXES
    {
        id: 'caja-rosas-ferrero-box',
        nombre: 'Caja Rosas con Ferrero',
        categoria: 'Boxes',
        precio: 8500,
        imagen: 'https://via.placeholder.com/250x250?text=Caja+Rosas+Ferrero',
        descripcion: 'Box de rosas rojas con chocolates Ferrero Rocher, un regalo clásico.',
        detalles: [
            'Rosas rojas premium',
            'Chocolates Ferrero Rocher',
            'Caja decorativa de lujo',
            'Entrega a domicilio',
            'Perfecta para ocasiones especiales'
        ]
    },
    {
        id: 'ramo-chocolates-box',
        nombre: 'Ramo con Chocolates',
        categoria: 'Boxes',
        precio: 7500,
        imagen: 'https://via.placeholder.com/250x250?text=Ramo+Chocolates',
        descripcion: 'Ramo artístico combinado con una selección de chocolates finos.',
        detalles: [
            'Flores artísticamente arregladas',
            'Chocolates surtidos de calidad',
            'Presentación impecable',
            'Ideal para bodas y aniversarios',
            'Disponible personalizado'
        ]
    },
    {
        id: 'arreglo-especial-box',
        nombre: 'Arreglo Especial',
        categoria: 'Boxes',
        precio: 9000,
        imagen: 'https://via.placeholder.com/250x250?text=Arreglo+Especial',
        descripcion: 'Arreglo exclusivo con todos los detalles para una ocasión memorable.',
        detalles: [
            'Flores y elementos decorativos',
            'Diseño único y elegante',
            'Presentación en caja premium',
            'Disponible para cualquier evento',
            'Envío y montaje incluido'
        ]
    }
];

// Función para obtener un producto por ID
function obtenerProducto(id) {
    return productosData.find(p => p.id === id);
}

// Función para obtener productos por categoría
function obtenerProductosPorCategoria(categoria) {
    return productosData.filter(p => p.categoria === categoria);
}