import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const MAX_EMAIL = 60;
const MAX_PASSWORD = 72; // límite real de Supabase/bcrypt; evita bloquear contraseñas existentes
const MAX_NOMBRE = 40;
const MAX_TELEFONO = 10;

// Etiqueta con contador "n/max" a la derecha
function Etiqueta({ texto, valor, max, ayuda }) {
  return (
    <div className="field-head">
      <label className="field-label">{texto}</label>
      <span className={`counter ${max && valor.length >= max ? 'counter-full' : ''}`}>
        {max ? `${valor.length}/${max}` : ayuda}
      </span>
    </div>
  );
}

const iconoProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function IconoLapiz() {
  return (
    <svg {...iconoProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconoBasura() {
  return (
    <svg {...iconoProps}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconoCompartir() {
  return (
    <svg {...iconoProps}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

const POR_PAGINA = 10;

export default function AdminView() {
  const [sesion, setSesion] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  const [numero, setNumero] = useState('');
  const [estado, setEstado] = useState('ocupado');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [alerta, setAlerta] = useState({ tipo: '', texto: '' });
  const [ocupados, setOcupados] = useState([]);

  // Modal (editar o liberar): null | { tipo: 'editar' | 'liberar', numero, nombre }
  const [modal, setModal] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Paginación de la lista de vendidos y aviso de "enlace copiado"
  const [paginaAdmin, setPaginaAdmin] = useState(1);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      if (session) cargarOcupados();
    });
  }, []);

  // Cerrar el modal con Escape y bloquear el scroll de fondo mientras está abierto
  useEffect(() => {
    if (!modal) return;
    const alPresionar = (e) => { if (e.key === 'Escape') cerrarModal(); };
    window.addEventListener('keydown', alPresionar);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [modal]);

  async function cargarOcupados() {
    const { data } = await supabase
      .from('boletos')
      .select('*')
      .eq('estado', 'ocupado')
      .order('numero', { ascending: true });
    if (data) setOcupados(data);
  }

  async function iniciarSesion(e) {
    e.preventDefault();
    setErrorLogin('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorLogin('Credenciales incorrectas.');
    } else {
      setSesion(data.session);
      cargarOcupados();
    }
  }

  // Número de boleto: solo dígitos, máximo 3, entre 1 y 300
  function manejarNumero(e) {
    const valor = e.target.value;
    if (valor === '' || (/^\d{1,3}$/.test(valor) && Number(valor) <= 300)) {
      setNumero(valor);
    }
  }

  // Teléfono: solo dígitos, máximo 10
  function manejarTelefono(e) {
    setTelefono(e.target.value.replace(/\D/g, '').slice(0, MAX_TELEFONO));
  }

  function manejarTelefonoModal(e) {
    setEditTelefono(e.target.value.replace(/\D/g, '').slice(0, MAX_TELEFONO));
  }

  // ---------- Compartir la web pública ----------
  async function compartirWeb() {
    const url = window.location.origin + '/';
    const datos = {
      title: 'Rifa con causa',
      text: 'Rifa con causa: apoya a Marely con tu boleto 💖',
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(datos);
      } catch (err) {
        // El usuario canceló el menú de compartir; no hay nada que hacer
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      window.prompt('Copia este enlace:', url);
    }
  }

  // ---------- Modal ----------
  function abrirEditar(b) {
    setEditNombre(b.nombre || '');
    setEditTelefono(b.telefono || '');
    setErrorModal('');
    setModal({ tipo: 'editar', numero: b.numero, nombre: b.nombre });
  }

  function abrirLiberar(b) {
    setErrorModal('');
    setModal({ tipo: 'liberar', numero: b.numero, nombre: b.nombre });
  }

  function cerrarModal() {
    setModal(null);
    setErrorModal('');
    setGuardando(false);
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    if (!editNombre.trim()) {
      setErrorModal('Escribe el nombre.');
      return;
    }
    if (editTelefono.length !== MAX_TELEFONO) {
      setErrorModal('El teléfono debe tener 10 dígitos.');
      return;
    }

    setGuardando(true);
    setErrorModal('');
    const { data, error } = await supabase
      .from('boletos')
      .update({ nombre: editNombre.trim(), telefono: editTelefono.trim() })
      .eq('numero', modal.numero)
      .eq('estado', 'ocupado')
      .select();

    if (error) {
      setErrorModal('Error: ' + error.message);
      setGuardando(false);
    } else if (!data || data.length === 0) {
      setErrorModal('Este boleto ya no está vendido.');
      setGuardando(false);
    } else {
      setAlerta({ tipo: 'exito', texto: `✅ Boleto #${modal.numero} actualizado.` });
      cerrarModal();
      cargarOcupados();
    }
  }

  async function confirmarLiberar() {
    setGuardando(true);
    setErrorModal('');
    const { error } = await supabase
      .from('boletos')
      .update({ estado: 'disponible', nombre: null, telefono: null })
      .eq('numero', modal.numero);

    if (error) {
      setErrorModal('Error: ' + error.message);
      setGuardando(false);
    } else {
      setAlerta({ tipo: 'exito', texto: `✅ Boleto #${modal.numero} liberado.` });
      cerrarModal();
      cargarOcupados();
    }
  }

  // ---------- Formulario principal ----------
  async function actualizarBoleto(e) {
    e.preventDefault();
    const numInt = parseInt(numero, 10);

    if (!numInt || numInt < 1 || numInt > 300) {
      setAlerta({ tipo: 'error', texto: 'El boleto debe ser del 1 al 300.' });
      return;
    }
    if (estado === 'ocupado' && telefono.length !== MAX_TELEFONO) {
      setAlerta({ tipo: 'error', texto: 'El teléfono debe tener 10 dígitos.' });
      return;
    }

    setAlerta({ tipo: '', texto: 'Guardando...' });

    if (estado === 'ocupado') {
      const { data, error } = await supabase
        .from('boletos')
        .update({ estado: 'ocupado', nombre: nombre.trim(), telefono: telefono.trim() })
        .eq('numero', numInt)
        .eq('estado', 'disponible')
        .select();

      if (error) {
        setAlerta({ tipo: 'error', texto: 'Error: ' + error.message });
      } else if (!data || data.length === 0) {
        setAlerta({ tipo: 'error', texto: `⚠️ El boleto #${numInt} ya está vendido. Usa el lápiz de la lista para editarlo.` });
      } else {
        setAlerta({ tipo: 'exito', texto: `✅ Boleto #${numInt} vendido a ${nombre}.` });
        setNumero(''); setNombre(''); setTelefono('');
        cargarOcupados();
      }
    } else {
      const { error } = await supabase
        .from('boletos')
        .update({ estado: 'disponible', nombre: null, telefono: null })
        .eq('numero', numInt);

      if (error) {
        setAlerta({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        setAlerta({ tipo: 'exito', texto: `✅ Boleto #${numInt} liberado.` });
        setNumero('');
        cargarOcupados();
      }
    }
  }

  const totalPaginasAdmin = Math.ceil(ocupados.length / POR_PAGINA) || 1;
  const paginaSegura = Math.min(paginaAdmin, totalPaginasAdmin);
  const paginados = ocupados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  // ---------- LOGIN ----------
  if (!sesion) {
    return (
      <div className="admin-page admin-center">
        <div className="login-card">
          <div className="brand-mark brand-mark-lg">🔒</div>
          <h2 className="login-title">Panel Admin</h2>
          <p className="login-sub">Ingresa con tu cuenta para administrar los boletos.</p>

          <form onSubmit={iniciarSesion} className="form">
            <div>
              <Etiqueta texto="Correo electrónico" valor={email} max={MAX_EMAIL} />
              <input
                className="input"
                type="email"
                placeholder="correo@ejemplo.com"
                maxLength={MAX_EMAIL}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <Etiqueta texto="Contraseña" valor={password} max={MAX_PASSWORD} />
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                maxLength={MAX_PASSWORD}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary">Entrar</button>
          </form>

          {errorLogin && <p className="login-error">{errorLogin}</p>}

          <a href="/" className="back-link">← Volver al inicio</a>
        </div>
      </div>
    );
  }

  // ---------- PANEL ----------
  return (
    <div className="admin-page">
      <div className="admin-wrapper">
        <div className="card card-pad">
          <div className="admin-head">
            <h2 className="card-title-sm">Boletos</h2>
            <div className="admin-actions">
              <a href="/" className="btn-ghost">Ver web</a>
              <button type="button" className="btn-ghost btn-ghost-icon" onClick={compartirWeb}>
                <IconoCompartir />
                {copiado ? '¡Enlace copiado!' : 'Compartir'}
              </button>
              <button
                type="button"
                className="btn-ghost btn-ghost-danger"
                onClick={() => supabase.auth.signOut().then(() => setSesion(null))}
              >
                Salir
              </button>
            </div>
          </div>

          <form onSubmit={actualizarBoleto} className="form">
            <div>
              <Etiqueta texto="Boleto" valor={numero} ayuda="1 - 300" />
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min="1"
                max="300"
                placeholder="Ej. 25"
                value={numero}
                onChange={manejarNumero}
                required
              />
            </div>

            <div>
              <Etiqueta texto="Marcar como" valor="" ayuda="" />
              <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="ocupado">Vendido</option>
                <option value="disponible">Disponible</option>
              </select>
            </div>

            {estado === 'ocupado' && (
              <>
                <div>
                  <Etiqueta texto="Nombre" valor={nombre} max={MAX_NOMBRE} />
                  <input
                    className="input"
                    type="text"
                    maxLength={MAX_NOMBRE}
                    placeholder="Nombre del comprador"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Etiqueta texto="Teléfono" valor={telefono} max={MAX_TELEFONO} />
                  <input
                    className="input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={MAX_TELEFONO}
                    placeholder="10 dígitos"
                    value={telefono}
                    onChange={manejarTelefono}
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn-save">Guardar</button>
          </form>

          {alerta.texto && (
            <div className={`alert ${alerta.tipo === 'error' ? 'alert-error' : alerta.tipo === 'exito' ? 'alert-ok' : 'alert-info'}`}>
              {alerta.texto}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="card-title-sm">Vendidos ({ocupados.length} / 300)</h3>
          {ocupados.length === 0 ? (
            <p className="empty-left">Aún no hay boletos vendidos.</p>
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th className="th-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((b) => {
                    const numStr = String(b.numero).padStart(3, '0');
                    return (
                      <tr key={b.numero}>
                        <td><span className="num">#{numStr}</span></td>
                        <td>{b.nombre}</td>
                        <td className="muted">{b.telefono}</td>
                        <td className="td-right">
                          <span className="row-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              title="Editar"
                              aria-label={`Editar boleto ${numStr}`}
                              onClick={() => abrirEditar(b)}
                            >
                              <IconoLapiz />
                            </button>
                            <button
                              type="button"
                              className="icon-btn icon-btn-danger"
                              title="Liberar"
                              aria-label={`Liberar boleto ${numStr}`}
                              onClick={() => abrirLiberar(b)}
                            >
                              <IconoBasura />
                            </button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPaginasAdmin > 1 && (
            <div className="pager">
              <button
                type="button"
                className="pager-btn"
                disabled={paginaSegura === 1}
                onClick={() => setPaginaAdmin(paginaSegura - 1)}
              >
                ‹ Anterior
              </button>
              <span className="pager-info">{paginaSegura} / {totalPaginasAdmin}</span>
              <button
                type="button"
                className="pager-btn"
                disabled={paginaSegura === totalPaginasAdmin}
                onClick={() => setPaginaAdmin(paginaSegura + 1)}
              >
                Siguiente ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: editar o liberar */}
      {modal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {modal.tipo === 'editar' ? (
              <form onSubmit={guardarEdicion} className="form">
                <h3 className="modal-title">Editar boleto #{String(modal.numero).padStart(3, '0')}</h3>
                <div>
                  <Etiqueta texto="Nombre" valor={editNombre} max={MAX_NOMBRE} />
                  <input
                    className="input"
                    type="text"
                    maxLength={MAX_NOMBRE}
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <Etiqueta texto="Teléfono" valor={editTelefono} max={MAX_TELEFONO} />
                  <input
                    className="input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={MAX_TELEFONO}
                    value={editTelefono}
                    onChange={manejarTelefonoModal}
                    required
                  />
                </div>
                {errorModal && <p className="modal-error">{errorModal}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={guardando}>Guardar</button>
                </div>
              </form>
            ) : (
              <div className="form">
                <h3 className="modal-title">¿Liberar el boleto #{String(modal.numero).padStart(3, '0')}?</h3>
                <p className="modal-text">
                  Se borrarán el nombre y el teléfono{modal.nombre ? ` de ${modal.nombre}` : ''} y el boleto quedará disponible.
                </p>
                {errorModal && <p className="modal-error">{errorModal}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={cerrarModal}>Cancelar</button>
                  <button type="button" className="btn-danger" onClick={confirmarLiberar} disabled={guardando}>Liberar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}