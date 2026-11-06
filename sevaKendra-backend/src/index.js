import express from "express";
import mongoose from "mongoose";
import dbConnect from "./utils/dbConnection.js";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import { sanitizeInput } from "./middleware/sanitizeInput.js";
import indexRouter from "./routers/index.js";
import { appConfig } from "./config/appConfig.js";

const app = express();
app.disable("x-powered-by");
// Parse query strings as flat strings/arrays only, so `?status[$ne]=x` stays the literal key
// "status[$ne]" instead of becoming a MongoDB operator.
app.set("query parser", "simple");

const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_URL);
const isRender = Boolean(process.env.RENDER); // set by Render on every service

const whitelist = [
  appConfig.whiteList,
  appConfig.vercel,
  appConfig.frontendUrl,
  isVercel ? "https://seva-kendra-frontend.vercel.app" : "",
]
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

// Only behind the host's own proxy (Render, Vercel) is X-Forwarded-For trustworthy; elsewhere
// a client could set it and dodge the per-IP sign-in limit.
if (isVercel || isRender) app.set("trust proxy", 1);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in whitelist
    if (whitelist.includes(origin)) {
      callback(null, true);
      return;
    }

    // Vercel preview deployments of this project's frontend only (not every *.vercel.app site)
    if (/^https:\/\/seva-kendra-frontend(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) {
      callback(null, true);
      return;
    }

    // Allow localhost in development
    if (appConfig.nodeEnv !== "production" && (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1"))) {
      callback(null, true);
      return;
    }

    console.error(`CORS blocked for origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression()); // record lists are large JSON; gzip cuts them by ~80%
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeInput);
app.use(morgan("tiny"));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Health check at root
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ngo_backend_root",
    vercel: isVercel,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ngo_backend",
    environment: appConfig.nodeEnv || "development",
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState
  });
});

// Vercel DB connection middleware — MUST be before routes
if (isVercel) {
  let cachedDb = null;
  app.use(async (req, res, next) => {
    try {
      if (!cachedDb) {
        cachedDb = dbConnect();
      }
      await cachedDb;
      next();
    } catch (err) {
      console.error("Database connection middleware error:", err.message);
      res.status(503).json({ error: "Database connection failed" });
    }
  });
}

// API answers hold personal and health data: never let a browser or proxy store them.
app.use("/api/v1", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/api/v1", indexRouter);

app.use(notFound);
app.use(errorHandler);

const port = appConfig.port;

const startServer = async () => {
  try {
    await dbConnect();

    // Listen only once the database is connected, so /health "ok" means ready to serve.
    const server = app.listen(port, () => {
      console.log(`Server Running on ${port}`);
    });

    // The host stops the process when it sleeps or redeploys: finish requests in flight first.
    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down`);
      server.close(() => {
        mongoose.connection.close(false).finally(() => process.exit(0));
      });
      setTimeout(() => process.exit(0), 10_000).unref();
    };
    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Only start the server locally (Vercel handles listening itself)
if (!isVercel) {
  startServer();
}

export default app;