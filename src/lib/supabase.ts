import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Design {
    id: string;
    name: string;
    specifications: string;
    dimensions: {
        frente: number;
        fondo: number;
        altura: number;
    };
    created_at: string;
}

export interface Component {
    id: string;
    design_id: string;
    name: string;
    dimensions: string;
    material: string;
    quantity: string;
    notes: string;
    created_at: string;
}

export interface Material {
    id: string;
    name: string;
    category: string;
    unit: string;
    price_per_unit?: number;
    created_at: string;
}

export interface Manual {
    id: string;
    design_id: string;
    pdf_url?: string;
    docx_url?: string;
    svg_urls?: string[];
    created_at: string;
}
