import type { Workspace } from "./model";
import { validateWorkspace } from "./model";
const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("aperture-workspace", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("workspace");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
export async function readWorkspace(): Promise<Workspace | null> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("workspace", "readonly");
    const r = tx.objectStore("workspace").get("current");
    r.onsuccess = () => resolve(validateWorkspace(r.result) ? r.result : null);
    r.onerror = () => reject(r.error);
    tx.oncomplete = () => db.close();
  });
}
export async function saveWorkspace(w: Workspace) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("workspace", "readwrite");
    tx.objectStore("workspace").put(w, "current");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export function download(text: string, name: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function readImage(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error(
      "Use a PNG, JPEG or WebP image. TIFF and raw microscope formats are not supported.",
    );
  if (file.size > 12 * 1024 * 1024)
    throw new Error(
      "This image is larger than 12 MB. Export a smaller PNG or JPEG first.",
    );
  const src = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("The image could not be read."));
    r.readAsDataURL(file);
  });
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("The image could not be decoded. Try another file."));
    image.src = src;
  });
  if (image.width > 16384 || image.height > 16384)
    throw new Error("Image dimensions must be 16,384 pixels or less.");
  return { src, width: image.width, height: image.height };
}
