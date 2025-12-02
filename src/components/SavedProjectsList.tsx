import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Trash2, Calendar, ArrowRight } from "lucide-react";
import { SavedProject, useSavedProjects } from "@/hooks/useSavedProjects";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SavedProjectsListProps {
    onLoadProject: (project: SavedProject) => void;
}

export const SavedProjectsList = ({ onLoadProject }: SavedProjectsListProps) => {
    const { savedProjects, deleteProject } = useSavedProjects();

    if (savedProjects.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No hay proyectos guardados aún.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
                {savedProjects.map((project) => (
                    <Card key={project.id} className="group hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1" onClick={() => onLoadProject(project)}>
                                    <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                        {project.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {project.date}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {project.manualData.components.length} componentes
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteProject(project.id);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => onLoadProject(project)}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    );
};
