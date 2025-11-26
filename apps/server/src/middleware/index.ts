import { FastifyRequest, FastifyReply } from "fastify";
import { createRemoteJWKSet, jwtVerify } from 'jose';
import '../types/fastify.js';

// Lazy-load JWKS - initialize only when first needed (after dotenv.config() has run)
let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
    if (!JWKS) {
        const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
        if (!SUPABASE_PROJECT_ID) {
            throw new Error('SUPABASE_PROJECT_ID is required');
        }
        // Supabase JWKS endpoint for ES256 keys
        const jwksUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/.well-known/jwks.json`;
        JWKS = createRemoteJWKSet(new URL(jwksUrl));
    }
    return JWKS;
}

//setup handlers
export const handlers = {
    verifyAPIKey: async (request: FastifyRequest, reply: FastifyReply) => {
        // Extract token from Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            // Get JWKS for ES256 verification
            const jwks = getJWKS();

            // Verify token using jose library with ES256 (Supabase ECC P256)
            const { payload } = await jwtVerify(token, jwks, {
                issuer: `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/auth/v1`,
            });

            // Extract user ID from 'sub' (subject) claim which Supabase uses
            const userId = (payload.sub as string) || undefined;

            // Attach user info to request for use in routes
            request.user = {
                ...payload,
                id: userId,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('JWT verification error:', errorMessage);

            return reply.status(401).send({
                error: 'Token verification failed',
                message: errorMessage
            });
        }
    },
}