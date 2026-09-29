const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 350 * 1024;

export async function prepareEventImage(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Elegí una imagen desde tu dispositivo.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('La foto original supera los 15 MB. Elegí una más pequeña.');

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  try {
    image.src = objectUrl;
    await image.decode();
    let edge = 1200;
    for (let attempt = 0; attempt < 5; attempt++) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .8 - attempt * .08));
      canvas.width = canvas.height = 0;
      if (!blob || blob.type !== 'image/webp') throw new Error('Este navegador no pudo preparar la foto. Probá con Chrome o elegí un enlace público.');
      if (blob.size <= MAX_OUTPUT_BYTES) {
        const encoded = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = () => reject(new Error('No se pudo leer la foto.'));
          reader.readAsDataURL(blob);
        });
        return { mimeType: 'image/webp', data: encoded };
      }
      edge = Math.round(edge * .8);
    }
    throw new Error('No se pudo reducir la foto lo suficiente. Elegí otra imagen.');
  } catch (error) {
    if (error instanceof DOMException || error?.name === 'EncodingError') throw new Error('No se pudo abrir esta imagen. Probá con JPG, PNG o WebP.');
    throw error;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
