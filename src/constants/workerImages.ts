// Import worker images
import pylevoyBatrak from "@/assets/workers/pylevoy-batrak.png";
import ugolnyNosiltschik from "@/assets/workers/ugolny-nosiltschik.png";
import remeslennik from "@/assets/workers/remeslennik.png";
import master from "@/assets/workers/master.png";
import arkhimaster from "@/assets/workers/arkhimaster.png";
import grandMaster from "@/assets/workers/grand-master.png";
import vladykaRemesel from "@/assets/workers/vladyka-remesel.png";
import arkhontManufaktur from "@/assets/workers/arkhont-manufaktur.png";

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