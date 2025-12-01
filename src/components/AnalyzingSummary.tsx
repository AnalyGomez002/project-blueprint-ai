import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ruler, Image as ImageIcon } from "lucide-react";
import { ProjectData } from "@/pages/Index";
import { Badge } from "@/components/ui/badge";

interface AnalyzingSummaryProps {
    projectData: ProjectData;
}

export const AnalyzingSummary = ({ projectData }: AnalyzingSummaryProps) => {
    return (
        <Card className="shadow-lg border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse-slow">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <div>
                        <CardTitle className="text-xl">Analizando Proyecto...</CardTitle>
                        <CardDescription>
                            La IA está procesando tu diseño y generando el manual de producción
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Image Preview */}
                {/* Image Preview */}
                {projectData.renderFiles && projectData.renderFiles.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <ImageIcon className="w-4 h-4" />
                            Imágenes Cargadas ({projectData.renderFiles.length})
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {projectData.renderFiles.map((file, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden border-2 border-border bg-background/50 aspect-video">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Render preview ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dimensions Summary */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Ruler className="w-4 h-4" />
                        Dimensiones del Proyecto
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-background/50 rounded-lg p-3 border border-border">
                            <div className="text-xs text-muted-foreground mb-1">Frente</div>
                            <div className="text-lg font-semibold text-foreground">
                                {projectData.dimensions.frente}
                                <span className="text-sm text-muted-foreground ml-1">cm</span>
                            </div>
                        </div>
                        <div className="bg-background/50 rounded-lg p-3 border border-border">
                            <div className="text-xs text-muted-foreground mb-1">Fondo</div>
                            <div className="text-lg font-semibold text-foreground">
                                {projectData.dimensions.fondo}
                                <span className="text-sm text-muted-foreground ml-1">cm</span>
                            </div>
                        </div>
                        <div className="bg-background/50 rounded-lg p-3 border border-border">
                            <div className="text-xs text-muted-foreground mb-1">Altura</div>
                            <div className="text-lg font-semibold text-foreground">
                                {projectData.dimensions.altura}
                                <span className="text-sm text-muted-foreground ml-1">cm</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Processing Steps */}
                <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-muted-foreground">Analizando componentes del diseño...</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-100"></div>
                        <span className="text-muted-foreground">Calculando materiales necesarios...</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-200"></div>
                        <span className="text-muted-foreground">Generando pasos de ensamblaje...</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
