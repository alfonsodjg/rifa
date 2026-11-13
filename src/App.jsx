import React, { useState, useEffect } from 'react';
import PublicView from './PublicView';
import AdminView from './AdminView';

export default function App() {
  const [ruta, setRuta] = useState(window.location.pathname);

  useEffect(() => {
    const manejarCambioRuta = () => setRuta(window.location.pathname);
    window.addEventListener('popstate', manejarCambioRuta);
    return () => window.removeEventListener('popstate', manejarCambioRuta);
  }, []);

  if (ruta.startsWith('/admin')) {
    return <AdminView />;
  }
  return <PublicView />;
}