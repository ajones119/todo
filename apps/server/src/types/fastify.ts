import { FastifyInstance, FastifyRequest } from 'fastify';
import type { SupabaseClient } from '@supabase/supabase-js';

// Extend Fastify to include Supabase client
declare module 'fastify' {
    interface FastifyInstance {
        supabase: SupabaseClient;
    }
    
    interface FastifyRequest {
        user?: {
            sub?: string;
            email?: string;
            id?: string;
            roles?: string[];
            [key: string]: unknown;
        };
    }
}

