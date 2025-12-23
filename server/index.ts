import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { DatabaseTemporaryError } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Global Error Middleware - handles all errors gracefully
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Handle typed DatabaseTemporaryError (from executeWithRetry)
    if (err instanceof DatabaseTemporaryError || err?.type === 'DB_TEMPORARY_FAILURE') {
      console.error('[DB Temporary Error]', err.message, err.originalError?.message);
      return res.status(503).json({ 
        message: "Temporary database connectivity issue. Please retry.",
        retryable: true
      });
    }

    // Handle raw DNS/database connection errors
    const isDnsError = err?.code === 'EAI_AGAIN' || 
                       err?.message?.includes('EAI_AGAIN') ||
                       err?.message?.includes('getaddrinfo') ||
                       err?.code === 'ENOTFOUND' ||
                       err?.code === 'ECONNRESET' ||
                       err?.code === 'ETIMEDOUT';
    
    if (isDnsError) {
      console.error('[DB DNS Error]', err.code, err.message);
      return res.status(503).json({ 
        message: "Temporary database connectivity issue. Please retry.",
        retryable: true
      });
    }

    // Standard error handling
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error('[Unhandled Error]', status, message);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
