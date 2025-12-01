// SVG Generator for CNC/Plotter cutting files
// Generates professional technical drawings with front view optimization
// Always uses FRONT VIEW (largo x alto) for optimal irregular shape capture

import { Component } from './types';

// Fixed SVG canvas dimensions for cutting files
const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const PADDING = 60; // Padding from edges for technical info
const INFO_MARGIN = 40; // Space for technical information

// Helper to create dimension lines with arrows and measurements
function createDimensionLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  measurement: string,
  offset: number,
  isVertical: boolean
): string {
  const arrowSize = 6; // Larger arrows for better visibility
  const strokeWidth = 2; // Thicker lines
  const fontSize = 16; // Larger font
  let elements = '';

  if (isVertical) {
    // Vertical dimension line
    const x = x1 + offset;
    const midY = (y1 + y2) / 2;

    // Extension lines
    elements += `<line x1="${x1}" y1="${y1}" x2="${x}" y2="${y1}" stroke="#0000FF" stroke-width="${strokeWidth}"/>`;
    elements += `<line x1="${x2}" y1="${y2}" x2="${x}" y2="${y2}" stroke="#0000FF" stroke-width="${strokeWidth}"/>`;

    // Main dimension line
    elements += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#0000FF" stroke-width="${strokeWidth}"/>`;

    // Arrows
    elements += `<path d="M${x},${y1} L${x - arrowSize},${y1 + arrowSize} L${x + arrowSize},${y1 + arrowSize} Z" fill="#0000FF"/>`;
    elements += `<path d="M${x},${y2} L${x - arrowSize},${y2 - arrowSize} L${x + arrowSize},${y2 - arrowSize} Z" fill="#0000FF"/>`;

    // Measurement text
    elements += `<text x="${x + 10}" y="${midY}" font-family="Arial" font-size="${fontSize}" fill="#0000FF" dominant-baseline="middle">${measurement}</text>`;
  } else {
    // Horizontal dimension line
    const y = y1 + offset;
    const midX = (x1 + x2) / 2;

    // Extension lines
    elements += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y}" stroke="#0000FF" stroke-width="${strokeWidth}"/>`;
    elements += `<line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y}" stroke="#0000FF" stroke-width="${strokeWidth}"/>`;

    // Main dimension line
    elements += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#0000FF" stroke-width="${strokeWidth}"/>`;

    // Arrows
    elements += `<path d="M${x1},${y} L${x1 + arrowSize},${y - arrowSize} L${x1 + arrowSize},${y + arrowSize} Z" fill="#0000FF"/>`;
    elements += `<path d="M${x2},${y} L${x2 - arrowSize},${y - arrowSize} L${x2 - arrowSize},${y + arrowSize} Z" fill="#0000FF"/>`;

    // Measurement text
    elements += `<text x="${midX}" y="${y - 5}" font-family="Arial" font-size="${fontSize}" fill="#0000FF" text-anchor="middle">${measurement}</text>`;
  }

  return elements;
}

// Helper to format measurement in cm or m
function formatMeasurement(mm: number): string {
  const cm = mm / 10;
  if (cm >= 100) {
    return `${(cm / 100).toFixed(2).replace(/\.00$/, '')} m`;
  }
  return `${cm.toFixed(1).replace(/\.0$/, '')} cm`;
}

// Helper to create registration marks (corner alignment marks)
function createRegistrationMark(x: number, y: number, size: number = 10): string {
  return `
    <g class="registration-mark">
      <circle cx="${x}" cy="${y}" r="${size / 2}" fill="none" stroke="#000000" stroke-width="0.5"/>
      <line x1="${x - size}" y1="${y}" x2="${x + size}" y2="${y}" stroke="#000000" stroke-width="0.5"/>
      <line x1="${x}" y1="${y - size}" x2="${x}" y2="${y + size}" stroke="#000000" stroke-width="0.5"/>
    </g>`;
}

// Helper to create graphic scale bar
function createScaleBar(x: number, y: number, realMm: number, scale: number): string {
  const barLength = 100; // pixels
  const realLength = barLength / scale;
  const segments = 5;
  const segmentLength = barLength / segments;

  let scaleElements = `<g class="scale-bar">`;

  // Scale bar segments
  for (let i = 0; i < segments; i++) {
    const fill = i % 2 === 0 ? '#000000' : '#ffffff';
    scaleElements += `<rect x="${x + i * segmentLength}" y="${y}" width="${segmentLength}" height="8" fill="${fill}" stroke="#000000" stroke-width="0.5"/>`;
  }

  // Scale text
  scaleElements += `<text x="${x + barLength / 2}" y="${y + 20}" font-family="Arial" font-size="10" fill="#000000" text-anchor="middle">Escala: ${formatMeasurement(realLength)}</text>`;
  scaleElements += `</g>`;

  return scaleElements;
}

// Helper to create technical info box
function createTechnicalInfo(component: Component, x: number, y: number): string {
  const lineHeight = 14;
  let currentY = y;

  return `
    <g class="technical-info">
      <text x="${x}" y="${currentY}" font-family="Arial" font-size="12" font-weight="bold" fill="#000000">INFORMACIÓN TÉCNICA</text>
      ${currentY += lineHeight, ''}
      <text x="${x}" y="${currentY}" font-family="Arial" font-size="10" fill="#000000">Componente: ${component.nombre}</text>
      ${currentY += lineHeight, ''}
      <text x="${x}" y="${currentY}" font-family="Arial" font-size="10" fill="#000000">Material: ${component.material.tipo}</text>
      ${currentY += lineHeight, ''}
      <text x="${x}" y="${currentY}" font-family="Arial" font-size="10" fill="#000000">Grosor: ${component.dimensiones.ancho} ${component.dimensiones.unidad}</text>
      ${currentY += lineHeight, ''}
      <text x="${x}" y="${currentY}" font-family="Arial" font-size="10" fill="#000000">Cantidad: ${component.material.cantidad} ${component.material.unidadCantidad}</text>
      ${currentY += lineHeight, ''}
      <text x="${x}" y="${currentY}" font-family="Arial" font-size="10" fill="#000000">Vista: FRONTAL (${formatMeasurement((component.dimensiones.largo || 100) * 10)} × ${formatMeasurement((component.dimensiones.alto || 100) * 10)})</text>
    </g>`;
}

export function generateSVG(component: Component): string {
  // FRONT VIEW OPTIMIZATION: Always use largo (width) x alto (height)
  // This ensures irregular shapes are captured from the most informative perspective
  const realWidthMm = (component.dimensiones.largo || 100) * 10;
  const realHeightMm = (component.dimensiones.alto || 100) * 10;
  const realDepthMm = (component.dimensiones.ancho || 10) * 10; // Depth/thickness

  // Calculate scaling to fit within SVG canvas (leaving padding)
  // We want to simulate the piece being cut from a larger sheet, so we align it to top-left
  // But we still need to scale it to fit the view if it's huge, or fill it if it's small.
  // The user wants "proportional scaling" where the piece takes up ~90% of the view.

  const maxDrawWidth = SVG_WIDTH - (PADDING * 2);
  const maxDrawHeight = SVG_HEIGHT - (PADDING * 2);

  const scaleX = maxDrawWidth / realWidthMm;
  const scaleY = maxDrawHeight / realHeightMm;

  const scale = Math.min(scaleX, scaleY);

  const drawWidth = realWidthMm * scale;
  const drawHeight = realHeightMm * scale;

  // Align to Top-Left (simulating nesting in a sheet corner)
  // We leave PADDING for the dimension lines.
  const startX = PADDING;
  const startY = PADDING;

  // Dimension offsets (scaled visually)
  const dimOffset = 30;

  // Pattern definitions for professional cutting files
  const patterns = `
  <defs>
    <!-- Pattern for useful material (light wood grain effect) -->
    <pattern id="usefulMaterial" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="30" height="30" fill="#fef9f3"/>
      <line x1="0" y1="5" x2="30" y2="5" stroke="#e8dcc8" stroke-width="0.5"/>
      <line x1="0" y1="15" x2="30" y2="15" stroke="#e8dcc8" stroke-width="0.5"/>
      <line x1="0" y1="25" x2="30" y2="25" stroke="#e8dcc8" stroke-width="0.5"/>
    </pattern>

    <!-- Pattern for waste material (grid) -->
    <pattern id="wasteMaterial" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="20" height="20" fill="#f8f8f8"/>
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
    </pattern>
    
    <!-- Marker for fold lines -->
    <marker id="foldArrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF0000"/>
    </marker>
  </defs>`;

  let pieceElements = '';

  const forma = component.dimensiones.forma || 'rectangulo';

  switch (forma) {
    case 'circulo':
      // Use largo/alto as diameter/bounding box
      const rx = drawWidth / 2;
      const ry = drawHeight / 2;
      const cx = startX + rx;
      const cy = startY + ry;
      pieceElements = `
      <!-- Circle/Ellipse -->
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
            fill="url(#usefulMaterial)" stroke="#000000" stroke-width="3"/>`;
      break;

    case 'triangulo':
      // Triangle (isosceles pointing up by default)
      const p1 = `${startX + drawWidth / 2},${startY}`; // Top center
      const p2 = `${startX},${startY + drawHeight}`; // Bottom left
      const p3 = `${startX + drawWidth},${startY + drawHeight}`; // Bottom right
      pieceElements = `
      <!-- Triangle -->
      <polygon points="${p1} ${p2} ${p3}" 
            fill="url(#usefulMaterial)" stroke="#000000" stroke-width="3"/>`;
      break;

    case 'L':
      // L-shape (simple approximation)
      // Assume 1/3 thickness for the arms
      const thickX = drawWidth / 3;
      const thickY = drawHeight / 3;
      const lPoints = `
        ${startX},${startY} 
        ${startX + thickX},${startY} 
        ${startX + thickX},${startY + drawHeight - thickY} 
        ${startX + drawWidth},${startY + drawHeight - thickY} 
        ${startX + drawWidth},${startY + drawHeight} 
        ${startX},${startY + drawHeight}
      `;
      pieceElements = `
      <!-- L-Shape -->
      <polygon points="${lPoints.trim().replace(/\s+/g, ' ')}" 
            fill="url(#usefulMaterial)" stroke="#000000" stroke-width="3"/>`;
      break;

    case 'irregular':
      if (component.svgPath) {
        // FRONT VIEW: Use provided path from AI, scaled to fit
        // Path is in normalized 0-100 coordinate space (front view: largo x alto)
        pieceElements = `
        <!-- Irregular Shape - Front View (${formatMeasurement(realWidthMm)} × ${formatMeasurement(realHeightMm)}) -->
        <g transform="translate(${startX}, ${startY}) scale(${drawWidth / 100}, ${drawHeight / 100})">
          <!-- Cutting line (black, solid) -->
          <path d="${component.svgPath}" 
                fill="url(#usefulMaterial)" 
                stroke="#000000" 
                stroke-width="2" 
                vector-effect="non-scaling-stroke"
                stroke-linecap="round"
                stroke-linejoin="round"/>
          ${component.foldPath ? `
          <!-- Fold line (red, dashed) -->
          <path d="${component.foldPath}" 
                fill="none" 
                stroke="#FF0000" 
                stroke-width="1.5" 
                stroke-dasharray="8,4" 
                vector-effect="non-scaling-stroke"
                marker-mid="url(#foldArrow)"/>` : ''}
        </g>`;
      } else {
        // Fallback: Rectangle with warning
        pieceElements = `
        <!-- Irregular Shape Fallback - Path Not Provided -->
        <rect x="${startX}" y="${startY}" width="${drawWidth}" height="${drawHeight}" 
              fill="url(#usefulMaterial)" stroke="#FF6600" stroke-width="3" stroke-dasharray="10,5"/>
        <text x="${startX + drawWidth / 2}" y="${startY + drawHeight / 2}" 
              font-family="Arial" font-size="20" fill="#FF6600" text-anchor="middle" dominant-baseline="middle" font-weight="bold">⚠ FORMA IRREGULAR</text>
        <text x="${startX + drawWidth / 2}" y="${startY + drawHeight / 2 + 25}" 
              font-family="Arial" font-size="12" fill="#666666" text-anchor="middle" dominant-baseline="middle">Definir path SVG para corte preciso</text>`;
      }
      break;

    case 'rectangulo':
    default:
      pieceElements = `
      <!-- Rectangle -->
      <rect x="${startX}" y="${startY}" width="${drawWidth}" height="${drawHeight}" 
            fill="url(#usefulMaterial)" stroke="#000000" stroke-width="3"/>`;
      break;
  }

  // Dimension lines (using draw coordinates but REAL measurements formatted in cm/m)
  const dimensions = `
  <!-- Horizontal dimension (width) -->
  ${createDimensionLine(startX, startY + drawHeight, startX + drawWidth, startY + drawHeight, formatMeasurement(realWidthMm), dimOffset, false)}
  
  <!-- Vertical dimension (height) -->
  ${createDimensionLine(startX + drawWidth, startY, startX + drawWidth, startY + drawHeight, formatMeasurement(realHeightMm), dimOffset, true)}`;

  // Registration marks at corners
  const registrationMarks = `
  <!-- Registration Marks for Alignment -->
  ${createRegistrationMark(20, 20)}
  ${createRegistrationMark(SVG_WIDTH - 20, 20)}
  ${createRegistrationMark(20, SVG_HEIGHT - 20)}
  ${createRegistrationMark(SVG_WIDTH - 20, SVG_HEIGHT - 20)}`;

  // Scale bar
  const scaleBar = createScaleBar(startX, SVG_HEIGHT - 35, realWidthMm, scale);

  // Technical information
  const technicalInfo = createTechnicalInfo(component, 20, SVG_HEIGHT - 120);

  // Component ID and metadata
  const metadata = `
  <!-- Metadata -->
  <text x="${SVG_WIDTH - 20}" y="15" font-family="Arial" font-size="10" fill="#666666" text-anchor="end">ID: ${component.id}</text>
  <text x="${SVG_WIDTH / 2}" y="15" font-family="Arial" font-size="12" font-weight="bold" fill="#000000" text-anchor="middle">ARCHIVO DE CORTE - VISTA FRONTAL</text>`;

  // Assemble final SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" 
     viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" 
     xmlns="http://www.w3.org/2000/svg">
  ${patterns}
  
  <!-- Background representing waste/raw material -->
  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="url(#wasteMaterial)" />
  
  <!-- White background behind piece for contrast -->
  <rect x="${startX - 5}" y="${startY - 5}" width="${drawWidth + 10}" height="${drawHeight + 10}" fill="#ffffff" stroke="none" />
  
  ${pieceElements}
  ${dimensions}
  ${registrationMarks}
  ${scaleBar}
  ${technicalInfo}
  ${metadata}
  
  <!-- Border for printing/cutting area -->
  <rect x="1" y="1" width="${SVG_WIDTH - 2}" height="${SVG_HEIGHT - 2}" fill="none" stroke="#cccccc" stroke-width="1" stroke-dasharray="5,5"/>
</svg>`;

  return svg;
}

export function generateTextSVG(text: string, width: number, height: number): string {
  // Fixed size for text preview too
  const SVG_WIDTH = 400;
  const SVG_HEIGHT = 200;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" 
     viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" 
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="textPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="10" y2="10" stroke="#000000" stroke-width="1"/>
    </pattern>
  </defs>
  
  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />
  
  <rect x="${SVG_WIDTH * 0.1}" y="${SVG_HEIGHT * 0.3}" 
        width="${SVG_WIDTH * 0.8}" height="${SVG_HEIGHT * 0.4}" 
        fill="url(#textPattern)" 
        stroke="#000000" stroke-width="2"/>
</svg>`;

  return svg;
}

export function createSVGBlob(svgContent: string): Blob {
  return new Blob([svgContent], { type: 'image/svg+xml' });
}

export function downloadSVG(svgContent: string, filename: string): void {
  const blob = createSVGBlob(svgContent);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
