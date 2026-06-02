const supabaseUrl = 'https://brkrwzwljdhliwlwfnwl.supabase.co';
const supabaseKey = 'sb_publishable_dDdJCAiMgzWolATAQhbxNw_oJJ-5O53';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const contenedorAvisos = document.getElementById('contenedor-avisos');
const contenedorEventos = document.getElementById('contenedor-eventos');
const filtroMesesContainer = document.getElementById('filtro-meses');

let eventosGlobales = [];
let mesSeleccionado = "Todos";
let categoriaSeleccionada = "Todos";
const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// ==========================================
// SECCIÓN 1: CONTROLADOR DE PESTAÑAS (SPA)
// ==========================================
function inicializarNavegacion() {
    const btnNoticias = document.getElementById('nav-btn-noticias');
    const btnAgenda = document.getElementById('nav-btn-agenda');
    const btnAverias = document.getElementById('nav-btn-averias');
    const btnComarca = document.getElementById('nav-btn-comarca'); // Nuevo botón

    const vistaNoticias = document.getElementById('vista-noticias');
    const vistaAgenda = document.getElementById('vista-agenda');
    const vistaAverias = document.getElementById('vista-averias');
    const vistaComarca = document.getElementById('vista-comarca'); // Nueva vista

    btnNoticias.addEventListener('click', (e) => { e.preventDefault(); cambiarPestaña(btnNoticias, vistaNoticias); });
    btnAgenda.addEventListener('click', (e) => { e.preventDefault(); cambiarPestaña(btnAgenda, vistaAgenda); cargarAgendaPueblo(); });
    btnAverias.addEventListener('click', (e) => { e.preventDefault(); cambiarPestaña(btnAverias, vistaAverias); });
    btnComarca.addEventListener('click', (e) => { e.preventDefault(); cambiarPestaña(btnComarca, vistaComarca); cargarComarcaPueblo(); }); // Nueva acción
}

function cambiarPestaña(botonActivo, vistaActiva) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('activo'));
    document.querySelectorAll('.seccion-app').forEach(vista => vista.classList.remove('activo'));
    botonActivo.classList.add('activo');
    vistaActiva.classList.add('activo');
    window.scrollTo({ top: 0 });
}

// ==========================================
// SECCIÓN 2: LÓGICA DE BANDOS / NOTICIAS
// ==========================================
async function cargarBandos() {
    try {
        const { data: avisos, error } = await clienteSupabase.from('avisos').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        contenedorAvisos.innerHTML = '';
        if (avisos.length === 0) {
            contenedorAvisos.innerHTML = '<p style="padding: 20px; color: #666;">No hay noticias activas.</p>';
            return;
        }
        const ultimoAviso = avisos[0];
        if (ultimoAviso && ultimoAviso.urgente) {
            const alertaVista = localStorage.getItem('alerta_vista_' + ultimoAviso.id);
            if (!alertaVista) {
                document.getElementById('urgente-titulo').innerText = ultimoAviso.titulo;
                document.getElementById('urgente-contenido').innerText = ultimoAviso.contenido || '';
                document.getElementById('modal-urgente').classList.add('activo');
                const cerrarUrgente = () => {
                    document.getElementById('modal-urgente').classList.remove('activo');
                    localStorage.setItem('alerta_vista_' + ultimoAviso.id, 'true');
                };
                document.getElementById('btn-cerrar-urgente').onclick = cerrarUrgente;
                document.getElementById('btn-entendido-urgente').onclick = cerrarUrgente;
            }
        }
        avisos.forEach(aviso => {
            const fecha = new Date(aviso.created_at);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            const article = document.createElement('article');
            article.className = `tarjeta-aviso ${aviso.urgente ? 'urgente' : ''}`;
            article.innerHTML = `
                <h3>${aviso.titulo}</h3>
                <span class="fecha"><span class="material-symbols-rounded">schedule</span> ${fechaFormateada}</span>
                <p style="color: var(--verde-oscuro); font-size: 0.85rem; margin-top: 10px; font-weight: 600;">Leer noticia completa →</p>
            `;
            article.addEventListener('click', () => {
                document.getElementById('modal-titulo').innerText = aviso.titulo;
                document.getElementById('modal-fecha').innerText = fechaFormateada;
                document.getElementById('modal-contenido').innerText = aviso.contenido || '';
                document.getElementById('modal-noticia').classList.add('activo');
            });
            contenedorAvisos.appendChild(article);
        });
    } catch (error) { contenedorAvisos.innerHTML = '<p style="color: red; padding: 20px;">Error.</p>'; }
}

// ==========================================
// SECCIÓN 3: LÓGICA DE LA AGENDA
// ==========================================
async function cargarAgendaPueblo() {
    try {
        contenedorEventos.innerHTML = '<p style="padding:20px; color:#666;">Buscando eventos...</p>';
        const { data: eventos, error } = await clienteSupabase.from('eventos').select('*').order('fecha_inicio', { ascending: true });
        if (error) throw error;

        const ahora = new Date();
        eventosGlobales = (eventos || []).filter(ev => new Date(ev.fecha_inicio) >= ahora);

        generarBarraMeses();
        filtrarYMostrarEventos();
    } catch (error) { contenedorEventos.innerHTML = '<p style="color: red; padding: 20px;">Error al cargar la agenda.</p>'; }
}

function generarBarraMeses() {
    if(!filtroMesesContainer) return;
    const mesesConDatos = new Set();
    eventosGlobales.forEach(ev => { mesesConDatos.add(new Date(ev.fecha_inicio).getMonth()); });
    const mesesOrdenados = Array.from(mesesConDatos).sort((a, b) => a - b);
    filtroMesesContainer.innerHTML = '';

    const btnTodos = document.createElement('button');
    btnTodos.className = `pildora-filtro ${mesSeleccionado === "Todos" ? 'activo' : ''}`;
    btnTodos.innerText = "Todos los meses";
    btnTodos.addEventListener('click', () => { mesSeleccionado = "Todos"; actualizarEstiloFiltroMeses(btnTodos); filtrarYMostrarEventos(); });
    filtroMesesContainer.appendChild(btnTodos);

    mesesOrdenados.forEach(numMes => {
        const btnMes = document.createElement('button');
        btnMes.className = `pildora-filtro ${mesSeleccionado === numMes ? 'activo' : ''}`;
        btnMes.innerText = nombresMeses[numMes];
        btnMes.addEventListener('click', () => { mesSeleccionado = numMes; actualizarEstiloFiltroMeses(btnMes); filtrarYMostrarEventos(); });
        filtroMesesContainer.appendChild(btnMes);
    });
}

function actualizarEstiloFiltroMeses(nodoActivo) {
    filtroMesesContainer.querySelectorAll('.pildora-filtro').forEach(b => b.classList.remove('activo'));
    nodoActivo.classList.add('activo');
}

function filtrarYMostrarEventos() {
    contenedorEventos.innerHTML = '';
    const eventosFiltrados = eventosGlobales.filter(ev => {
        const fechaEv = new Date(ev.fecha_inicio);
        const cumpleMes = (mesSeleccionado === "Todos" || fechaEv.getMonth() === mesSeleccionado);

        let cumpleCat = false;
        if (categoriaSeleccionada === "Todos") {
            cumpleCat = true;
        } else if (Array.isArray(ev.categoria)) {
            cumpleCat = ev.categoria.includes(categoriaSeleccionada);
        } else {
            cumpleCat = (ev.categoria === categoriaSeleccionada);
        }
        return cumpleMes && cumpleCat;
    });

    eventosFiltrados.sort((a, b) => b.destacado - a.destacado);

    if (eventosFiltrados.length === 0) {
        contenedorEventos.innerHTML = '<p style="padding: 20px; color: #888; text-align: center;">No hay actividades para este filtro.</p>';
        return;
    }

    eventosFiltrados.forEach(ev => {
        const fecha = new Date(ev.fecha_inicio);
        const numeroDia = fecha.getDate();
        const textoMes = nombresMeses[fecha.getMonth()];
        const horaFormateada = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const div = document.createElement('div');
        div.className = `tarjeta-evento ${ev.destacado ? 'evento-destacado-card' : ''}`;
        div.innerHTML = `
            <div class="evento-bloque-fecha"><span class="evento-mes">${textoMes}</span><span class="evento-dia">${numeroDia}</span></div>
            <div class="evento-detalles">
                <h3>${ev.titulo}</h3>
                <div class="evento-info-meta">
                    <span class="material-symbols-rounded">schedule</span><span>${horaFormateada} h</span>
                    <span class="material-symbols-rounded" style="margin-left:8px;">location_on</span><span>${ev.lugar}</span>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
            const containerTags = document.getElementById('ev-modal-tags-container');
            containerTags.innerHTML = '';

            const cats = Array.isArray(ev.categoria) ? ev.categoria : [ev.categoria];
            cats.forEach(c => {
                const span = document.createElement('span');
                span.className = 'tag-categoria-modal';
                span.innerText = c.toUpperCase();
                containerTags.appendChild(span);
            });

            document.getElementById('ev-modal-titulo').innerText = ev.titulo;
            document.getElementById('ev-modal-fecha').innerText = fecha.toLocaleDateString('es-ES', optionsFecha) + " h";
            document.getElementById('ev-modal-lugar').innerText = ev.lugar;
            document.getElementById('ev-modal-descripcion').innerText = ev.descripcion || "Sin descripción.";
            document.getElementById('modal-evento').classList.add('activo');
        });
        contenedorEventos.appendChild(div);
    });
}

function configurarFiltrosCategoria() {
    document.querySelectorAll('#filtro-categorias .pildora-filtro').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#filtro-categorias .pildora-filtro').forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');
            categoriaSeleccionada = this.getAttribute('data-categoria');
            filtrarYMostrarEventos();
        });
    });
}

// ==========================================
// SECCIÓN 4: ACCESIBILIDAD (TAMAÑO DE LETRA)
// ==========================================
function inicializarAccesibilidad() {
    const btnMas = document.getElementById('btn-fuente-mas');
    const btnMenos = document.getElementById('btn-fuente-menos');
    const htmlElement = document.documentElement;
    const tamaños = [14, 16, 19, 22];
    let indiceActual = parseInt(localStorage.getItem('user_font_index')) || 1;

    htmlElement.style.fontSize = `${tamaños[indiceActual]}px`;

    if (btnMas && btnMenos) {
        btnMas.addEventListener('click', () => {
            if (indiceActual < tamaños.length - 1) {
                indiceActual++;
                htmlElement.style.fontSize = `${tamaños[indiceActual]}px`;
                localStorage.setItem('user_font_index', indiceActual);
            }
        });
        btnMenos.addEventListener('click', () => {
            if (indiceActual > 0) {
                indiceActual--;
                htmlElement.style.fontSize = `${tamaños[indiceActual]}px`;
                localStorage.setItem('user_font_index', indiceActual);
            }
        });
    }
}

// ==========================================
// SECCIÓN 5: LÓGICA DE AVERÍAS / INCIDENCIAS (NUEVA)
// ==========================================
function inicializarFormularioAverias() {
    const chkAnonimo = document.getElementById('inc-anonimo');
    const wrapperNombre = document.getElementById('wrapper-nombre-vecino');
    const formIncidencia = document.getElementById('form-incidencia');
    const msgExito = document.getElementById('inc-mensaje-exito');
    const msgError = document.getElementById('inc-mensaje-error');
    const inputNombre = document.getElementById('inc-nombre');

    if (!formIncidencia) return;

    // LÓGICA CORREGIDA: Al arrancar, si está marcado (Anónimo), la caja debe estar oculta
    if (chkAnonimo.checked) {
        wrapperNombre.classList.remove('mostrar');
        if(inputNombre) inputNombre.required = false;
    } else {
        wrapperNombre.classList.add('mostrar');
        if(inputNombre) inputNombre.required = true;
    }

    // Escuchamos los cambios en la casilla
    chkAnonimo.addEventListener('change', function() {
        if (this.checked) {
            // Si es ANÓNIMO, escondemos el campo y limpiamos lo escrito
            wrapperNombre.classList.remove('mostrar');
            inputNombre.required = false;
            inputNombre.value = '';
        } else {
            // Si NO es anónimo, desplegamos la caja para que ponga su nombre
            wrapperNombre.classList.add('connected'); // Evita saltos raros
            wrapperNombre.classList.add('mostrar');
            inputNombre.required = true;
        }
    });

    formIncidencia.addEventListener('submit', async function(e) {
        e.preventDefault();
        msgExito.style.display = 'none';
        msgError.style.display = 'none';

        const titulo = document.getElementById('inc-titulo').value;
        const lugar = document.getElementById('inc-lugar').value;
        const descripcion = document.getElementById('inc-descripcion').value;
        const anonimo = chkAnonimo.checked;
        const nombre_vecino = anonimo ? "Anónimo" : inputNombre.value;

        try {
            const { error } = await clienteSupabase
                .from('incidencias')
                .insert([{ titulo, lugar, descripcion, anonimo, nombre_vecino }]);

            if (error) throw error;

            msgExito.style.display = 'block';
            formIncidencia.reset();
            wrapperNombre.classList.remove('mostrar');

            setTimeout(() => { msgExito.style.display = 'none'; }, 4000);

        } catch (err) {
            console.error(err);
            msgError.style.display = 'block';
        }
    });
}

// ARRANQUE GLOBAL
document.addEventListener('DOMContentLoaded', () => {
    cargarBandos();
    inicializarNavegacion();
    configurarFiltrosCategoria();
    inicializarAccesibilidad();
    inicializarFormularioAverias(); // <-- Lanzamos el proceso de incidencias

    document.getElementById('btn-cerrar-lectura').onclick = () => document.getElementById('modal-noticia').classList.remove('activo');
    document.getElementById('btn-cerrar-evento').onclick = () => document.getElementById('modal-evento').classList.remove('activo');
});

// ==========================================
// SECCIÓN 6: LÓGICA DE COMARCA / DIRECTORIO
// ==========================================
async function cargarComarcaPueblo() {
    const divServicios = document.getElementById('directorio-servicios');
    const divVendedores = document.getElementById('directorio-vendedores');
    const divPueblos = document.getElementById('directorio-pueblos');

    if (!divServicios || !divVendedores || !divPueblos) return;

    divServicios.innerHTML = '<p style="color:#888; font-size:0.85rem; padding:10px;">Cargando...</p>';
    divVendedores.innerHTML = '<p style="color:#888; font-size:0.85rem; padding:10px;">Cargando...</p>';
    divPueblos.innerHTML = '<p style="color:#888; font-size:0.85rem; padding:10px;">Cargando...</p>';

    try {
        const { data: registros, error } = await clienteSupabase
            .from('directorio')
            .select('*');

        if (error) throw error;

        // Limpiamos los contenedores
        divServicios.innerHTML = '';
        divVendedores.innerHTML = '';
        divPueblos.innerHTML = '';

        // Filtramos y separamos los datos
        const servicios = registros.filter(r => r.tipo === 'Servicio');
        const vendedores = registros.filter(r => r.tipo === 'Vendedor');
        const pueblos = registros.filter(r => r.tipo === 'Pueblos');

        // ORDENACIÓN CLAVE: Los eventos de otros pueblos se ordenan por fecha (más cercanos primero)
        // Los eventos pasados o sin fecha se van al fondo
        pueblos.sort((a, b) => {
            if (!a.fecha_evento) return 1;
            if (!b.fecha_evento) return -1;
            return new Date(a.fecha_evento) - new Date(b.fecha_evento);
        });

        // Pintamos Servicios Municipales
        if (servicios.length === 0) divServicios.innerHTML = '<p style="color:#999; font-size:0.85rem; padding:5px;">No hay servicios registrados.</p>';
        servicios.forEach(r => divServicios.appendChild(crearTarjetaDirectorio(r)));

        // Pintamos Vendedores
        if (vendedores.length === 0) divVendedores.innerHTML = '<p style="color:#999; font-size:0.85rem; padding:5px;">Sin visitas programadas.</p>';
        vendedores.forEach(r => divVendedores.appendChild(crearTarjetaDirectorio(r)));

        // Pintamos Eventos de Pueblos Vecinos
        if (pueblos.length === 0) divPueblos.innerHTML = '<p style="color:#999; font-size:0.85rem; padding:5px;">No hay eventos comarcales anunciados.</p>';
        pueblos.forEach(r => divPueblos.appendChild(crearTarjetaDirectorio(r, true)));

    } catch (err) {
        console.error(err);
        divServicios.innerHTML = '<p style="color:red; font-size:0.85rem;">Error de conexión.</p>';
    }
}

// Función auxiliar para construir la tarjeta visual limpia
function crearTarjetaDirectorio(reg, esPueblo = false) {
    const card = document.createElement('div');
    card.className = 'tarjeta-directorio-item';

    let linkHTML = '';
    if (reg.enlace_externo) {
        // Si tiene enlace, le ponemos un botoncito limpio para abrir la info externa
        linkHTML = `<a href="${reg.enlace_externo}" target="_blank" class="btn-link-directorio">Ver información →</a>`;
    }

    let fechaHTML = '';
    if (esPueblo && reg.fecha_evento) {
        const f = new Date(reg.fecha_evento);
        fechaHTML = `<span class="badge-fecha-comarca">${f.toLocaleDateString('es-ES', {day:'2-digit', month:'short'})}</span>`;
    }

    card.innerHTML = `
        <div class="directorio-card-header">
            <div>
                <h4>${reg.titulo}</h4>
                ${reg.subtitulo ? `<span class="directorio-sub">${reg.subtitulo}</span>` : ''}
            </div>
            ${fechaHTML}
        </div>
        <p class="directorio-desc">${reg.descripcion}</p>
        ${linkHTML}
    `;
    return card;
}
