// src/lib/imageWatermark.ts
// Flutter-style GPS watermark for uploaded images.

const STATIC_MAP_KEY =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
  "AIzaSyCHt4889qXDmSbabayzrPaGBp_QJm-Eu-M";

export interface WatermarkLocation {
  lat: number;
  lng: number;
  address?: string | null;
}

const loadImage = (src: string, crossOrigin = false): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const getStaticMapUrl = (lat: number, lng: number) => {
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: "17",
    size: "400x280",
    maptype: "roadmap",
    markers: `color:red|${lat},${lng}`,
    key: STATIC_MAP_KEY,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
};

/** Same visual pin as the Flutter `_drawEnhancedPin`. */
const drawPin = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  large: boolean,
) => {
  const r = large ? 18 : 12;

  // shadow
  ctx.beginPath();
  ctx.arc(x + 3, y + 3, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.59)";
  ctx.fill();

  // glow
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,200,0,0.39)";
  ctx.fill();

  // main red
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgb(234,67,53)";
  ctx.fill();

  // white ring
  ctx.beginPath();
  ctx.arc(x, y, r - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // inner darker
  ctx.beginPath();
  ctx.arc(x, y, r - 3, 0, Math.PI * 2);
  ctx.fillStyle = "rgb(200,50,40)";
  ctx.fill();

  // center dot
  ctx.beginPath();
  ctx.arc(x, y, r / 3, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
};

/**
 * Adds the Flutter-app style GPS watermark to an image file.
 * Returns the original file untouched if anything fails.
 */
export async function addLocationWatermark(
  file: File,
  location: WatermarkLocation | null | undefined,
): Promise<File> {
  if (!location || !file.type.startsWith("image/")) return file;

  try {
    const objectUrl = URL.createObjectURL(file);
    const img = await loadImage(objectUrl);
    URL.revokeObjectURL(objectUrl);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.drawImage(img, 0, 0);

    const isLarge = img.naturalWidth > 1500;
    const margin = isLarge ? 18 : 12;
    const mapSize = isLarge ? 280 : 190;
    const barHeight = isLarge ? 320 : 210;
    const barY = canvas.height - barHeight;

    // ── gradient black bar ─────────────────────────────────────
    const gradient = ctx.createLinearGradient(0, barY, 0, canvas.height);
    gradient.addColorStop(0, "rgba(0,0,0,0.63)");
    gradient.addColorStop(1, "rgba(0,0,0,0.86)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, barY, canvas.width, barHeight);

    // ── static map (best-effort) ───────────────────────────────
    let mapImg: HTMLImageElement | null = null;
    try {
      mapImg = await loadImage(
        getStaticMapUrl(location.lat, location.lng),
        true,
      );
    } catch (e) {
      console.warn("Static map fetch failed:", e);
    }

    if (mapImg) {
      const mapX = margin;
      const mapY = canvas.height - mapSize - margin;

      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.47)";
      ctx.fillRect(mapX + 4, mapY + 4, mapSize, mapSize);

      // outer blue border
      ctx.strokeStyle = "rgb(13,71,161)";
      ctx.lineWidth = 4;
      ctx.strokeRect(mapX - 6, mapY - 6, mapSize + 12, mapSize + 12);

      // inner white border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4);

      ctx.drawImage(mapImg, mapX, mapY, mapSize, mapSize);
      drawPin(ctx, mapX + mapSize / 2, mapY + mapSize / 2, isLarge);
    }

    // ── text block ─────────────────────────────────────────────
    const textStartX = margin + mapSize + margin * 3;
    let textY = barY + (isLarge ? 20 : 15);

    // Header
    ctx.font = `bold ${isLarge ? 48 : 24}px Arial`;
    ctx.fillStyle = "rgb(100,200,255)";
    ctx.fillText("GPS Details", textStartX, textY);
    textY += (isLarge ? 58 : 34) + (isLarge ? 5 : 3);

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(textStartX, textY);
    ctx.lineTo(textStartX + (isLarge ? 400 : 250), textY);
    ctx.stroke();
    textY += isLarge ? 12 : 8;

    const smallLH = isLarge ? 34 : 28;
    ctx.font = `24px Arial`;

    // Address
    const rawAddr = (location.address || "Address not found").toString();
    const addr =
      rawAddr.length > 50 ? rawAddr.substring(0, 47) + "..." : rawAddr;
    ctx.fillStyle = "rgb(220,220,220)";
    ctx.fillText(addr, textStartX, textY);
    textY += smallLH + 5;

    // Coords
    ctx.fillStyle = "rgb(100,255,150)";
    ctx.fillText(
      `LAT: ${location.lat.toFixed(6)}°  |  LNG: ${location.lng.toFixed(6)}°`,
      textStartX,
      textY,
    );
    textY += smallLH + 5;

    // Date / time
    const now = new Date();
    const dayStr = now.toLocaleDateString("en-US", { weekday: "long" });
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const hh = String(now.getHours() % 12 || 12).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ampm = now.getHours() >= 12 ? "PM" : "AM";
    const gmt = -now.getTimezoneOffset() / 60;
    const gmtStr = gmt >= 0 ? `+${gmt}:00` : `${gmt}:00`;
    ctx.fillStyle = "rgb(255,220,100)";
    ctx.fillText(
      `${dayStr}, ${dd}/${mm}/${yyyy}  ${hh}:${min} ${ampm} GMT ${gmtStr}`,
      textStartX,
      textY,
    );

    // ── "GPS Map" badge (top-right of bar) ────────────────────
    const labelX = canvas.width - (isLarge ? 300 : 200);
    const labelY = barY + (isLarge ? 20 : 15);
    const labelWidth = isLarge ? 240 : 160;
    const labelHeight = isLarge ? 50 : 35;

    ctx.fillStyle = "rgba(13,71,161,0.78)";
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

    ctx.font = `bold ${isLarge ? 48 : 24}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      "GPS Map",
      labelX + (isLarge ? 30 : 20),
      labelY + (isLarge ? 12 : 8),
    );

    // ── MEPCO eSafety watermark (bottom-right) ────────────────
    ctx.font = `24px Arial`;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.59)";
    ctx.fillText(
      "MEPCO eSafety",
      canvas.width - (isLarge ? 20 : 12),
      canvas.height - (isLarge ? 45 : 38),
    );

    // ── export ─────────────────────────────────────────────────
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + "_watermarked.jpg";
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (e) {
    console.warn("Watermark failed, using original file:", e);
    return file;
  }
}