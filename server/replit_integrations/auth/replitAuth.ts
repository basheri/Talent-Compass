import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

async function discoverWithRetry(maxRetries = 3, delayMs = 1000) {
  const issuerUrl = new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc");
  const clientId = process.env.REPL_ID!;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.discovery(issuerUrl, clientId);
    } catch (error: any) {
      const isDnsError = error?.code === 'EAI_AGAIN' ||
        error?.message?.includes('EAI_AGAIN') ||
        error?.code === 'ENOTFOUND';

      if (isDnsError && attempt < maxRetries) {
        console.log(`OIDC discovery attempt ${attempt} failed (DNS error), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('OIDC discovery failed after all retries');
}

const getOidcConfig = memoize(
  async () => {
    return await discoverWithRetry(3, 1000);
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const dbUrl = process.env.DATABASE_URL;
  const sessionSecret = process.env.SESSION_SECRET || "temp_secret_for_dev_resilience";

  let store;

  // Try to use Postgres store if URL is present and not explicitly internal Replit alias 'helium'
  if (dbUrl && !dbUrl.includes('@helium')) {
    try {
      const pgStore = connectPg(session);
      store = new pgStore({
        conString: dbUrl,
        createTableIfMissing: false,
        ttl: sessionTtl / 1000, // seconds
        tableName: "sessions",
        // Increase error resilience
        errorLog: (err) => console.error('[Session Store Error]', err.message)
      });

      console.log("[Session] Initialized PostgreSQL session store");
    } catch (err) {
      console.error("[Session] Failed to init PG store, falling back to MemoryStore:", err);
    }
  } else if (dbUrl && dbUrl.includes('@helium')) {
    console.warn("[Session] Internal Replit alias 'helium' detected. Falling back to MemoryStore for resilience.");
  }

  return session({
    secret: sessionSecret,
    store: store, // If undefined, express-session defaults to MemoryStore
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, (err: any) => {
      if (err) {
        const isDnsError = err?.code === 'EAI_AGAIN' ||
          err?.message?.includes('EAI_AGAIN') ||
          err?.code === 'ENOTFOUND';
        if (isDnsError) {
          console.error("DNS resolution error during auth callback:", err.message);
          return res.redirect("/api/login?error=network");
        }
        return next(err);
      }
      next();
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
