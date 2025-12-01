import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Component } from "@/lib/types";
import { downloadSVG } from "@/lib/svg-generator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SVGPreviewProps {
    component: Component;
    svgContent: string;
    showDownload?: boolean;
    className?: string;
}

export const SVGPreview = ({
    component,
    svgContent,
    showDownload = true,
    className = ""
}: SVGPreviewProps) => {
    const [zoom, setZoom] = useState(1);
    const { toast } = useToast();

    const handleDownload = () => {
        const filename = `${component.nombre.toLowerCase().replace(/\s+/g, '_')}_${component.id}`;
        downloadSVG(svgContent, filename);

        toast({
            title: "SVG Descargado",
            description: `Archivo de corte: ${filename}.svg`,
        });
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(svgContent);
            toast({
                title: "Copiado al portapapeles",
                description: "Código SVG copiado exitosamente",
            });
        } catch (err) {
            toast({
                title: "Error",
                description: "No se pudo copiar el SVG",
                variant: "destructive",
            });
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleResetZoom = () => setZoom(1);

    return (
        <Card className={`shadow-md border-border/50 ${className}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{component.nombre}</CardTitle>
                        <CardDescription className="mt-1">
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span>📏 {component.dimensiones.largo} × {component.dimensiones.alto} {component.dimensiones.unidad}</span>
                                <span>•</span>
                                <span>📦 {component.material.tipo}</span>
                                <span>•</span>
                                <span>🔢 {component.material.cantidad} {component.material.unidadCantidad}</span>
                            </div>
                        </CardDescription>
                    </div>

                    {showDownload && (
                        <div className="flex gap-2 ml-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                title="Copiar SVG"
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleDownload}
                                title="Descargar SVG"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {/* Zoom Controls */}
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        title="Alejar"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                        title="Acercar"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetZoom}
                        title="Restablecer zoom"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* SVG Preview Container */}
                <div className="relative w-full overflow-auto border border-border rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 p-4">
                    <div
                        className="flex items-center justify-center min-h-[300px] transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <div
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                            className="svg-preview-content"
                        />
                    </div>
                </div>

                {/* Technical Info */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Vista:</span> Frontal (optimizada para corte) •
                        <span className="font-semibold ml-2">Formato:</span> SVG vectorial •
                        <span className="font-semibold ml-2">ID:</span> {component.id}
                    </p>
                    {component.notas && (
                        <p className="text-xs text-muted-foreground mt-2">
                            <span className="font-semibold">Notas:</span> {component.notas}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
