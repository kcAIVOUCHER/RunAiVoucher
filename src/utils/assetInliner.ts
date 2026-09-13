/**
 * Asset inliner utility: Converts image URLs to Base64 Data URIs
 * to prevent CORS/tainted canvas issues during PDF generation.
 */

export async function imageUrlToBase64(url: string, timeoutMs = 4000): Promise<string | null> {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:")) return url; // Already base64

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    // Try fetch with blob first
    fetch(url, { mode: "cors" })
      .then((res) => {
        if (!res.ok) throw new Error("Network response not ok");
        return res.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve(reader.result as string);
          }
        };
        reader.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve(null);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        // Fallback: Use Image element + Canvas
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width || 200;
            canvas.height = img.naturalHeight || img.height || 150;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL("image/png");
              if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                resolve(dataUrl);
                return;
              }
            }
          } catch {
            // Tainted canvas or draw failure
          }
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve(null);
          }
        };
        img.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve(null);
          }
        };
        img.src = url;
      });
  });
}
