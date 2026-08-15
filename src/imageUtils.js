const MAX_COVER_DIMENSION = 500; // px, longest side — keeps stored images compact
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB raw-file guard before we even try to read it

// Reads a File, draws it onto a canvas scaled down to MAX_COVER_DIMENSION,
// and resolves with a compact JPEG data URL. Rejects non-images and
// anything oversized before doing any real work.
export function readAndResizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.type.indexOf("image/") !== 0) {
      reject(new Error("That file doesn't look like an image."));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("That image is too large (max 8MB)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't decode that image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_COVER_DIMENSION / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch (e) {
          reject(new Error("Couldn't process that image."));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
