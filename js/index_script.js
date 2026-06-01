// 1. Configuración de Supabase
const supabaseUrl = 'https://brkrwzwljdhliwlwfnwl.supabase.co';
const supabaseKey = 'sb_publishable_dDdJCAiMgzWolATAQhbxNw_oJJ-5O53';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Referencias al HTML
const contenedorAvisos = document.getElementById('contenedor-avisos');

// 3. Función principal para cargar los datos
async function cargarBandos() {
    try {
        const { data: avisos, error } = await clienteSupabase
            .from('avisos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        contenedorAvisos.innerHTML = '';

        if (avisos.length === 0) {
            contenedorAvisos.innerHTML = '<p>No hay bandos activos en este momento.</p>';
            return;
        }

        avisos.forEach(aviso => {
            const fecha = new Date(aviso.created_at);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            const article = document.createElement('article');
            article.className = `tarjeta-aviso ${aviso.urgente ? 'urgente' : ''}`;

            article.innerHTML = `
                <h3>${aviso.titulo}</h3>
                <p>${aviso.contenido || 'Sin descripción detallada.'}</p>
                <span class="fecha">
                    <span class="material-symbols-rounded">schedule</span>
                    ${fechaFormateada}
                </span>
            `;

            contenedorAvisos.appendChild(article);
        });

    } catch (error) {
        console.error("Error cargando los bandos:", error);
        contenedorAvisos.innerHTML = '<p style="color: red;">Hubo un error de conexión al cargar los bandos. Comprueba tu cobertura o recarga la página.</p>';
    }
}

// 5. Interacción del menú inferior
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('activo'));
        this.classList.add('activo');
    });
});

document.addEventListener('DOMContentLoaded', cargarBandos);
