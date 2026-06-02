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

// --- GESTIÓN NOTICIAS ---
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

// --- GESTIÓN AGENDA ---
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

if (formEvento) {
    formEvento.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Recogemos todos los checkboxes de creación que estén marcados
        const checkboxes = document.querySelectorAll('input[name="ev-cat-check"]:checked');
        const categoriasSeleccionadas = Array.from(checkboxes).map(cb => cb.value);

        if (categoriasSeleccionadas.length === 0) {
            alert("Por favor, marca al menos una categoría para el evento.");
            return;
        }

        const { error } = await clienteSupabase.from('eventos').insert([{
            titulo: document.getElementById('ev-titulo').value,
            descripcion: document.getElementById('ev-descripcion').value,
            fecha_inicio: document.getElementById('ev-fecha').value,
            lugar: document.getElementById('ev-lugar').value,
            categoria: categoriasSeleccionadas, // Guardamos el array directo ["Infantil", "Talleres"]
            destacado: document.getElementById('ev-destacado').checked
        }]);

        if (!error) {
            formEvento.reset();
            cargarEventosAdmin();
        }
    });
}

window.borrarEvento = async function(id, titulo) {
    if(!confirm(`¿Borrar evento "${titulo}"?`)) return;
    await clienteSupabase.from('eventos').delete().eq('id', id);
    cargarEventosAdmin();
};

window.abrirModalEdicionEvento = function(id) {
    const ev = eventosGlobales.find(e => String(e.id) === String(id));
    if (!ev) return;

    idEdicionEvento = id;

    document.getElementById('edit-ev-titulo').value = ev.titulo;
    document.getElementById('edit-ev-descripcion').value = ev.descripcion || '';
    document.getElementById('edit-ev-lugar').value = ev.lugar;
    document.getElementById('edit-ev-destacado').checked = ev.destacado;

    // Desmarcar todos los checkboxes de edición primero para limpiar rescoldos pasados
    const checkboxes = document.querySelectorAll('input[name="edit-ev-cat-check"]');
    checkboxes.forEach(cb => cb.checked = false);

    // Marcar las casillas que correspondan con lo que tiene guardado el evento
    if (ev.categoria) {
        const catsDelEvento = Array.isArray(ev.categoria) ? ev.categoria : [ev.categoria];
        checkboxes.forEach(cb => {
            if (catsDelEvento.includes(cb.value)) {
                cb.checked = true;
            }
        });
    }

    if(ev.fecha_inicio) {
        document.getElementById('edit-ev-fecha').value = new Date(ev.fecha_inicio).toISOString().slice(0, 16);
    }

    document.getElementById('modal-editar-evento').classList.add('activo');
};

document.getElementById('btn-cerrar-edicion-ev').onclick = () => document.getElementById('modal-editar-evento').classList.remove('activo');

if (formEditarEvento) {
    formEditarEvento.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Recogemos los checkboxes de edición que estén marcados
        const checkboxes = document.querySelectorAll('input[name="edit-ev-cat-check"]:checked');
        const categoriasSeleccionadas = Array.from(checkboxes).map(cb => cb.value);

        if (categoriasSeleccionadas.length === 0) {
            alert("El evento debe tener al menos una categoría seleccionada.");
            return;
        }

        const { error } = await clienteSupabase.from('eventos').update({
            titulo: document.getElementById('edit-ev-titulo').value,
            descripcion: document.getElementById('edit-ev-descripcion').value,
            fecha_inicio: document.getElementById('edit-ev-fecha').value,
            lugar: document.getElementById('edit-ev-lugar').value,
            categoria: categoriasSeleccionadas, // Guardamos la nueva lista de categorías
            destacado: document.getElementById('edit-ev-destacado').checked
        }).eq('id', idEdicionEvento);

        if (!error) {
            document.getElementById('modal-editar-evento').classList.remove('activo');
            cargarEventosAdmin();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => { cargarNoticiasAdmin(); cargarEventosAdmin(); });
btnLogout.onclick = async () => { await clienteSupabase.auth.signOut(); window.location.href = 'login.html'; };
