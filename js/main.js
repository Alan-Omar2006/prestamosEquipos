document.addEventListener('DOMContentLoaded', () => {

  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY < 60) header?.classList.remove('hide');
  }, { passive: true });

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.mini-menu-item').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href && currentPage.startsWith(href.replace('.html', ''))) {
      a.classList.add('active');
    }
  });

  const loginBtn     = document.querySelector('.btn-login-popup');
  const overlay      = document.getElementById('overlay');
  const loginWrapper = document.getElementById('loginWrapper');
  const closeBtns    = document.querySelectorAll('.modal-close-btn');

  function openLogin() {
    overlay?.classList.add('active');
    loginWrapper?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLogin() {
    overlay?.classList.remove('active');
    loginWrapper?.classList.remove('active');
    document.body.style.overflow = '';
    showLoginStep('login');
  }

  loginBtn?.addEventListener('click', openLogin);
  overlay?.addEventListener('click', closeLogin);
  closeBtns.forEach(b => b.addEventListener('click', closeLogin));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLogin(); cerrarZoom?.(); }
  });

  window.showLoginStep = (step) => {
    document.querySelectorAll('.login-step').forEach(el => el.hidden = true);
    const target = document.getElementById('step-' + step);
    if (target) target.hidden = false;
  };
  document.querySelectorAll('[data-step]').forEach(btn => {
    btn.addEventListener('click', () => showLoginStep(btn.dataset.step));
  });

});
