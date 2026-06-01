// 1. Configuración de Supabase
const supabaseUrl = 'https://brkrwzwljdhliwlwfnwl.supabase.co';
const supabaseKey = 'sb_publishable_dDdJCAiMgzWolATAQhbxNw_oJJ-5O53';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Proteger la ruta
async function protegerRuta() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    }
}
protegerRuta();

// -- VARIABLES GLOBALES Y REFERENCIAS AL DOM --
const listaNoticias = document.getElementById('lista-noticias-admin');
const formNoticia = document.getElementById('form-noticia');
const formEditar = document.getElementById('form-editar');
const btnLogout = document.getElementById('btn-logout');

let noticiasGlobales = [];
let idEdicion = null;

// -- 1. CARGAR LISTA DE NOTICIAS --
async function cargarNoticiasAdmin() {
    const { data: avisos, error } = await clienteSupabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        if(listaNoticias) listaNoticias.innerHTML = '<p style="color:red;">Error al cargar las noticias.</p>';
        return;
    }

    noticiasGlobales = avisos || [];
    if(!listaNoticias) return; // Por si acaso no existe el contenedor
    listaNoticias.innerHTML = '';

    if (noticiasGlobales.length === 0) {
        listaNoticias.innerHTML = '<p style="color:#666; padding: 10px;">No hay noticias publicadas.</p>';
        return;
    }

    noticiasGlobales.forEach(aviso => {
        const div = document.createElement('div');
        div.className = 'admin-aviso-card';
        const tituloSeguro = aviso.titulo.replace(/'/g, "\\'");

        div.innerHTML = `
            <h4 title="${aviso.titulo}">${aviso.titulo}</h4>
            <div class="admin-acciones" style="display: flex; gap: 5px;">
                <button type="button" class="btn-accion btn-editar" onclick="abrirModalEdicion('${aviso.id}')">
                    <span class="material-symbols-rounded" style="font-size: 18px;">edit</span>
                </button>
                <button type="button" class="btn-accion btn-borrar" onclick="borrarNoticia('${aviso.id}', '${tituloSeguro}')">
                    <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                </button>
            </div>
        `;
        listaNoticias.appendChild(div);
    });
}
cargarNoticiasAdmin();

// -- 2. PUBLICAR NUEVA NOTICIA --
if (formNoticia) {
    formNoticia.addEventListener('submit', async function(e) {
        e.preventDefault();
        const mensajeExito = document.getElementById('mensaje-exito');
        if(mensajeExito) mensajeExito.style.display = 'none';

        const titulo = document.getElementById('titulo').value;
        const contenido = document.getElementById('contenido').value;
        const urgente = document.getElementById('urgente').checked;

        try {
            const { error } = await clienteSupabase
                .from('avisos')
                .insert([{ titulo: titulo, contenido: contenido, urgente: urgente }]);

            if (error) throw error;

            if(mensajeExito) mensajeExito.style.display = 'block';
            formNoticia.reset();
            cargarNoticiasAdmin();

            setTimeout(() => {
                if(mensajeExito) mensajeExito.style.display = 'none';
            }, 3000);

        } catch (error) {
            console.error("Error al publicar:", error.message);
            alert("Hubo un error al publicar la noticia. Revisa tu conexión.");
        }
    });
}

// -- 3. BORRAR NOTICIA --
window.borrarNoticia = async function(id, titulo) {
    if(!confirm(`¿Estás seguro de que quieres eliminar la noticia:\n"${titulo}"?`)) return;

    const { error } = await clienteSupabase.from('avisos').delete().eq('id', id);
    if (error) {
        alert('Fallo al borrar.');
        console.error(error);
    } else {
        cargarNoticiasAdmin();
    }
};

// -- 4. ABRIR VENTANA DE EDICIÓN --
window.abrirModalEdicion = function(id) {
    const aviso = noticiasGlobales.find(n => n.id === id);
    if (!aviso) return;

    idEdicion = id;

    // Rellenamos el formulario si existe
    const tituloInput = document.getElementById('edit-titulo');
    if(tituloInput) tituloInput.value = aviso.titulo;

    const contenidoInput = document.getElementById('edit-contenido');
    if(contenidoInput) contenidoInput.value = aviso.contenido || '';

    const urgenteInput = document.getElementById('edit-urgente');
    if(urgenteInput) urgenteInput.checked = aviso.urgente;

    const modal = document.getElementById('modal-editar');
    if (modal) {
        modal.classList.add('activo');
    } else {
        console.error("Falta el HTML de la ventana modal-editar");
    }
};

// -- 5. CERRAR VENTANA DE EDICIÓN --
const btnCerrarEdicion = document.getElementById('btn-cerrar-edicion');
if (btnCerrarEdicion) {
    btnCerrarEdicion.addEventListener('click', () => {
        document.getElementById('modal-editar').classList.remove('activo');
    });
}

// -- 6. GUARDAR CAMBIOS DE EDICIÓN --
if (formEditar) {
    formEditar.addEventListener('submit', async function(e) {
        e.preventDefault();

        const titulo = document.getElementById('edit-titulo').value;
        const contenido = document.getElementById('edit-contenido').value;
        const urgente = document.getElementById('edit-urgente').checked;

        try {
            const { error } = await clienteSupabase
                .from('avisos')
                .update({ titulo: titulo, contenido: contenido, urgente: urgente })
                .eq('id', idEdicion);

            if (error) throw error;

            document.getElementById('modal-editar').classList.remove('activo');
            cargarNoticiasAdmin();

        } catch (error) {
            console.error("Error al actualizar:", error.message);
            alert("Error al guardar los cambios.");
        }
    });
}

// -- 7. CERRAR SESIÓN --
if (btnLogout) {
    btnLogout.addEventListener('click', async function() {
        await clienteSupabase.auth.signOut();
        window.location.href = 'login.html';
    });
}
