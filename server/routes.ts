import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import crypto from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- History Endpoints ---
  app.get(api.history.list.path, async (req, res) => {
    const history = await storage.getHistory();
    res.json(history);
  });

  app.post(api.history.create.path, async (req, res) => {
    try {
      const input = api.history.create.input.parse(req.body);
      const run = await storage.createTestHistory(input);
      res.status(201).json(run);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.history.clear.path, async (req, res) => {
    await storage.clearHistory();
    res.status(204).send();
  });

  // --- Speed Test Endpoints ---
  
  // Download test: Returns a stream of random bytes of requested size
  app.get(api.speedtest.download.path, (req, res) => {
    // Default 1MB, Max 50MB per request to avoid crashing the server memory
    const size = Math.min(Number(req.query.size) || 1024 * 1024, 50 * 1024 * 1024);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', size);
    
    // Send random data efficiently
    // We create a 1MB buffer and send it multiple times to avoid generating too much unique randomness
    const chunkSize = 1024 * 1024; 
    const chunk = crypto.randomBytes(Math.min(size, chunkSize));
    
    let bytesSent = 0;
    
    function sendChunk() {
      if (bytesSent >= size) {
        res.end();
        return;
      }
      
      const remaining = size - bytesSent;
      const currentChunkSize = Math.min(remaining, chunkSize);
      
      const canContinue = res.write(
        currentChunkSize === chunkSize ? chunk : chunk.subarray(0, currentChunkSize)
      );
      
      bytesSent += currentChunkSize;
      
      if (canContinue) {
        setImmediate(sendChunk);
      } else {
        res.once('drain', sendChunk);
      }
    }
    
    sendChunk();
  });

  return httpServer;
}
