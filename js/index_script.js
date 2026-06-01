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
            contenedorAvisos.innerHTML = '<p>No hay noticias activas en este momento.</p>';
            return;
        }

        avisos.forEach(aviso => {
            const fecha = new Date(aviso.created_at);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            const article = document.createElement('article');
            article.className = `tarjeta-aviso ${aviso.urgente ? 'urgente' : ''}`;
            article.style.cursor = 'pointer'; // Para que el ratón cambie a la manita

            // Solo mostramos título y fecha en el tablón
            article.innerHTML = `
                <h3>${aviso.titulo}</h3>
                <span class="fecha">
                    <span class="material-symbols-rounded">schedule</span> ${fechaFormateada}
                </span>
                <p style="color: var(--verde-oscuro); font-size: 0.85rem; margin-top: 10px; font-weight: 600;">Leer noticia completa →</p>
            `;

            // Al hacer click, rellenamos el modal oculto y lo mostramos
            article.addEventListener('click', () => {
                document.getElementById('modal-titulo').innerText = aviso.titulo;
                document.getElementById('modal-fecha').innerText = fechaFormateada;
                // Si la noticia no tiene descripción, ponemos un texto por defecto
                document.getElementById('modal-contenido').innerText = aviso.contenido || 'No hay más detalles para esta noticia.';
                document.getElementById('modal-noticia').classList.add('activo');
            });

            contenedorAvisos.appendChild(article);
        });

    } catch (error) {
        console.error("Error cargando los bandos:", error);
        contenedorAvisos.innerHTML = '<p style="color: red;">Error de conexión.</p>';
    }
}

// Lógica para cerrar el modal de lectura
document.getElementById('btn-cerrar-lectura').addEventListener('click', () => {
    document.getElementById('modal-noticia').classList.remove('activo');
});

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
