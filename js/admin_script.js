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

// 3. Referencias del DOM
const formNoticia = document.getElementById('form-noticia');
const btnLogout = document.getElementById('btn-logout');
const mensajeExito = document.getElementById('mensaje-exito');
const mensajeError = document.getElementById('mensaje-error-panel');

// 4. Lógica para publicar la noticia
formNoticia.addEventListener('submit', async function(e) {
    e.preventDefault();

    mensajeExito.style.display = 'none';
    mensajeError.style.display = 'none';

    const titulo = document.getElementById('titulo').value;
    const contenido = document.getElementById('contenido').value;
    const urgente = document.getElementById('urgente').checked;

    try {
        const { error } = await clienteSupabase
            .from('avisos')
            .insert([
                { titulo: titulo, contenido: contenido, urgente: urgente }
            ]);

        if (error) throw error;

        mensajeExito.style.display = 'block';
        formNoticia.reset();

        setTimeout(() => {
            mensajeExito.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error("Error al publicar:", error.message);
        mensajeError.style.display = 'block';
    }
});

// 5. Lógica para cerrar sesión
btnLogout.addEventListener('click', async function() {
    await clienteSupabase.auth.signOut();
    window.location.href = 'login.html';
});
