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

function inicializarNavegacion() {
    const btnNoticias = document.getElementById('nav-btn-noticias');
    const btnAgenda = document.getElementById('nav-btn-agenda');
    const vistaNoticias = document.getElementById('vista-noticias');
    const vistaAgenda = document.getElementById('vista-agenda');

    btnNoticias.addEventListener('click', (e) => { e.preventDefault(); cambiarPestaña(btnNoticias, vistaNoticias); });
    btnAgenda.addEventListener('click', (e) => { e.preventDefault(); cambiarPestaña(btnAgenda, vistaAgenda); cargarAgendaPueblo(); });
}

function cambiarPestaña(botonActivo, vistaActiva) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('activo'));
    document.querySelectorAll('.seccion-app').forEach(vista => vista.classList.remove('activo'));
    botonActivo.classList.add('activo');
    vistaActiva.classList.add('activo');
    window.scrollTo({ top: 0 });
}

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

        // Manejo de categoría única o array (Multi-categoría)
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

            // Pintar múltiples categorías si es un Array
            const cats = Array.isArray(ev.categoria) ? ev.categoria : [ev.categoria];
            cats.forEach(c => {
                const span = document.createElement('span');
                span.className = 'tag-categoria-modal';
                span.innerText = c.toUpperCase();
                containerTags.appendChild(span);
            });

            document.getElementById('ev-modal-titulo').innerText = ev.titulo;
            document.getElementById('ev-modal-fecha').innerText = fecha.toLocaleDateString('es-ES', opcionesFecha) + " h";
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

document.addEventListener('DOMContentLoaded', () => {
    cargarBandos();
    inicializarNavegacion();
    configurarFiltrosCategoria();
    document.getElementById('btn-cerrar-lectura').onclick = () => document.getElementById('modal-noticia').classList.remove('activo');
    document.getElementById('btn-cerrar-evento').onclick = () => document.getElementById('modal-evento').classList.remove('activo');
});
