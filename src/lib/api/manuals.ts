import { supabase, Manual } from '../supabase';

export const manualsAPI = {
    /**
     * Subir un archivo al storage de Supabase
     */
    async uploadFile(file: Blob, path: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from('design-files')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('design-files')
            .getPublicUrl(path);

        return urlData.publicUrl;
    },

    /**
     * Crear un manual con archivos (PDF, DOCX, SVGs)
     */
    async create(
        designId: string,
        files: {
            pdf?: Blob;
            docx?: Blob;
            svgs?: Blob[];
        }
    ) {
        const manual: Partial<Manual> = {
            design_id: designId
        };

        const timestamp = Date.now();

        // Upload PDF
        if (files.pdf) {
            const pdfPath = `pdfs/${designId}_${timestamp}.pdf`;
            manual.pdf_url = await this.uploadFile(files.pdf, pdfPath);
        }

        // Upload DOCX
        if (files.docx) {
            const docxPath = `docx/${designId}_${timestamp}.docx`;
            manual.docx_url = await this.uploadFile(files.docx, docxPath);
        }

        // Upload SVGs
        if (files.svgs && files.svgs.length > 0) {
            const svgUrls: string[] = [];
            for (let i = 0; i < files.svgs.length; i++) {
                const svgPath = `svgs/${designId}_${timestamp}_${i}.svg`;
                const url = await this.uploadFile(files.svgs[i], svgPath);
                svgUrls.push(url);
            }
            manual.svg_urls = svgUrls;
        }

        // Insertar registro en la base de datos
        const { data, error } = await supabase
            .from('manuals')
            .insert(manual)
            .select()
            .single();

        if (error) throw error;
        return data as Manual;
    },

    /**
     * Obtener el manual más reciente de un diseño
     */
    async getByDesignId(designId: string) {
        const { data, error } = await supabase
            .from('manuals')
            .select('*')
            .eq('design_id', designId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data as Manual | null;
    },

    /**
     * Obtener todos los manuales de un diseño
     */
    async getAllByDesignId(designId: string) {
        const { data, error } = await supabase
            .from('manuals')
            .select('*')
            .eq('design_id', designId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Manual[];
    }
};
