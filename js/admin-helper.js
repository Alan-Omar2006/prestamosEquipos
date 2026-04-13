
const API_URL = 'https://api-prestamos-mfr4.onrender.com';

function protegerAdmin() {
  const token    = sessionStorage.getItem('token');
  const userData = sessionStorage.getItem('appUser');
  if (!token || !userData) { window.location.href = _rootPath() + 'index.html'; return null; }
  const user = JSON.parse(userData);
  if (user.type !== 'admin') { window.location.href = _rootPath() + 'index.html'; return null; }
  return user;
}

function protegerUsuario() {
  const token    = sessionStorage.getItem('token');
  const userData = sessionStorage.getItem('appUser');
  if (!token || !userData) { window.location.href = _rootPath() + 'index.html'; return null; }
  return JSON.parse(userData);
}

function _rootPath() {
  const depth = location.pathname.split('/').length - 1;
  if (depth <= 1) return '';
  if (depth === 2) return '../';
  return '../../';
}

function authHeaders(json = false) {
  const h = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

function cerrarSesion() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c62828',
      cancelButtonColor: '#1a237e',
      reverseButtons: false
    }).then(result => {
      if (result.isConfirmed) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('appUser');
        window.location.href = _rootPath() + 'index.html';
      }
    });
  } else {
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('appUser');
    window.location.href = _rootPath() + 'index.html';
  }
}

function inyectarHeaderAdmin(user) {
  const ph = document.getElementById('admin-header-placeholder');
  if (!ph) return;
  ph.innerHTML = `
    <header>
      <a href="${_rootPath()}index.html" class="logo-area">
        <img src="${_rootPath()}img/logo.png" alt="Logo" onerror="this.style.display='none'">
      </a>
      <span class="header-title">Panel de Administración</span>
      <div class="header-right">
        <div class="user-profile">
          <img class="user-avatar" src="${_rootPath()}img/default_admin.png" alt="Admin">
          <div class="user-dropdown">
            <div class="user-info-mini">
              <strong>${user ? user.name : 'Administrador'}</strong>
              <span>Administrador</span>
            </div>
            <a href="perfil_admin.html"><i class="fas fa-user-cog"></i> Mi Perfil</a>
            <a href="${_rootPath()}index.html"><i class="fas fa-home"></i> Ir al sitio</a>
            <button onclick="cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
          </div>
        </div>
      </div>
    </header>`;
  actualizarAvatarDesdeAPI();
}

function inyectarHeaderUsuario(user) {
  const ph = document.getElementById('header-placeholder');
  if (!ph) return;
  const nombre = user ? user.name : 'Usuario';
  ph.innerHTML = `
    <header>
      <a href="${_rootPath()}index.html" class="logo-area">
        <img src="${_rootPath()}img/logo.png" alt="Logo" onerror="this.style.display='none'">
      </a>
      <span class="header-title">Panel de Usuario</span>
      <div class="header-right">
        <div class="user-profile">
          <img class="user-avatar" src="${_rootPath()}img/default_user.png" alt="${nombre}">
          <div class="user-dropdown">
            <div class="user-info-mini">
              <strong>${nombre}</strong>
              <span>Usuario</span>
            </div>
            <a href="${_rootPath()}pages/usuario/perfil.html"><i class="fas fa-user"></i> Mi Perfil</a>
            <a href="${_rootPath()}pages/usuario/mis_prestamos.html"><i class="fas fa-box"></i> Mis Préstamos</a>
            <a href="${_rootPath()}index.html"><i class="fas fa-home"></i> Inicio</a>
            <button onclick="cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
          </div>
        </div>
      </div>
    </header>`;
  actualizarAvatarDesdeAPI();
}

function inyectarFooterUsuario() {
  const ph = document.getElementById('footer-placeholder');
  if (!ph) return;
  ph.innerHTML = `
    <footer>
      <div class="footer-content">
        <div class="footer-section">
          <h3>Universidad Tecnológica de la Huasteca Hidalguense</h3>
          <p>Carretera Huejutla - Chalahuiyapa S/N Km. 3.5</p>
          <p>C.P. 43000, Huejutla de Reyes, Hidalgo, México</p>
          <p>Teléfono: 789 896 2083</p>
          <button class="footer-map-btn" onclick="abrirMapaUTHH()" title="Ver ubicación en el mapa">
            <i class="fas fa-map-marker-alt"></i> Ver ubicación
          </button>
        </div>
        <div class="footer-section">
          <h4>Navegación</h4>
          <ul>
            <li><a href="${_rootPath()}pages/quienes_somos.html">Acerca de Nosotros</a></li>
            <li><a href="${_rootPath()}pages/catalogo.html">Catálogo de Equipos</a></li>
            <li><a href="${_rootPath()}pages/mapa.html">Mapa de Navegación</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        © ${new Date().getFullYear()} Gestión de Préstamos de Equipos y Accesorios de Cómputo · UTHH. Todos los derechos reservados.
      </div>
    </footer>`;
}

async function actualizarAvatarDesdeAPI() {
  const token = sessionStorage.getItem('token');
  if (!token) return;
  try {
    const perfil = await fetch(`${API_URL}/api/auth/perfil`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    if (perfil && perfil.imagen_url) {
      const avatars = document.querySelectorAll('.user-avatar');
      avatars.forEach(img => { img.src = perfil.imagen_url; });
    }
  } catch(e) {  }
}

function showToast(msg, type = 'success') {
  let toast = document.getElementById('_toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_toast';
    toast.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;padding:14px 22px;border-radius:10px;font-size:.9em;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.18);transition:opacity .3s;color:#fff;max-width:320px';
    document.body.appendChild(toast);
  }
  const colors = { success:'#2e7d32', error:'#c62828', info:'#1a237e', warning:'#f57f17' };
  toast.style.background = colors[type] || colors.success;
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3200);
}

function estadoClase(e) {
  const m = {
    'ACTIVO':      'status-activo',
    'EN PROCESO':  'status-proceso',
    'DEVUELTO':    'status-devuelto',
    'CANCELADO':   'status-cancelado',
  };
  return m[e] || '';
}

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'2-digit' });
}
