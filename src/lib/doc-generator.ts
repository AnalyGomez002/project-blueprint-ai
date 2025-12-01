// Document generators for PDF and DOCX formats with improved formatting and SVG support

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, BorderStyle, ImageRun, ShadingType, Header, Footer, PageNumber } from 'docx';
import { ProductionManual, Component } from './types';
import { generateSVG } from './svg-generator';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
        lastAutoTable?: { finalY: number };
    }
}

// Helper to remove emojis and non-standard characters for PDF
function cleanText(text: string): string {
    // Normalize to NFD to separate accents from letters
    return text.normalize("NFD")
        // Remove accents
        .replace(/[\u0300-\u036f]/g, "")
        // Remove emojis and other non-ASCII characters
        .replace(/[^\x20-\x7E]/g, "")
        .trim();
}

// Helper to shorten long text for titles
function shortenText(text: string, maxLength: number = 30): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Helper to convert SVG to PNG data URL
function svgToPng(svgString: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        // Ensure namespace exists for browser rendering
        if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
            svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Force width and height in the SVG string to pixels to ensure consistent rendering
        // This regex looks for width and height attributes and replaces them
        // We use the requested width/height to ensure high resolution
        svgString = svgString.replace(/width="([^"]*)"/, `width="${width}px"`);
        svgString = svgString.replace(/height="([^"]*)"/, `height="${height}px"`);

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            try {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(dataUrl);
            } catch (err) {
                console.error('Error drawing SVG to canvas:', err);
                URL.revokeObjectURL(url);
                resolve(''); // Fail gracefully
            }
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            console.error('Error loading SVG image:', err);
            // Try to log the beginning of the SVG to see if it's malformed
            console.error('SVG Start:', svgString.substring(0, 100));
            resolve(''); // Resolve with empty string on error to continue process
        };

        img.src = url;
    });
}

// Helper to draw the sidebar on PDF pages (pink, vertical text)
function drawSidebar(doc: jsPDF, pageWidth: number, pageHeight: number) {
    const sidebarWidth = 30; // mm, slightly wider for vertical text
    const pinkColor: [number, number, number] = [232, 126, 183]; // #E87EB7

    // Draw sidebar background
    doc.setFillColor(pinkColor[0], pinkColor[1], pinkColor[2]);
    doc.rect(pageWidth - sidebarWidth, 0, sidebarWidth, pageHeight, 'F');

    // Add rotated text (vertical, white)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.saveGraphicsState();
    // Move origin to right sidebar, rotate -90deg
    doc.text('MANUAL DEL PROTAGONISTA', pageWidth - 10, pageHeight / 2 + 60, { angle: 90 });
    doc.restoreGraphicsState();
}

// Helper to draw header on PDF pages
function drawHeader(doc: jsPDF, pageWidth: number, projectName: string, date: string) {
    const sidebarWidth = 25;
    const marginLeft = sidebarWidth + 10;
    const marginRight = 15;
    const primaryColor: [number, number, number] = [234, 88, 12];

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');

    // Project Name Left
    doc.text(shortenText(cleanText(projectName), 40), marginLeft, 15);

    // Date Right
    doc.text(date, pageWidth - marginRight, 15, { align: 'right' });

    // Line separator
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 18, pageWidth - marginRight, 18);
}

// Helper to draw footer on PDF pages (pink bar, big number)
function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, pageNumber: number) {
    const sidebarWidth = 30;
    const pinkColor: [number, number, number] = [232, 126, 183]; // #E87EB7
    // Draw pink bar at bottom right
    const barWidth = sidebarWidth;
    const barHeight = 20;
    doc.setFillColor(pinkColor[0], pinkColor[1], pinkColor[2]);
    doc.rect(pageWidth - barWidth, pageHeight - barHeight, barWidth, barHeight, 'F');
    // Page number in white, big, right-aligned
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(`${pageNumber}`, pageWidth - barWidth / 2, pageHeight - 6, { align: 'center' });
}


export async function generatePDF(manual: ProductionManual, svgFiles: { [key: string]: string } = {}): Promise<Blob> {
    // Autogenerar SVGs técnicos para cada componente si no existen
    if (manual.componentes && manual.componentes.length > 0) {
        for (const comp of manual.componentes) {
            if (!svgFiles[comp.id]) {
                svgFiles[comp.id] = generateSVG(comp as Component);
            }
        }
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Layout constants
    const sidebarWidth = 30;
    const marginLeft = 20;
    const marginRight = sidebarWidth + 10;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let yPosition = 20;

    // Colors
    const primaryColor: [number, number, number] = [232, 126, 183]; // Pink #E87EB7
    const textColor: [number, number, number] = [30, 41, 59]; // #1e293b
    const lightGray: [number, number, number] = [241, 245, 249]; // #f1f5f9

    // Helper to add page with sidebar
    const addPage = () => {
        doc.addPage();
        drawSidebar(doc, pageWidth, pageHeight);
    };

    // ===== COVER PAGE =====
    // Draw sidebar on first page
    drawSidebar(doc, pageWidth, pageHeight);

    // Title
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('MANUAL DEL', marginLeft, 50);
    doc.text('PROTAGONISTA', marginLeft, 65);

    // Project name
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    const shortProjectName = shortenText(cleanText(manual.proyecto.nombre), 30);
    doc.text(shortProjectName, marginLeft, 85);

    // Date and info box
    yPosition = 100;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);

    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha de Generación: ${manual.fechaGeneracion}`, marginLeft, yPosition);

    yPosition += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const descLines = doc.splitTextToSize(cleanText(manual.proyecto.descripcion), contentWidth);
    doc.text(descLines, marginLeft, yPosition, { align: 'justify', maxWidth: contentWidth });
    yPosition += descLines.length * 6 + 20;

    // Dimensions section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('DIMENSIONES GENERALES', marginLeft, yPosition);

    yPosition += 10;
    const dimensionsData = [
        ['Frente', `${manual.proyecto.dimensionesGenerales.frente} cm`],
        ['Fondo', `${manual.proyecto.dimensionesGenerales.fondo} cm`],
        ['Altura', `${manual.proyecto.dimensionesGenerales.altura} cm`],
    ];

    autoTable(doc, {
        startY: yPosition,
        head: [['Dimensión', 'Medida']],
        body: dimensionsData,
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            fontSize: 12,
            fontStyle: 'bold',
            halign: 'center',
            textColor: [255, 255, 255]
        },
        bodyStyles: {
            fontSize: 11,
            cellPadding: 6,
            textColor: textColor,
            halign: 'center',
        },
        alternateRowStyles: {
            fillColor: lightGray
        },
        margin: { left: marginLeft, right: marginRight },
    });

    // ===== COMPONENTS PAGE =====
    addPage();
    yPosition = 30; // Start lower to account for header

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('LISTA DE COMPONENTES', marginLeft, yPosition);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Total de piezas: ${manual.componentes.length}`, marginLeft, yPosition + 10);

    yPosition += 20;

    // Components table
    const componentsData = manual.componentes.map((comp, index) => {
        const dims = `${comp.dimensiones.largo || '-'} x ${comp.dimensiones.ancho || '-'} x ${comp.dimensiones.alto || '-'} ${comp.dimensiones.unidad}`;
        const hasFile = svgFiles[comp.id] ? 'Sí' : '-';
        return [
            `${index + 1}`,
            cleanText(comp.nombre),
            dims,
            cleanText(comp.material.tipo),
            `${comp.material.cantidad}`,
            hasFile
        ];
    });

    autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Componente', 'Dimensiones', 'Material', 'Cant.', 'Archivo']],
        body: componentsData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'left',
        },
        bodyStyles: {
            textColor: textColor,
            fontSize: 9,
            cellPadding: 4,
            valign: 'middle',
        },
        alternateRowStyles: {
            fillColor: lightGray
        },
        columnStyles: {
            0: { cellWidth: 10, fontStyle: 'bold', halign: 'center' },
            1: { cellWidth: 45 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 15, halign: 'center' },
        },
        margin: { left: marginLeft, right: marginRight },
    });

    // Component details
    for (let i = 0; i < manual.componentes.length; i++) {
        const comp = manual.componentes[i];
        const index = i;

        addPage();
        yPosition = 30;

        // Component header
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${cleanText(comp.nombre).toUpperCase()}`, marginLeft, yPosition);

        yPosition += 10;
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
        yPosition += 10;

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        // Description
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        const descLines = doc.splitTextToSize(cleanText(comp.descripcion), contentWidth);
        doc.text(descLines, marginLeft, yPosition);
        yPosition += descLines.length * 6 + 10;

        // Details table
        const detailsData = [
            ['Dimensiones', `${comp.dimensiones.largo || '-'} x ${comp.dimensiones.ancho || '-'} x ${comp.dimensiones.alto || '-'} ${comp.dimensiones.unidad}`],
            ['Material', cleanText(comp.material.tipo)],
            ['Especificaciones', cleanText(comp.material.especificaciones)],
            ['Cantidad', `${comp.material.cantidad} ${comp.material.unidadCantidad}`],
            ['Proceso', cleanText(comp.proceso.join(', '))],
        ];

        if (comp.notas) {
            detailsData.push(['Notas', cleanText(comp.notas)]);
        }

        autoTable(doc, {
            startY: yPosition,
            body: detailsData,
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 6,
                textColor: textColor
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40, textColor: primaryColor },
                1: { cellWidth: 100 },
            },
            margin: { left: marginLeft, right: marginRight },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;

        // SVG preview if available
        if (svgFiles[comp.id]) {
            // Check if we need a new page for the image
            if (yPosition > pageHeight - 110) {
                addPage();
                yPosition = 30;
            }

            // Figure Caption
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(`Figura ${index + 1}A: Vista Previa`, marginLeft, yPosition);
            yPosition += 5;

            // Border for the image
            const imageSize = 100; // mm
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.rect(marginLeft, yPosition, pageWidth - marginLeft - marginRight, imageSize + 10);

            // Convert SVG to PNG and embed
            try {
                const pngDataUrl = await svgToPng(svgFiles[comp.id], 1000, 1000);
                if (pngDataUrl) {
                    // Center image in the box
                    const boxWidth = pageWidth - marginLeft - marginRight;
                    const xOffset = marginLeft + (boxWidth - imageSize) / 2;

                    doc.addImage(pngDataUrl, 'PNG', xOffset, yPosition + 5, imageSize, imageSize);
                }
            } catch (e) {
                console.error('Error embedding image in PDF:', e);
                doc.setFontSize(9);
                doc.setTextColor(255, 0, 0);
                doc.text('(Error al generar vista previa)', marginLeft + 5, yPosition + 10);
            }

            // Add note below image
            yPosition += imageSize + 20;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('NOTA: Las medidas están expresadas en la unidad indicada.', marginLeft, yPosition);
        }
    }

    // ===== CUTTING DIAGRAMS =====
    const layoutKeys = Object.keys(svgFiles).filter(key => key.startsWith('layout_'));
    if (layoutKeys.length > 0) {
        addPage();
        yPosition = 30;

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('DIAGRAMAS DE CORTE', marginLeft, yPosition);
        yPosition += 20;

        for (const key of layoutKeys) {
            // Check for page break
            if (yPosition > pageHeight - 120) {
                addPage();
                yPosition = 30;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            // Format filename: layout_MDF_15mm_hoja_1 -> MDF 15mm - Hoja 1
            const title = key.replace('layout_', '').replace(/_/g, ' ').replace('hoja', '- Hoja');
            doc.text(title.toUpperCase(), marginLeft, yPosition);
            yPosition += 10;

            // Border
            const imageWidth = pageWidth - marginLeft - marginRight;
            const imageHeight = imageWidth / 2; // 2:1 ratio for sheets

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.rect(marginLeft, yPosition, imageWidth, imageHeight);

            try {
                const pngDataUrl = await svgToPng(svgFiles[key], 2000, 1000);
                if (pngDataUrl) {
                    doc.addImage(pngDataUrl, 'PNG', marginLeft, yPosition, imageWidth, imageHeight);
                }
            } catch (e) {
                console.error('Error embedding layout SVG:', e);
                doc.setFontSize(10);
                doc.setTextColor(255, 0, 0);
                doc.text('(Error al generar diagrama)', marginLeft + 5, yPosition + 10);
            }

            yPosition += imageHeight + 20;
        }
    }

    // ===== CONSUMABLES PAGE =====
    if (manual.consumibles.length > 0) {
        addPage();
        yPosition = 30;

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('LISTA DE CONSUMIBLES', marginLeft, yPosition);

        yPosition += 15;

        const consumablesData = manual.consumibles.map((cons, index) => {
            return [
                `${index + 1}`,
                cleanText(cons.nombre),
                `${cons.cantidad} ${cons.unidad}`,
                cleanText(cons.especificaciones)
            ];
        });

        autoTable(doc, {
            startY: yPosition,
            head: [['#', 'Consumible', 'Cantidad', 'Especificaciones']],
            body: consumablesData,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                fontSize: 10,
                fontStyle: 'bold',
                textColor: [255, 255, 255]
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 5,
                textColor: textColor
            },
            alternateRowStyles: {
                fillColor: lightGray
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 50 },
                2: { cellWidth: 30 },
                3: { cellWidth: 60 },
            },
            margin: { left: marginLeft, right: marginRight },
        });
    }


    // Add Footers to all pages (pink bar, big number)
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, pageWidth, pageHeight, i);
    }

    return doc.output('blob');
}

export async function generateDOCX(manual: ProductionManual, svgFiles: { [key: string]: string } = {}): Promise<Blob> {
    // Autogenerar SVGs técnicos para cada componente si no existen
    if (manual.componentes && manual.componentes.length > 0) {
        for (const comp of manual.componentes) {
            if (!svgFiles[comp.id]) {
                svgFiles[comp.id] = generateSVG(comp as Component);
            }
        }
    }
    const children: any[] = [];

    // Orange color hex
    const primaryColorHex = "EA580C";
    const lightGrayHex = "F1F5F9";

    // ===== COVER PAGE =====
    children.push(
        new Paragraph({
            text: 'MANUAL DE PRODUCCIÓN',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200, before: 400 },
            border: {
                bottom: { color: primaryColorHex, space: 1, style: BorderStyle.SINGLE, size: 12 },
            }
        })
    );

    children.push(
        new Paragraph({
            text: manual.proyecto.nombre.toUpperCase(),
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400, before: 200 },
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Fecha de Generación: ${manual.fechaGeneracion}`,
                    bold: true,
                    size: 24,
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: manual.proyecto.descripcion,
                    italics: true,
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
        })
    );

    // ===== DIMENSIONS =====
    children.push(
        new Paragraph({
            text: 'DIMENSIONES GENERALES',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            border: {
                bottom: { color: primaryColorHex, space: 1, style: BorderStyle.SINGLE, size: 6 },
            }
        })
    );

    const dimensionsTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Dimensión', bold: true, color: "FFFFFF" })] })],
                        shading: { fill: primaryColorHex, type: ShadingType.CLEAR, color: "auto" },
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Medida', bold: true, color: "FFFFFF" })] })],
                        shading: { fill: primaryColorHex, type: ShadingType.CLEAR, color: "auto" },
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('Frente')] }),
                    new TableCell({ children: [new Paragraph(`${manual.proyecto.dimensionesGenerales.frente} cm`)] }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('Fondo')], shading: { fill: lightGrayHex, type: ShadingType.CLEAR, color: "auto" } }),
                    new TableCell({ children: [new Paragraph(`${manual.proyecto.dimensionesGenerales.fondo} cm`)], shading: { fill: lightGrayHex, type: ShadingType.CLEAR, color: "auto" } }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('Altura')] }),
                    new TableCell({ children: [new Paragraph(`${manual.proyecto.dimensionesGenerales.altura} cm`)] }),
                ],
            }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });

    children.push(dimensionsTable);

    // Page Break after cover
    children.push(new Paragraph({
        children: [new TextRun({ text: "", break: 1 })],
    }));
    children.push(new Paragraph({
        pageBreakBefore: true,
        text: "",
    }));


    // ===== COMPONENTS =====
    children.push(
        new Paragraph({
            text: 'LISTA DE COMPONENTES',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
            border: {
                bottom: { color: primaryColorHex, space: 1, style: BorderStyle.SINGLE, size: 6 },
            }
        })
    );

    // Use for...of loop for async operations
    for (const comp of manual.componentes) {
        const index = manual.componentes.indexOf(comp);
        children.push(
            new Paragraph({
                text: `${index + 1}. ${comp.nombre.toUpperCase()}`,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 400, after: 200 },
            })
        );

        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: comp.descripcion, italics: true }),
                ],
                spacing: { after: 200 },
            })
        );

        // Component details table
        const componentTable = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dimensiones', bold: true, color: primaryColorHex })] })] }),
                        new TableCell({ children: [new Paragraph(`${comp.dimensiones.largo || '-'} × ${comp.dimensiones.ancho || '-'} × ${comp.dimensiones.alto || '-'} ${comp.dimensiones.unidad}`)] }),
                    ],
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Material', bold: true, color: primaryColorHex })] })] }),
                        new TableCell({ children: [new Paragraph(comp.material.tipo)] }),
                    ],
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Especificaciones', bold: true, color: primaryColorHex })] })] }),
                        new TableCell({ children: [new Paragraph(comp.material.especificaciones)] }),
                    ],
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Cantidad', bold: true, color: primaryColorHex })] })] }),
                        new TableCell({ children: [new Paragraph(`${comp.material.cantidad} ${comp.material.unidadCantidad}`)] }),
                    ],
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Proceso', bold: true, color: primaryColorHex })] })] }),
                        new TableCell({ children: [new Paragraph(comp.proceso.join(', '))] }),
                    ],
                }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });

        children.push(componentTable);

        if (comp.notas) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Notas: ', bold: true }),
                        new TextRun({ text: comp.notas }),
                    ],
                    spacing: { before: 200, after: 200 },
                })
            );
        }

        if (svgFiles[comp.id]) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `Figura ${index + 1}A: Vista Previa`, bold: true, color: primaryColorHex }),
                    ],
                    spacing: { before: 200, after: 100 },
                })
            );

            try {
                // Convert SVG to PNG for reliable embedding in DOCX
                const pngDataUrl = await svgToPng(svgFiles[comp.id], 800, 800);

                if (pngDataUrl) {
                    // Remove data:image/png;base64, prefix
                    const base64Data = pngDataUrl.split(',')[1];
                    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                    children.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageBuffer,
                                    transformation: {
                                        width: 400,
                                        height: 400,
                                    },
                                    type: "png"
                                }),
                            ],
                            spacing: { after: 400 },
                            alignment: AlignmentType.CENTER,
                            border: {
                                top: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 2 },
                                bottom: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 2 },
                                left: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 2 },
                                right: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 2 },
                            }
                        })
                    );
                }
            } catch (e) {
                console.error('Error adding image to DOCX:', e);
                children.push(
                    new Paragraph({
                        text: '(Error al adjuntar imagen)',
                        spacing: { after: 400 },
                        alignment: AlignmentType.CENTER,
                    })
                );
            }
        }

        // Add page break after each component
        children.push(new Paragraph({
            pageBreakBefore: true,
            text: "",
        }));
    }

    // ===== CUTTING DIAGRAMS =====
    const layoutKeys = Object.keys(svgFiles).filter(key => key.startsWith('layout_'));
    if (layoutKeys.length > 0) {
        children.push(
            new Paragraph({
                text: 'DIAGRAMAS DE CORTE',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 600, after: 200 },
                border: {
                    bottom: { color: primaryColorHex, space: 1, style: BorderStyle.SINGLE, size: 6 },
                }
            })
        );

        for (const key of layoutKeys) {
            const title = key.replace('layout_', '').replace(/_/g, ' ').replace('hoja', '- Hoja');

            children.push(
                new Paragraph({
                    text: title.toUpperCase(),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 400, after: 200 },
                })
            );

            try {
                const pngDataUrl = await svgToPng(svgFiles[key], 1600, 800);
                if (pngDataUrl) {
                    const base64Data = pngDataUrl.split(',')[1];
                    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                    children.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageBuffer,
                                    transformation: {
                                        width: 600,
                                        height: 300,
                                    },
                                    type: "png"
                                }),
                            ],
                            spacing: { after: 400 },
                            alignment: AlignmentType.CENTER,
                            border: {
                                top: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 2 },
                                bottom: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 2 },
                                left: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 2 },
                                right: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 2 },
                            }
                        })
                    );
                }
            } catch (e) {
                console.error('Error adding layout image to DOCX:', e);
                children.push(
                    new Paragraph({
                        text: '(Error al adjuntar diagrama)',
                        spacing: { after: 400 },
                        alignment: AlignmentType.CENTER,
                    })
                );
            }
        }

        // Page Break after diagrams
        children.push(new Paragraph({
            pageBreakBefore: true,
            text: "",
        }));
    }

    // ===== CONSUMABLES =====
    if (manual.consumibles.length > 0) {
        children.push(
            new Paragraph({
                text: 'LISTA DE CONSUMIBLES',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 600, after: 200 },
                border: {
                    bottom: { color: primaryColorHex, space: 1, style: BorderStyle.SINGLE, size: 6 },
                }
            })
        );

        const consumablesTableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, color: "FFFFFF" })] })], shading: { fill: primaryColorHex, type: ShadingType.CLEAR, color: "auto" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Consumible', bold: true, color: "FFFFFF" })] })], shading: { fill: primaryColorHex, type: ShadingType.CLEAR, color: "auto" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Cantidad', bold: true, color: "FFFFFF" })] })], shading: { fill: primaryColorHex, type: ShadingType.CLEAR, color: "auto" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Especificaciones', bold: true, color: "FFFFFF" })] })], shading: { fill: primaryColorHex, type: ShadingType.CLEAR, color: "auto" } }),
                ],
            }),
        ];

        manual.consumibles.forEach((cons, index) => {
            const icon = cons.tipo === 'iluminacion' ? '💡' :
                cons.tipo === 'pintura' ? '🎨' :
                    cons.tipo === 'adhesivo' ? '🔗' :
                        cons.tipo === 'tornilleria' ? '🔩' : '📦';

            const isEven = index % 2 === 0;
            const rowShading = isEven ? { fill: "FFFFFF", type: ShadingType.CLEAR, color: "auto" } : { fill: lightGrayHex, type: ShadingType.CLEAR, color: "auto" };

            consumablesTableRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(`${index + 1}`)], shading: rowShading }),
                        new TableCell({ children: [new Paragraph(`${icon} ${cons.nombre}`)], shading: rowShading }),
                        new TableCell({ children: [new Paragraph(`${cons.cantidad} ${cons.unidad}`)], shading: rowShading }),
                        new TableCell({ children: [new Paragraph(cons.especificaciones)], shading: rowShading }),
                    ],
                })
            );
        });

        const consumablesTable = new Table({
            rows: consumablesTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        });

        children.push(consumablesTable);
    }

    const doc = new Document({
        sections: [
            {
                properties: {},
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: manual.proyecto.nombre,
                                        bold: true,
                                        color: "666666",
                                    }),
                                    new TextRun({
                                        text: `\t${manual.fechaGeneracion}`,
                                        color: "999999",
                                    }),
                                ],
                                tabStops: [
                                    {
                                        type: "right",
                                        position: 9000, // Adjust based on page width
                                    },
                                ],
                                border: {
                                    bottom: { color: primaryColorHex, space: 1, style: BorderStyle.SINGLE, size: 6 },
                                },
                            }),
                        ],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Documento Confidencial - Uso Interno",
                                        italics: true,
                                        color: "999999",
                                        size: 16,
                                    }),
                                    new TextRun({
                                        children: ["\tPágina ", PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES],
                                    }),
                                ],
                                tabStops: [
                                    {
                                        type: "right",
                                        position: 9000,
                                    },
                                ],
                            }),
                        ],
                    }),
                },
                children: children,
            },
        ],
    });

    return await Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
