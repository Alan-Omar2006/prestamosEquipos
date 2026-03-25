(function() {
  const LAT  = 21.156611;
  const LNG  = -98.380374;
  const ZOOM = 15;

  function cargarCSS(href, id) {
    if (document.getElementById(id)) return;
    const l = document.createElement('link');
    l.id = id; l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }

  function cargarScript(src, cb) {
    const s = document.createElement('script');
    s.src = src; s.onload = cb;
    document.head.appendChild(s);
  }

  function crearModal() {
    if (document.getElementById('modal-mapa-uthh')) return;
    const overlay = document.createElement('div');
    overlay.id = 'modal-mapa-uthh';
    overlay.innerHTML = `
      <div class="mapa-modal-box">
        <div class="mapa-modal-header">
          <div class="mapa-modal-title">
            <i class="fas fa-map-marker-alt"></i>
            <span>Ubicación UTHH</span>
          </div>
          <button class="mapa-modal-close" onclick="cerrarMapaUTHH()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="mapa-modal-info">
          <i class="fas fa-university"></i>
          Universidad Tecnológica de la Huasteca Hidalguense &nbsp;·&nbsp;
          Carretera Huejutla - Chalahuiyapa S/N Km. 3.5, Huejutla de Reyes, Hgo.
        </div>
        <div id="mapa-ruta-status" style="display:none;padding:8px 20px;font-size:11px;background:#fff8e1;color:#e65100;border-bottom:1px solid #ffe0b2">
          <i class="fas fa-spinner fa-spin" style="margin-right:6px"></i>
          <span id="mapa-ruta-txt">Calculando ruta...</span>
        </div>
        <div id="mapa-leaflet-container"></div>
        <div class="mapa-modal-footer">
          <span class="mapa-coords">
            <i class="fas fa-crosshairs"></i> ${LAT}, ${LNG}
          </span>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="mapa-gmaps-btn mapa-ruta-btn" onclick="trazarRuta()" id="btnRuta" style="background:#2e7d32">
              <i class="fas fa-route"></i> Cómo llegar
            </button>
            <a href="https://maps.google.com/?q=${LAT},${LNG}" target="_blank" class="mapa-gmaps-btn">
              <i class="fab fa-google"></i> Google Maps
            </a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) cerrarMapaUTHH();
    });
  }

  let _map = null;
  let _routingControl = null;

  function initMapa() {
    if (_map) return;

    _map = L.map('mapa-leaflet-container', {
      center: [LAT, LNG],
      zoom: ZOOM,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(_map);

    const icono = L.divIcon({
      html: '<div class="marker-pin"><i class="fas fa-university"></i></div>',
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -42],
    });

    L.marker([LAT, LNG], { icon: icono })
      .addTo(_map)
      .bindPopup(`
        <div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;min-width:180px">
          <strong style="font-size:13px;color:#1a237e">UTHH</strong><br>
          Universidad Tecnológica de la<br>Huasteca Hidalguense<br>
          <span style="color:#777;font-size:11px">Huejutla de Reyes, Hidalgo</span>
        </div>`, { maxWidth: 220 })
      .openPopup();

    setTimeout(() => _map.invalidateSize(), 300);
  }

  window.trazarRuta = function() {
    const statusBar = document.getElementById('mapa-ruta-status');
    const statusTxt = document.getElementById('mapa-ruta-txt');
    const btn       = document.getElementById('btnRuta');

    if (!navigator.geolocation) {
      statusBar.style.display = 'block';
      statusBar.style.background = '#ffebee';
      statusBar.style.color = '#c62828';
      statusTxt.textContent = 'Tu navegador no soporta geolocalización.';
      return;
    }

    statusBar.style.display = 'block';
    statusBar.style.background = '#fff8e1';
    statusBar.style.color = '#e65100';
    statusTxt.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px"></i> Obteniendo tu ubicación...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        function cargarRuta() {
          if (_routingControl) {
            _map.removeControl(_routingControl);
            _routingControl = null;
          }

          const iconoUsuario = L.divIcon({
            html: '<div class="marker-user"><i class="fas fa-street-view"></i></div>',
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          });

          _routingControl = L.Routing.control({
            waypoints: [
              L.latLng(userLat, userLng),
              L.latLng(LAT, LNG),
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            lineOptions: {
              styles: [{ color: '#1a237e', weight: 5, opacity: .85 }]
            },
            createMarker: function(i, wp) {
              if (i === 0) return L.marker(wp.latLng, { icon: iconoUsuario });
              const icono = L.divIcon({
                html: '<div class="marker-pin"><i class="fas fa-university"></i></div>',
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
              });
              return L.marker(wp.latLng, { icon: icono });
            }
          }).addTo(_map);

          _routingControl.on('routesfound', function(e) {
            const route    = e.routes[0];
            const distKm   = (route.summary.totalDistance / 1000).toFixed(1);
            const minutos  = Math.round(route.summary.totalTime / 60);
            statusBar.style.background = '#e8f5e9';
            statusBar.style.color = '#2e7d32';
            statusTxt.innerHTML = `<i class="fas fa-check-circle" style="margin-right:6px"></i> Ruta calculada: <strong>${distKm} km</strong> · aprox. <strong>${minutos} min</strong>`;
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-redo"></i> Recalcular';
          });

          _routingControl.on('routingerror', function() {
            statusBar.style.background = '#ffebee';
            statusBar.style.color = '#c62828';
            statusTxt.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px"></i> No se pudo calcular la ruta. Verifica tu conexión.';
            btn.disabled = false;
          });
        }

        if (window.L.Routing) {
          cargarRuta();
        } else {
          cargarScript('https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js', function() {
            cargarCSS('https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css', 'lrm-css');
            cargarRuta();
          });
        }
      },
      function(err) {
        statusBar.style.background = '#ffebee';
        statusBar.style.color = '#c62828';
        const msgs = {
          1: 'Permiso de ubicación denegado. Actívalo en tu navegador.',
          2: 'No se pudo obtener tu ubicación.',
          3: 'Tiempo de espera agotado.'
        };
        statusTxt.innerHTML = `<i class="fas fa-times-circle" style="margin-right:6px"></i> ${msgs[err.code] || 'Error de geolocalización.'}`;
        btn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  window.abrirMapaUTHH = function() {
    cargarCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'leaflet-css');
    crearModal();
    document.getElementById('modal-mapa-uthh').classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.L) {
      initMapa();
    } else {
      cargarScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', initMapa);
    }
  };

  window.cerrarMapaUTHH = function() {
    const m = document.getElementById('modal-mapa-uthh');
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarMapaUTHH();
  });
})();
