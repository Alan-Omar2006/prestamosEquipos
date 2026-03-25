
async function subirImagenCloudinary(file, folder) {
  const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_BYTES        = 5 * 1024 * 1024; 

  if (!file) throw new Error('No se seleccionó ningún archivo.');
  if (!TIPOS_PERMITIDOS.includes(file.type))
    throw new Error('Solo se permiten imágenes JPG, PNG o WEBP.');
  if (file.size > MAX_BYTES)
    throw new Error('La imagen no debe superar 5 MB.');

  const signRes = await fetch(`${API_URL}/api/upload/sign`, {
    method:  'POST',
    headers: authHeaders(true),
    body:    JSON.stringify({ folder }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener firma de Cloudinary.');
  }

  const { signature, timestamp, api_key, cloud_name } = await signRes.json();

  const formData = new FormData();
  formData.append('file',      file);
  formData.append('folder',    folder);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('api_key',   api_key);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: 'POST', body: formData }
  );

  const uploadData = await uploadRes.json();

  if (!uploadData.secure_url) {
    const msg = uploadData.error?.message || 'Cloudinary rechazó la imagen.';
    throw new Error(msg);
  }

  return uploadData.secure_url;
}

function configurarInputImagen(inputEl, previewEl, folder, onResult) {
  const defaultSrc = previewEl.dataset.default || previewEl.src;

  inputEl.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) {
      previewEl.src = defaultSrc;
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => { previewEl.src = ev.target.result; };
    reader.readAsDataURL(file);

    inputEl.disabled = true;
    if (onResult) onResult(null, null, true);

    try {
      const url = await subirImagenCloudinary(file, folder);
      if (onResult) onResult(url, null, false);
    } catch (err) {
      previewEl.src = defaultSrc;
      inputEl.value = '';
      if (onResult) onResult(null, err.message, false);
    } finally {
      inputEl.disabled = false;
    }
  });
}
