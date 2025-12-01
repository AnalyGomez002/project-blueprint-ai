// SVG utility functions for handling multiple SVGs and downloads

import { Component } from './types';
import { generateSVG, createSVGBlob } from './svg-generator';
import JSZip from 'jszip';

/**
 * Generate SVGs for all components
 */
export function generateAllSVGs(components: Component[]): { [id: string]: string } {
    const svgFiles: { [id: string]: string } = {};

    components.forEach(component => {
        svgFiles[component.id] = generateSVG(component);
    });

    return svgFiles;
}

/**
 * Download all SVGs as a ZIP file
 */
export async function downloadAllSVGsAsZip(
    svgFiles: { [id: string]: string },
    components: Component[],
    projectName: string = 'proyecto'
): Promise<void> {
    const zip = new JSZip();
    const svgFolder = zip.folder('archivos_corte');

    if (!svgFolder) {
        throw new Error('Error creating ZIP folder');
    }

    // Add each SVG to the ZIP
    Object.entries(svgFiles).forEach(([id, svgContent]) => {
        const component = components.find(c => c.id === id);
        const filename = component
            ? `${sanitizeFilename(component.nombre)}_${id}.svg`
            : `componente_${id}.svg`;

        svgFolder.file(filename, svgContent);
    });

    // Add README with instructions
    const readme = generateReadme(components, projectName);
    svgFolder.file('LEEME.txt', readme);

    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${sanitizeFilename(projectName)}_archivos_corte.zip`);
}

/**
 * Validate SVG path string
 */
export function validateSVGPath(path: string): boolean {
    if (!path || typeof path !== 'string') return false;

    // Check for basic SVG path commands
    const validCommands = /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.-]+$/;
    return validCommands.test(path);
}

/**
 * Optimize SVG path by removing redundant commands
 */
export function optimizeSVGPath(path: string): string {
    if (!validateSVGPath(path)) return path;

    return path
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/,\s*/g, ',') // Remove spaces after commas
        .replace(/\s*([MmLlHhVvCcSsQqTtAaZz])\s*/g, '$1') // Remove spaces around commands
        .trim();
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 50);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate README file for ZIP
 */
function generateReadme(components: Component[], projectName: string): string {
    const date = new Date().toLocaleDateString('es-MX');

    return `ARCHIVOS DE CORTE - ${projectName.toUpperCase()}
Generado: ${date}

═══════════════════════════════════════════════════════════════

CONTENIDO:
${components.map((c, i) => `${i + 1}. ${c.nombre} (${c.id}.svg)`).join('\n')}

═══════════════════════════════════════════════════════════════

INSTRUCCIONES DE USO:

1. VISTA FRONTAL
   Todos los archivos SVG están en VISTA FRONTAL (largo × alto).
   Esto optimiza la captura de formas irregulares.

2. DIMENSIONES
   Las dimensiones reales están indicadas en cada archivo SVG.
   Verificar escala antes de cortar.

3. MARCAS DE REGISTRO
   Las marcas en las esquinas sirven para alineación.
   Usar como referencia para posicionamiento preciso.

4. LÍNEAS DE CORTE
   - Negro sólido: Líneas de corte
   - Rojo punteado: Líneas de plegado (si aplica)

5. INFORMACIÓN TÉCNICA
   Cada archivo incluye:
   - Nombre del componente
   - Material y grosor
   - Cantidad requerida
   - Dimensiones exactas

6. SOFTWARE COMPATIBLE
   - Adobe Illustrator
   - Inkscape (gratis)
   - CorelDRAW
   - AutoCAD
   - Software CNC/Plotter

═══════════════════════════════════════════════════════════════

NOTAS IMPORTANTES:
- Verificar escala antes de cortar (1:1)
- Respetar dirección de veta del material
- Considerar tolerancias de corte según máquina
- Guardar material sobrante para ajustes

═══════════════════════════════════════════════════════════════

Para más información, consultar el manual de producción completo.
`;
}
