import { Factory } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-accent">
            <Factory className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              StandGenius
            </h1>
            <p className="text-xs text-muted-foreground">Generador de Manuales de Producción</p>
          </div>
        </div>
      </div>
    </header>
  );
};
