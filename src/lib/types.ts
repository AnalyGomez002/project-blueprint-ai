// Tipos para la generación de manuales de producción en PDF/DOCX

export interface Component {
  id: string;
  nombre: string;
  descripcion: string;
  dimensiones: {
    largo: number;
    ancho: number;
    alto: number;
    unidad: string;
    forma?: string;
  };
  material: {
    tipo: string;
    especificaciones: string;
    cantidad: number;
    unidadCantidad: string;
  };
  proceso: string[];
  notas?: string;
  svgPath?: string;
  foldPath?: string;
}

export interface ProductionManual {
  proyecto: {
    nombre: string;
    descripcion: string;
    dimensionesGenerales: {
      frente: number;
      fondo: number;
      altura: number;
    };
  };
  fechaGeneracion: string;
  componentes: Component[];
  consumibles: Array<{
    id: string;
    nombre: string;
    cantidad: string;
    unidad: string;
    especificaciones: string;
    tipo: string;
  }>;
}
