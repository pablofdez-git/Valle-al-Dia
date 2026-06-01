// 1. Configuración de Supabase (Pega tus claves aquí)
const supabaseUrl = 'https://brkrwzwljdhliwlwfnwl.supabase.co/rest/v1/';
const supabaseKey = 'sb_publishable_dDdJCAiMgzWolATAQhbxNw_oJJ-5O53';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Referencias al HTML
const contenedorAvisos = document.getElementById('contenedor-avisos');

// 3. Función principal para cargar los datos
async function cargarBandos() {
    try {
        // Hacemos la consulta a la base de datos (ordenado por los más recientes)
        const { data: avisos, error } = await supabase
            .from('avisos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Limpiamos el skeleton de carga
        contenedorAvisos.innerHTML = '';

        // Si no hay avisos en la tabla
        if (avisos.length === 0) {
            contenedorAvisos.innerHTML = '<p>No hay bandos activos en este momento.</p>';
            return;
        }

        // 4. Recorremos los datos y creamos el HTML dinámicamente
        avisos.forEach(aviso => {
            // Formatear la fecha a un formato legible
            const fecha = new Date(aviso.created_at);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            // Crear el elemento artículo
            const article = document.createElement('article');
            article.className = `tarjeta-aviso ${aviso.urgente ? 'urgente' : ''}`;

            // Inyectar el contenido
            article.innerHTML = `
                <h3>${aviso.titulo}</h3>
                <p>${aviso.contenido || 'Sin descripción detallada.'}</p>
                <span class="fecha">
                    <span class="material-symbols-rounded">schedule</span>
                    ${fechaFormateada}
                </span>
            `;

            // Añadirlo al contenedor principal
            contenedorAvisos.appendChild(article);
        });

    } catch (error) {
        console.error("Error cargando los bandos:", error);
        contenedorAvisos.innerHTML = '<p style="color: red;">Hubo un error de conexión al cargar los bandos. Comprueba tu cobertura o recarga la página.</p>';
    }
}

// 5. Interacción del menú inferior (cambiar clase 'activo')
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault(); // Evita que salte hacia arriba de momento
        // Quitar la clase activo a todos
        navItems.forEach(nav => nav.classList.remove('activo'));
        // Ponerla al que acabas de hacer click
        this.classList.add('activo');
    });
});

// 6. Arrancar la máquina cuando cargue la página
document.addEventListener('DOMContentLoaded', cargarBandos);
