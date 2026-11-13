import React, { useState, useEffect } from 'react';
import { supabase, WHATSAPP_TEL } from './supabaseClient';
import HeroCarousel from './HeroCarousel';

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'disponible', etiqueta: 'Disponibles' },
  { valor: 'ocupado', etiqueta: 'Ocupados' },
];

const PASOS = [
  { titulo: 'Elige tu(s) boleto(s)', texto: 'Revisa la tabla de boletos disponibles en el inicio.' },
  { titulo: 'Haz clic en Reservar', texto: 'Se abrirá WhatsApp de inmediato con tu selección.' },
  { titulo: 'Confirma tu pago', texto: 'Manda tu comprobante por WhatsApp para confirmar tus números.' },
];

export default function PublicView() {
  const [boletos, setBoletos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [tabActivo, setTabActivo] = useState('inicio');
  const porPagina = 10;

  useEffect(() => {
    cargarBoletos();
  }, []);

  async function cargarBoletos() {
    setCargando(true);
    const { data, error } = await supabase
      .from('boletos')
      .select('*')
      .order('numero', { ascending: true });

    if (!error && data) {
      setBoletos(data);
    }
    setCargando(false);
  }

  // Búsqueda: si es solo números, únicamente acepta del 1 al 300 (máx. 3 dígitos).
  // Si contiene letras, sigue buscando por nombre del comprador.
  function manejarBusqueda(e) {
    const valor = e.target.value.slice(0, 30);
    if (/^\d+$/.test(valor)) {
      if (valor.length > 3 || Number(valor) > 300) return;
    }
    setBusqueda(valor);
    setPagina(1);
  }

  const filtrados = boletos.filter((b) => {
    const cumpleEstado = filtro === 'todos' || b.estado === filtro;
    const numFormateado = String(b.numero).padStart(3, '0');
    const cumpleBusqueda =
      busqueda === '' ||
      numFormateado.includes(busqueda) ||
      String(b.numero) === busqueda ||
      (b.nombre && b.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    return cumpleEstado && cumpleBusqueda;
  });

  const totalPaginas = Math.ceil(filtrados.length / porPagina) || 1;
  const actuales = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const totalOcupados = boletos.filter((b) => b.estado === 'ocupado').length;
  const totalDisponibles = boletos.filter((b) => b.estado === 'disponible').length;
  const porcentaje = Math.round((totalOcupados / 300) * 100);

  const mensajeGeneralWa = encodeURIComponent(`¡Hola! Me interesa participar en la rifa y apartar boletos.`);

  return (
    <div className="page">
      {/* HEADER */}
      <header className="topbar">
        <div className="responsive-wrapper topbar-inner">
          <nav className="tabs" aria-label="Secciones">
            <button
              type="button"
              className={`tab ${tabActivo === 'inicio' ? 'tab-active' : ''}`}
              onClick={() => setTabActivo('inicio')}
            >
              Inicio
            </button>
            <button
              type="button"
              className={`tab ${tabActivo === 'como-participar' ? 'tab-active' : ''}`}
              onClick={() => setTabActivo('como-participar')}
            >
              Cómo participar
            </button>
          </nav>

          <a href="/admin" className="admin-link" title="Acceso administrador">
            🔒 <span className="admin-link-text">Admin</span>
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="responsive-wrapper hero-wrap">
        <HeroCarousel />
      </section>

      {tabActivo === 'como-participar' ? (
        <div className="responsive-wrapper">
          <div className="card card-pad">
            <h2 className="card-title">Cómo participar</h2>
            <ol className="steps">
              {PASOS.map((p, i) => (
                <li key={p.titulo} className="step">
                  <span className="step-num">{i + 1}</span>
                  <div>
                    <h4 className="step-title">{p.titulo}</h4>
                    <p className="step-text">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a
              className="btn-whatsapp"
              href={`https://wa.me/${WHATSAPP_TEL}?text=${mensajeGeneralWa}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div className="main-grid responsive-wrapper">
          {/* TABLA DE BOLETOS */}
          <div className="card card-pad">
            <div className="toolbar">
              <div className="seg" role="tablist" aria-label="Filtrar boletos">
                {FILTROS.map((f) => (
                  <button
                    key={f.valor}
                    type="button"
                    className={`seg-btn ${filtro === f.valor ? 'seg-active' : ''}`}
                    onClick={() => { setFiltro(f.valor); setPagina(1); }}
                  >
                    {f.etiqueta}
                  </button>
                ))}
              </div>

              <div className="search-box">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  className="search-input"
                  type="text"
                  inputMode="search"
                  maxLength={30}
                  placeholder="Buscar número o nombre"
                  aria-label="Buscar boleto"
                  value={busqueda}
                  onChange={manejarBusqueda}
                />
              </div>
            </div>

            {cargando ? (
              <p className="empty">Cargando...</p>
            ) : (
              <div className="table-scroll">
                <table className="table table-boletos">
                  <thead>
                    <tr>
                      <th>Boleto</th>
                      <th>Disponibilidad</th>
                      <th>Nombre</th>
                      <th className="th-right" aria-label="Reservar"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {actuales.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty">Sin resultados.</td>
                      </tr>
                    ) : (
                      actuales.map((b) => {
                        const numStr = String(b.numero).padStart(3, '0');
                        const disp = b.estado === 'disponible';
                        const mensajeWa = encodeURIComponent(`¡Hola! Me interesa apartar el boleto #${numStr} de la rifa.`);

                        return (
                          <tr key={b.numero}>
                            <td><span className="num">#{numStr}</span></td>
                            <td>
                              <span className={`pill ${disp ? 'pill-ok' : 'pill-off'}`}>
                                {disp ? 'Disponible' : 'Ocupado'}
                              </span>
                            </td>
                            <td className={`buyer ${disp ? 'muted' : ''}`}>
                              {disp ? '—' : (b.nombre || 'Ocupado')}
                            </td>
                            <td className="td-right">
                              {disp ? (
                                <a
                                  className="btn-reservar"
                                  href={`https://wa.me/${WHATSAPP_TEL}?text=${mensajeWa}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Reservar
                                </a>
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {totalPaginas > 1 && (
              <div className="pager">
                <button
                  type="button"
                  className="pager-btn"
                  disabled={pagina === 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  ‹ Anterior
                </button>
                <span className="pager-info">{pagina} / {totalPaginas}</span>
                <button
                  type="button"
                  className="pager-btn"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente ›
                </button>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="card card-pad">
              <h3 className="card-title-sm">Resumen</h3>
              <div className="summary-row">
                <span>Costo</span>
                <strong>$100 por boleto</strong>
              </div>
              <div className="summary-row">
                <span>Total de boletos</span>
                <strong>300</strong>
              </div>
              {!cargando && (
                <>
                  <div className="summary-row">
                    <span>Disponibles</span>
                    <strong>{totalDisponibles}</strong>
                  </div>
                  <div className="progress" aria-label={`${porcentaje}% vendido`}>
                    <div className="progress-bar" style={{ width: `${porcentaje}%` }} />
                  </div>
                  <p className="progress-text">{totalOcupados} de 300 boletos ocupados</p>
                </>
              )}
              <p className="note">Manda tu comprobante por WhatsApp para confirmar tus números.</p>
            </div>
          </aside>
        </div>
      )}

      <footer className="footer">¡Buena suerte! 💖</footer>
    </div>
  );
}