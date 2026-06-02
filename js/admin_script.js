// ==========================================================================
// SCRIPT DE ADMINISTRACIÓN - VALLE AL DÍA (REVISADO SIN DUPLICADOS)
// ==========================================================================

const supabaseUrl = 'https://brkrwzwljdhliwlwfnwl.supabase.co';
const supabaseKey = 'sb_publishable_dDdJCAiMgzWolATAQhbxNw_oJJ-5O53';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function protegerRuta() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    if (!session) window.location.href = 'login.html';
}
protegerRuta();

const listaNoticias = document.getElementById('lista-noticias-admin');
const formNoticia = document.getElementById('form-noticia');
const formEditar = document.getElementById('form-editar');
const btnLogout = document.getElementById('btn-logout');
let noticiasGlobales = [];
let idEdicion = null;

const listaEventos = document.getElementById('lista-eventos-admin');
const formEvento = document.getElementById('form-evento');
const formEditarEvento = document.getElementById('form-editar-evento');
let eventosGlobales = [];
let idEdicionEvento = null;

const listaIncidencias = document.getElementById('lista-incidencias-admin');

// --- 1. GESTIÓN NOTICIAS --------------------------------------------------
async function cargarNoticiasAdmin() {
    const { data: avisos, error } = await clienteSupabase.from('avisos').select('*').order('created_at', { ascending: false });
    if (error) return;
    noticiasGlobales = avisos || [];
    if(!listaNoticias) return;
    listaNoticias.innerHTML = '';
    noticiasGlobales.forEach(aviso => {
        const div = document.createElement('div');
        div.className = 'admin-aviso-card';
        const tituloSeguro = aviso.titulo.replace(/'/g, "\\'");
        div.innerHTML = `
            <h4>${aviso.titulo}</h4>
            <div class="admin-acciones">
                <button type="button" class="btn-accion btn-editar" onclick="abrirModalEdicion('${aviso.id}')"><span class="material-symbols-rounded">edit</span></button>
                <button type="button" class="btn-accion btn-borrar" onclick="borrarNoticia('${aviso.id}', '${tituloSeguro}')"><span class="material-symbols-rounded">delete</span></button>
            </div>
        `;
        listaNoticias.appendChild(div);
    });
}

if (formNoticia) {
    formNoticia.addEventListener('submit', async function(e) {
        e.preventDefault();
        const titulo = document.getElementById('titulo').value;
        const contenido = document.getElementById('contenido').value;
        const urgente = document.getElementById('urgente').checked;
        const { error } = await clienteSupabase.from('avisos').insert([{ titulo, contenido, urgente }]);
        if (!error) { formNoticia.reset(); cargarNoticiasAdmin(); }
    });
}

window.borrarNoticia = async function(id, titulo) {
    if(!confirm(`¿Eliminar bando "${titulo}"?`)) return;
    await clienteSupabase.from('avisos').delete().eq('id', id);
    cargarNoticiasAdmin();
};

window.abrirModalEdicion = function(id) {
    const aviso = noticiasGlobales.find(n => n.id === id);
    if (!aviso) return;
    idEdicion = id;
    document.getElementById('edit-titulo').value = aviso.titulo;
    document.getElementById('edit-contenido').value = aviso.contenido || '';
    document.getElementById('edit-urgente').checked = aviso.urgente;
    document.getElementById('modal-editar').classList.add('activo');
};

document.getElementById('btn-cerrar-edicion').onclick = () => document.getElementById('modal-editar').classList.remove('activo');

if (formEditar) {
    formEditar.addEventListener('submit', async function(e) {
        e.preventDefault();
        const { error } = await clienteSupabase.from('avisos').update({
            titulo: document.getElementById('edit-titulo').value,
            contenido: document.getElementById('edit-contenido').value,
            urgente: document.getElementById('edit-urgente').checked
        }).eq('id', idEdicion);
        if (!error) { document.getElementById('modal-editar').classList.remove('activo'); cargarNoticiasAdmin(); }
    });
}

// --- 2. GESTIÓN AGENDA -----------------------------------------------------
async function cargarEventosAdmin() {
    const { data: eventos, error } = await clienteSupabase.from('eventos').select('*').order('fecha_inicio', { ascending: true });
    if (error) return;
    eventosGlobales = eventos || [];
    if (!listaEventos) return;
    listaEventos.innerHTML = '';

    eventosGlobales.forEach(ev => {
        const f = new Date(ev.fecha_inicio);
        const fechaFormateada = f.toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit'}) + " " + f.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'});
        const div = document.createElement('div');
        div.className = 'admin-aviso-card';
        const tituloSeguro = ev.titulo.replace(/'/g, "\\'");
        div.innerHTML = `
            <h4>[${fechaFormateada}] ${ev.titulo}</h4>
            <div class="admin-acciones">
                <button type="button" class="btn-accion btn-editar btn-agenda-color" onclick="abrirModalEdicionEvento('${ev.id}')"><span class="material-symbols-rounded">edit</span></button>
                <button type="button" class="btn-accion btn-borrar" onclick="borrarEvento('${ev.id}', '${tituloSeguro}')"><span class="material-symbols-rounded">delete</span></button>
            </div>
        `;
        listaEventos.appendChild(div);
    });
}

window.abrirModalEdicionEvento = function(id) {
    const ev = eventosGlobales.find(e => String(e.id) === String(id));
    if (!ev) return;
    idEdicionEvento = id;
    document.getElementById('edit-ev-titulo').value = ev.titulo;
    document.getElementById('edit-ev-descripcion').value = ev.descripcion || '';
    document.getElementById('edit-ev-lugar').value = ev.lugar;
    if(ev.fecha_inicio) {
        document.getElementById('edit-ev-fecha').value = new Date(ev.fecha_inicio).toISOString().slice(0, 16);
    }
    document.getElementById('modal-editar-evento').classList.add('activo');
};

document.getElementById('btn-cerrar-edicion-ev').onclick = () => document.getElementById('modal-editar-evento').classList.remove('activo');


// --- 3. GESTIÓN DE INCIDENCIAS / QUEJAS ------------------------------------
async function cargarIncidenciasAdmin() {
    if (!listaIncidencias) return;

    const { data: quejas, error } = await clienteSupabase
        .from('incidencias')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        listaIncidencias.innerHTML = '<p style="color:red; padding:10px;">Error al conectar con Supabase.</p>';
        return;
    }

    listaIncidencias.innerHTML = '';

    if (!quejas || quejas.length === 0) {
        listaIncidencias.innerHTML = '<p style="color:#666; padding:15px; text-align:center;">No hay incidencias reportadas. ¡Todo en orden!</p>';
        return;
    }

    quejas.forEach(inc => {
        const f = new Date(inc.created_at);
        const fechaFormateada = f.toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});

        let claseEstadoCard = '';
        if (inc.estado === 'En proceso') claseEstadoCard = 'en-proceso';
        if (inc.estado === 'Resuelta') claseEstadoCard = 'resuelta';

        let claseSelect = 'pendiente';
        if (inc.estado === 'En proceso') claseSelect = 'en-proceso';
        if (inc.estado === 'Resuelta') claseSelect = 'resuelta';

        const botonBloqueado = inc.estado !== 'Resuelta' ? 'disabled' : '';
        const tituloSeguro = inc.titulo.replace(/'/g, "\\'");

        const div = document.createElement('div');
        div.className = `admin-incidencia-card ${claseEstadoCard}`;
        div.innerHTML = `
            <div class="incidencia-header-admin">
                <h4>${inc.titulo}</h4>
                <div class="incidencia-meta-admin">
                    <span><span class="material-symbols-rounded" style="font-size:14px;">schedule</span>${fechaFormateada}</span>
                    <span><span class="material-symbols-rounded" style="font-size:14px;">location_on</span>${inc.lugar}</span>
                    <span><span class="material-symbols-rounded" style="font-size:14px;">person</span>${inc.nombre_vecino || 'Anónimo'}</span>
                </div>
            </div>
            <p class="incidencia-cuerpo-admin">${inc.descripcion}</p>

            <div class="incidencia-acciones-admin">
                <select class="select-estado-admin ${claseSelect}" onchange="cambiarEstadoIncidencia('${inc.id}', this.value)">
                    <option value="Pendiente" ${inc.estado === 'Pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
                    <option value="En proceso" ${inc.estado === 'En proceso' ? 'selected' : ''}>🔵 En proceso</option>
                    <option value="Resuelta" ${inc.estado === 'Resuelta' ? 'selected' : ''}>🟢 Resuelta</option>
                </select>

                <button type="button" class="btn-borrar-incidencia" ${botonBloqueado} onclick="borrarIncidencia('${inc.id}', '${tituloSeguro}')" title="Eliminar definitivamente">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
        `;
        listaIncidencias.appendChild(div);
    });
}

window.cambiarEstadoIncidencia = async function(id, nuevoEstado) {
    const { error } = await clienteSupabase
        .from('incidencias')
        .update({ estado: nuevoEstado })
        .eq('id', id);

    if (error) {
        alert("No se pudo actualizar el estado.");
    } else {
        cargarIncidenciasAdmin();
    }
};

window.borrarIncidencia = async function(id, titulo) {
    if (!confirm(`¿Eliminar definitivamente la incidencia resuelta "${titulo}"?\nEsta acción no se puede deshacer.`)) return;

    const { error } = await clienteSupabase
        .from('incidencias')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Error al intentar borrar la incidencia.");
    } else {
        cargarIncidenciasAdmin();
    }
};

// --- ARRANQUE GLOBAL Y LOGOUT ----------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    cargarNoticiasAdmin();
    cargarEventosAdmin();
    cargarIncidenciasAdmin();
});

btnLogout.onclick = async () => { await clienteSupabase.auth.signOut(); window.location.href = 'login.html'; };
