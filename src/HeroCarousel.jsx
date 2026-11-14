import React, { useState, useRef } from 'react';
import './HeroCarousel.css';
import fotoMarely from './assets/marely.jpg';

const FOTO_MARELY = fotoMarely;

const PREMIOS = [
  { lugar: 'Primer lugar', numero: 1, titulo: 'Pantalla', detalle: '55 pulgadas', clase: 'oro' },
  { lugar: 'Segundo lugar', numero: 2, titulo: 'Lavadora', detalle: '11 kg', clase: 'plata' },
  { lugar: 'Tercer lugar', numero: 3, titulo: 'Bocina', detalle: 'Grande', clase: 'bronce' },
];

const TOTAL = 3;

export default function HeroCarousel() {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const inicioX = useRef(null);

  const siguiente = () => setActual((a) => (a + 1) % TOTAL);
  const anterior = () => setActual((a) => (a - 1 + TOTAL) % TOTAL);

  function alTocar(e) {
    inicioX.current = e.touches[0].clientX;
    setPausado(true);
  }

  function alSoltar(e) {
    if (inicioX.current !== null) {
      const dx = e.changedTouches[0].clientX - inicioX.current;
      if (Math.abs(dx) > 40) {
        if (dx < 0) siguiente();
        else anterior();
      }
    }
    inicioX.current = null;
    setPausado(false);
  }

  const claseSlide = (i) => `hc-slide ${actual === i ? 'hc-slide-active' : ''}`;

  return (
    <div
      className={`hc ${pausado ? 'hc-paused' : ''}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={alTocar}
      onTouchEnd={alSoltar}
      aria-roledescription="carrusel"
    >
      <div className="hc-track" style={{ transform: `translateX(-${actual * 100}%)` }}>
        {/* CARD 1: LA CAUSA */}
        <article className={`${claseSlide(0)} hc-causa`} aria-hidden={actual !== 0}>
          <div className="hc-photo-wrap">
            <div className="hc-photo-glow" />
            <div className="hc-photo-frame">
              {FOTO_MARELY ? (
                <img src={FOTO_MARELY} alt="Marely" />
              ) : (
                <div className="hc-photo-placeholder">💗</div>
              )}
            </div>
            <span className="hc-heart hc-heart-1">♥</span>
            <span className="hc-heart hc-heart-2">♥</span>
            <span className="hc-heart hc-heart-3">♥</span>
          </div>

          <div className="hc-text">
            <span className="hc-ticket">🎟️ 300 boletos</span>
            <p className="hc-body">
              Elige tu número en la tabla, resérvalo por WhatsApp y manda tu comprobante para confirmarlo.
            </p>
            <p className="hc-fecha">
              <strong>📅 Miércoles 18 de noviembre, 6:30 pm</strong>
              Transmisión en vivo por Facebook. Te enviaremos los detalles al teléfono que registres.
            </p>
            <p className="hc-signoff">Tu número puede ser el ganador 💖</p>
          </div>
        </article>

        {/* CARD 2: PREMIOS */}
        <article className={`${claseSlide(1)} hc-premios`} aria-hidden={actual !== 1}>
          <div className="hc-prizes-wrap">
            <h2 className="hc-title hc-title-dark">Los premios</h2>
            <div className="hc-prizes">
              {PREMIOS.map((p) => (
                <div key={p.numero} className={`hc-prize hc-prize-${p.clase}`}>
                  <span className="hc-prize-place">{p.lugar}</span>
                  <strong className="hc-prize-name">{p.titulo}</strong>
                  <span className="hc-prize-detail">{p.detalle}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* CARD 3: COSTO */}
        <article className={`${claseSlide(2)} hc-costo`} aria-hidden={actual !== 2}>
          <div className="hc-price-wrap">
            <p className="hc-kicker">Costo solo</p>
            <div className="hc-price">
              <span className="hc-currency">$</span>100
            </div>
            <p className="hc-per">por boleto</p>
          </div>

          <div className="hc-text">
            <span className="hc-ticket">🎟️ 300 boletos</span>
            <p className="hc-body">
              Elige tu número en la tabla, resérvalo por WhatsApp y manda tu comprobante para confirmarlo.
            </p>
            <p className="hc-signoff">Tu número puede ser el ganador 💖</p>
          </div>
        </article>
      </div>

      {/* PUNTOS TIPO INSTAGRAM */}
      <div className="hc-dots" role="tablist" aria-label="Ir a la tarjeta">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={actual === i}
            aria-label={`Tarjeta ${i + 1} de ${TOTAL}`}
            className={`hc-dot ${actual === i ? 'hc-dot-active' : ''}`}
            onClick={() => setActual(i)}
          >
            {actual === i && <span className="hc-dot-fill" onAnimationEnd={siguiente} />}
          </button>
        ))}
      </div>
    </div>
  );
}