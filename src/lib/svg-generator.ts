// SVG Generator for CNC/Plotter cutting files
// Generates clean technical drawings with proportional scaling

import { Component } from './types';

// Fixed SVG canvas dimensions
const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const PADDING = 50; // Padding from edges

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

export function generateSVG(component: Component): string {
  // Get real component dimensions in mm
  // We strictly use 'largo' (length) and 'alto' (height) for the 2D profile as requested
  const realWidthMm = (component.dimensiones.largo || 100) * 10;
  const realHeightMm = (component.dimensiones.alto || 100) * 10;

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

  // Pattern definitions
  const patterns = `
  <defs>
    <!-- Pattern for useful material (diagonal black/white) -->
    <pattern id="usefulMaterial" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="20" height="20" fill="#ffffff"/>
      <line x1="0" y1="0" x2="20" y2="20" stroke="#000000" stroke-width="1"/>
      <line x1="0" y1="20" x2="20" y2="0" stroke="#000000" stroke-width="1"/>
    </pattern>

    <!-- Pattern for waste material (dotted gray) -->
    <pattern id="wasteMaterial" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="20" height="20" fill="#f5f5f5"/>
      <circle cx="10" cy="10" r="1.5" fill="#999999"/>
    </pattern>
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
        // Use provided path, scaled to fit the box
        // We wrap it in a group with transform to scale it
        // Assuming path is defined in 0-100 coordinate space as requested from AI
        pieceElements = `
        <!-- Irregular Shape from Path -->
        <g transform="translate(${startX}, ${startY}) scale(${drawWidth / 100}, ${drawHeight / 100})">
          <path d="${component.svgPath}" fill="url(#usefulMaterial)" stroke="#000000" stroke-width="3" vector-effect="non-scaling-stroke"/>
          ${component.foldPath ? `<path d="${component.foldPath}" fill="none" stroke="#FF0000" stroke-width="2" stroke-dasharray="5,5" vector-effect="non-scaling-stroke"/>` : ''}
        </g>`;
      } else {
        // Fallback to rectangle with "Irregular" text
        pieceElements = `
        <!-- Irregular Shape Fallback -->
        <rect x="${startX}" y="${startY}" width="${drawWidth}" height="${drawHeight}" 
              fill="url(#usefulMaterial)" stroke="#000000" stroke-width="3" stroke-dasharray="10,5"/>
        <text x="${startX + drawWidth / 2}" y="${startY + drawHeight / 2}" 
              font-family="Arial" font-size="24" fill="#000000" text-anchor="middle" dominant-baseline="middle">FORMA IRREGULAR</text>`;
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
