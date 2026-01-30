import { z } from 'zod';
import { insertTestHistorySchema, testHistory } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  history: {
    list: {
      method: 'GET' as const,
      path: '/api/history',
      responses: {
        200: z.array(z.custom<typeof testHistory.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/history',
      input: insertTestHistorySchema,
      responses: {
        201: z.custom<typeof testHistory.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/history',
      responses: {
        204: z.void(),
      },
    },
  },
  speedtest: {
    download: {
      method: 'GET' as const,
      path: '/api/speedtest/download',
      input: z.object({
        size: z.coerce.number().optional().default(1024 * 1024), // Default 1MB
      }).optional(),
      responses: {
        200: z.any(), // Binary data
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type TestHistoryInput = z.infer<typeof api.history.create.input>;
