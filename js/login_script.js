// 1. Configuración de Supabase
const supabaseUrl = 'https://brkrwzwljdhliwlwfnwl.supabase.co';
const supabaseKey = 'sb_publishable_dDdJCAiMgzWolATAQhbxNw_oJJ-5O53'; // Asegúrate de que esta clave está copiada perfecta
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Referencias a los elementos del HTML
const formLogin = document.getElementById('form-login');
const inputEmail = document.getElementById('email');
const inputPassword = document.getElementById('password');
const mensajeError = document.getElementById('mensaje-error');

// 3. Comprobar si ya estás logueado
async function comprobarSesion() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    if (session) {
        window.location.href = 'admin.html';
    }
}
comprobarSesion();

// 4. Lógica del login
formLogin.addEventListener('submit', async function(e) {
    e.preventDefault();
    mensajeError.style.display = 'none';

    const email = inputEmail.value;
    const password = inputPassword.value;

    try {
        const { data, error } = await clienteSupabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Si todo va bien, pa' dentro
        window.location.href = 'admin.html';

    } catch (error) {
        console.error("Error al iniciar sesión:", error.message);
        mensajeError.style.display = 'block';
        inputPassword.value = '';
    }
});
