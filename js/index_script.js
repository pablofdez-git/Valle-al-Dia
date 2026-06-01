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
            contenedorAvisos.innerHTML = '<p style="padding: 20px; color: #666;">No hay noticias activas en este momento.</p>';
            return;
        }

        // --- LÓGICA DEL POP-UP DE ÚLTIMA HORA ---
        const ultimoAviso = avisos[0]; // El más reciente de todos

        if (ultimoAviso && ultimoAviso.urgente) {
            // Miramos en el móvil si ya existe la marca de "visto" para este ID concreto
            const alertaVista = localStorage.getItem('alerta_vista_' + ultimoAviso.id);

            // Si no está la marca, le sacamos el pantallazo rojo
            if (!alertaVista) {
                document.getElementById('urgente-titulo').innerText = ultimoAviso.titulo;
                document.getElementById('urgente-contenido').innerText = ultimoAviso.contenido || '';
                document.getElementById('modal-urgente').classList.add('activo');

                // Creamos la función que cierra la ventana y pone el sello en el móvil
                const cerrarUrgente = () => {
                    document.getElementById('modal-urgente').classList.remove('activo');
                    localStorage.setItem('alerta_vista_' + ultimoAviso.id, 'true');
                };

                // Si le da a la X o al botón, se cierra y se guarda
                document.getElementById('btn-cerrar-urgente').onclick = cerrarUrgente;
                document.getElementById('btn-entendido-urgente').onclick = cerrarUrgente;
            }
        }
        // -----------------------------------------

        // Recorremos la lista y pintamos las tarjetas del tablón
        avisos.forEach(aviso => {
            const fecha = new Date(aviso.created_at);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            const article = document.createElement('article');
            article.className = `tarjeta-aviso ${aviso.urgente ? 'urgente' : ''}`;
            article.style.cursor = 'pointer';

            article.innerHTML = `
                <h3>${aviso.titulo}</h3>
                <span class="fecha">
                    <span class="material-symbols-rounded">schedule</span> ${fechaFormateada}
                </span>
                <p style="color: var(--verde-oscuro); font-size: 0.85rem; margin-top: 10px; font-weight: 600;">Leer noticia completa →</p>
            `;

            // Al hacer click en cualquier tarjeta, abrimos la noticia normal
            article.addEventListener('click', () => {
                document.getElementById('modal-titulo').innerText = aviso.titulo;
                document.getElementById('modal-fecha').innerText = fechaFormateada;
                document.getElementById('modal-contenido').innerText = aviso.contenido || 'No hay más detalles para esta noticia.';
                document.getElementById('modal-noticia').classList.add('activo');
            });

            contenedorAvisos.appendChild(article);
        });

    } catch (error) {
        console.error("Error cargando los bandos:", error);
        contenedorAvisos.innerHTML = '<p style="color: red; padding: 20px;">Error de conexión.</p>';
    }
}

// 4. Lógica para cerrar la ventana emergente NORMAL (la de leer noticias)
const btnCerrarLectura = document.getElementById('btn-cerrar-lectura');
if (btnCerrarLectura) {
    btnCerrarLectura.addEventListener('click', () => {
        document.getElementById('modal-noticia').classList.remove('activo');
    });
}

// 5. Interacción del menú inferior (Para cuando tengamos las otras pestañas)
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('activo'));
        this.classList.add('activo');
    });
});

// 6. Arrancar la máquina al cargar
document.addEventListener('DOMContentLoaded', cargarBandos);
