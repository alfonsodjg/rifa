const TOTAL_BOLETOS = 300;
const POR_HOJA = 20;

const TEXTO =
    'Rifa para una buena causa ayudemos a Marely Cuatra para que pueda estar con su bebe en casa, esta rifa se lleva a cabo con el fin de recaudar fondos para que Marley pueda hacerse una cirugía urgente de vesícula, ya que no cuenta con los recursos suficientes para hacerse la operación correcta, el costo del boleto es de $100, habrá tres ganadores y los premios serán: primer lugar una pantalla de 55 pulgadas, segundo lugar una lavadora de 11 kg y tercer lugar una bocina grande';

const CIERRE = 'ESPEREMOS CONTAR CON SU APOYO.... HOY ES ELLA, MAÑAMA PUEDES SER TU.';

function crearFondo() {
    const canvas = document.createElement('canvas');
    canvas.width = 816; // carta a 96 dpi
    canvas.height = 1056;
    const ctx = canvas.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, '#fff3f7');
    g.addColorStop(0.55, '#fad6df');
    g.addColorStop(1, '#fbabc6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(180, 140, 0, 180, 140, 520);
    glow.addColorStop(0, 'rgba(255,255,255,0.75)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.92);
}

export async function generarPdfBoletos(boletos) {
    const { jsPDF } = await import('jspdf');

    const W = 215.9; // carta en mm
    const H = 279.4;
    const M = 14; // margen
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const fondo = crearFondo();

    const mapa = new Map(boletos.map((b) => [Number(b.numero), b]));

    // ----- Medir el recuadro del texto (igual en todas las hojas) -----
    const anchoTexto = W - 2 * M - 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const lineasTexto = doc.splitTextToSize(TEXTO, anchoTexto);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const lineasCierre = doc.splitTextToSize(CIERRE, anchoTexto);

    const altoLinea = 4.3;
    const altoCierre = 5;
    const altoCard = 6 + lineasTexto.length * altoLinea + 3 + lineasCierre.length * altoCierre + 3;

    const yLista = M + altoCard + 8;
    const yFin = H - 16;
    const altoFila = Math.min(9, (yFin - yLista) / POR_HOJA);

    const totalHojas = Math.ceil(TOTAL_BOLETOS / POR_HOJA);

    for (let hoja = 0; hoja < totalHojas; hoja++) {
        if (hoja > 0) doc.addPage();

        // Fondo
        doc.addImage(fondo, 'JPEG', 0, 0, W, H, 'fondo-rosa', 'FAST');

        // Recuadro con el texto
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(248, 192, 211);
        doc.setLineWidth(0.4);
        doc.roundedRect(M, M, W - 2 * M, altoCard, 4, 4, 'FD');

        let y = M + 6 + 3;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(74, 21, 49);
        lineasTexto.forEach((l) => {
            doc.text(l, M + 6, y);
            y += altoLinea;
        });

        y += 1;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(176, 19, 79);
        lineasCierre.forEach((l) => {
            doc.text(l, W / 2, y, { align: 'center' });
            y += altoCierre;
        });

        // Lista de boletos
        for (let i = 0; i < POR_HOJA; i++) {
            const numero = hoja * POR_HOJA + i + 1;
            if (numero > TOTAL_BOLETOS) break;

            const yLinea = yLista + (i + 1) * altoFila;

            // Número
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(190, 24, 93);
            doc.text(`${numero}.`, M + 2, yLinea - 1.8);

            // Línea
            doc.setDrawColor(194, 24, 91);
            doc.setLineWidth(0.25);
            doc.line(M + 16, yLinea, W - M, yLinea);

            // Nombre (solo si está ocupado)
            const b = mapa.get(numero);
            if (b && b.estado === 'ocupado' && b.nombre) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.setTextColor(74, 21, 49);
                const nombre = doc.splitTextToSize(String(b.nombre), W - 2 * M - 20)[0];
                doc.text(nombre, M + 18, yLinea - 1.8);
            }
        }

        // Pie
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 39, 72);
        doc.text(`Hoja ${hoja + 1} de ${totalHojas}`, W / 2, H - 8, { align: 'center' });
    }

    doc.save('rifa-boletos.pdf');
}