// Carusel vizualizácií na úvodnej stránke. Prepínanie šípkami + bodkami,
// automatické posúvanie. Klik na obrázok otvorí fullscreen náhľad (lightbox)
// s možnosťou stiahnutia. Prehliadka sa spúšťa tlačidlom POD caruselom.

import { useCallback, useEffect, useState } from 'react';

export default function Carousel({ slides }) {
  const [i, setI] = useState(0);
  const [lightbox, setLightbox] = useState(null); // index otvoreného obrázka alebo null
  const n = slides.length;

  // auto-posúvanie (pozastavené, keď je otvorený lightbox)
  useEffect(() => {
    if (n <= 1 || lightbox !== null) return undefined;
    const t = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, lightbox]);

  const go = (d) => setI((p) => (p + d + n) % n);
  const goLb = useCallback((d) => setLightbox((p) => (p === null ? p : (p + d + n) % n)), [n]);

  // klávesnica v lightboxe: Esc zavrie, šípky prepínajú
  useEffect(() => {
    if (lightbox === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowLeft') goLb(-1);
      else if (e.key === 'ArrowRight') goLb(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, goLb]);

  // stiahnutie aktuálneho obrázka (fetch → blob, nech sa naozaj stiahne)
  const download = useCallback(async (src, caption) => {
    if (!src) return;
    const name = (caption ? caption.replace(/[^\w-]+/g, '_') : src.split('/').pop().split('.')[0]) || 'vizualizacia';
    const ext = (src.split('.').pop() || 'jpg').split(/[?#]/)[0];
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback: otvor v novej karte, keď fetch zlyhá (napr. CORS)
      window.open(src, '_blank', 'noopener');
    }
  }, []);

  if (n === 0) return null;
  const idx = Math.min(i, n - 1);
  const slide = slides[idx];
  const lbSlide = lightbox !== null ? slides[lightbox] : null;

  return (
    <div className="lc">
      <div className="lc__stage">
        {slides.map((s, k) => (
          <div
            key={s.id}
            className={`lc__slide ${k === idx ? 'is-active' : ''} ${s.image ? 'is-zoomable' : ''}`}
            style={s.image ? { backgroundImage: `url(${s.image})` } : undefined}
            onClick={s.image && k === idx ? () => setLightbox(k) : undefined}
            title={s.image ? 'Klikni pre zväčšenie' : undefined}
          >
            {!s.image && <span className="lc__ph">Vizualizácia</span>}
          </div>
        ))}

        {(slide.caption || slide.image) && (
          <div className="lc__overlay">
            {slide.caption && <p className="lc__caption">{slide.caption}</p>}
            {slide.image && (
              <button
                type="button"
                className="lc__zoom-hint"
                onClick={() => setLightbox(idx)}
                aria-label="Zväčšiť obrázok"
              >
                ⤢ Zväčšiť
              </button>
            )}
          </div>
        )}

        {n > 1 && (
          <>
            <button type="button" className="lc__arrow lc__arrow--prev" onClick={() => go(-1)} aria-label="Predchádzajúci">‹</button>
            <button type="button" className="lc__arrow lc__arrow--next" onClick={() => go(1)} aria-label="Ďalší">›</button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="lc__dots">
          {slides.map((s, k) => (
            <button
              key={s.id}
              type="button"
              className={`lc__dot ${k === idx ? 'is-active' : ''}`}
              onClick={() => setI(k)}
              aria-label={`Slide ${k + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox — fullscreen náhľad + stiahnutie */}
      {lbSlide && (
        <div className="lb" onClick={() => setLightbox(null)}>
          <div className="lb__bar" onClick={(e) => e.stopPropagation()}>
            {lbSlide.caption && <span className="lb__title">{lbSlide.caption}</span>}
            <div className="lb__actions">
              <button type="button" className="lb__btn" onClick={() => download(lbSlide.image, lbSlide.caption)}>
                ⬇ Stiahnuť
              </button>
              <button type="button" className="lb__btn lb__btn--close" onClick={() => setLightbox(null)} aria-label="Zavrieť">✕</button>
            </div>
          </div>

          <img
            className="lb__img"
            src={lbSlide.image}
            alt={lbSlide.caption || 'Vizualizácia'}
            onClick={(e) => e.stopPropagation()}
          />

          {n > 1 && (
            <>
              <button type="button" className="lb__arrow lb__arrow--prev" onClick={(e) => { e.stopPropagation(); goLb(-1); }} aria-label="Predchádzajúci">‹</button>
              <button type="button" className="lb__arrow lb__arrow--next" onClick={(e) => { e.stopPropagation(); goLb(1); }} aria-label="Ďalší">›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
