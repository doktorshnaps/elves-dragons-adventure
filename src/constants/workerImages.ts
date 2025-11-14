// Worker images will be added later - using placeholder for now
// TODO: Add worker images to src/assets/workers/

// Placeholder image for workers
const placeholderWorker = "/placeholder.svg";
const pylevoyBatrak = placeholderWorker;
const ugolnyNosiltschik = placeholderWorker;
const remeslennik = placeholderWorker;
const master = placeholderWorker;
const arkhimaster = placeholderWorker;
const grandMaster = placeholderWorker;
const vladykaRemesel = placeholderWorker;
const arkhontManufaktur = placeholderWorker;

// Worker images mapping by worker name (Russian)
export const workerImagesByName: Record<string, string> = {
  "Пылевой Батрак": pylevoyBatrak,
  "Угольный Носильщик": ugolnyNosiltschik,
  "Ремесленник": remeslennik,
  "Мастер": master,
  "Архимастер": arkhimaster,
  "Гранд-мастер": grandMaster,
  "Владыка ремесел": vladykaRemesel,
  "Архонт мануфактур": arkhontManufaktur
};

// Worker images mapping by worker id
export const workerImagesById: Record<number, string> = {
  2: pylevoyBatrak,
  3: ugolnyNosiltschik,
  4: remeslennik,
  5: master,
  6: arkhimaster,
  7: grandMaster,
  8: vladykaRemesel,
  9: arkhontManufaktur
};

// Array of all worker images for preloading
export const allWorkerImages = [
  pylevoyBatrak,
  ugolnyNosiltschik,
  remeslennik,
  master,
  arkhimaster,
  grandMaster,
  vladykaRemesel,
  arkhontManufaktur
];