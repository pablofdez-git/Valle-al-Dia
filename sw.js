self.addEventListener('install', (e) => {
  console.log('Service Worker instalado');
});

self.addEventListener('fetch', (e) => {
  // Solo con tener este evento vacío, Chrome ya nos permite lanzar el aviso de "Instalar App"
});
