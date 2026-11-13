import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { estVideo } from "@/lib/outils";

interface Props {
  urls: string[];
  index: number | null;
  onChange: (i: number | null) => void;
}

/** Visionneuse plein écran : flèches, Échap, lien vers l'original. */
export function Lightbox({ urls, index, onChange }: Props) {
  const ouvert = index !== null && urls[index] !== undefined;

  useEffect(() => {
    if (!ouvert) return;
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") onChange(((index ?? 0) + 1) % urls.length);
      if (e.key === "ArrowLeft") onChange(((index ?? 0) - 1 + urls.length) % urls.length);
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [ouvert, index, urls.length, onChange]);

  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu du média"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onChange(null)}
        >
          <motion.div
            key={urls[index!]}
            className="relative max-h-full max-w-5xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {estVideo(urls[index!]) ? (
              <video src={urls[index!]} controls autoPlay className="max-h-[82vh] rounded-xl" />
            ) : (
              <img src={urls[index!]} alt="" className="max-h-[82vh] rounded-xl object-contain shadow-2xl" />
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-white/70">
              <span>
                {index! + 1} / {urls.length}
              </span>
              <a href={urls[index!]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                Ouvrir l'original <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
          {urls.length > 1 && (
            <>
              <button
                aria-label="Précédent"
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange((index! - 1 + urls.length) % urls.length);
                }}
              >
                <ChevronLeft />
              </button>
              <button
                aria-label="Suivant"
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange((index! + 1) % urls.length);
                }}
              >
                <ChevronRight />
              </button>
            </>
          )}
          <button
            aria-label="Fermer"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => onChange(null)}
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
