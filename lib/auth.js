import Database from "better-sqlite3";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "pocketful_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_HASH_BYTES = 64;
const DUMMY_SALT = "7cddfb3c1f3a5d600000000000000000";

export function getDatabase() {
  let database = globalThis.pocketfulDatabase;
  if (!database) {
    const filePath = process.env.DATABASE_PATH || join(process.cwd(), "data", "pocketful.sqlite");
    mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 });
    database = new Database(filePath);
    chmodSync(filePath, 0o600);
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    globalThis.pocketfulDatabase = database;
  }
  if (globalThis.pocketfulDatabaseSchemaVersion !== 2) {
    database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS finance_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL DEFAULT 'demo' CHECK (mode IN ('demo', 'real'))
    );
    CREATE TABLE IF NOT EXISTS finance_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      institution TEXT NOT NULL DEFAULT '',
      account_type TEXT NOT NULL,
      opening_balance_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, name)
    );
    CREATE TABLE IF NOT EXISTS finance_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      due_date TEXT NOT NULL,
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
      happened_on TEXT NOT NULL,
      source_bill_id INTEGER UNIQUE REFERENCES finance_bills(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS finance_transactions_user_date_idx ON finance_transactions(user_id, happened_on);
    CREATE TABLE IF NOT EXISTS finance_budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      monthly_limit_cents INTEGER NOT NULL CHECK (monthly_limit_cents > 0),
      UNIQUE (user_id, category)
    );
    CREATE TABLE IF NOT EXISTS finance_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target_cents INTEGER NOT NULL CHECK (target_cents > 0),
      saved_cents INTEGER NOT NULL DEFAULT 0 CHECK (saved_cents >= 0)
    );
    `);
    globalThis.pocketfulDatabaseSchemaVersion = 2;
  }
  globalThis.pocketfulDatabase = database;
  return database;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password, salt) {
  const result = await scrypt(password, salt, PASSWORD_HASH_BYTES, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return result.toString("hex");
}

function createSession(userId) {
  const database = getDatabase();
  const token = randomBytes(32).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL_SECONDS;

  database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  database.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).run(hashToken(token), userId, expiresAt, now);

  return { token, expiresAt };
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionLifetime() {
  return SESSION_TTL_SECONDS;
}

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocol = forwardedProtocol || new URL(request.url).protocol.slice(0, -1);
  if (!origin || !host || (protocol !== "http" && protocol !== "https")) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host.toLowerCase() === host.toLowerCase()
      && originUrl.protocol === `${protocol}:`
      && !originUrl.username
      && !originUrl.password;
  } catch {
    return false;
  }
}

export function validateCredentials(username, password, isRegistration = false) {
  if (typeof username !== "string" || !/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
    return "Username must be 3–32 characters and use only letters, numbers, underscores, or hyphens.";
  }
  if (typeof password !== "string" || password.length < 9 || password.length > 32) {
    return "Password must be between 9 and 32 characters.";
  }
  if (isRegistration && password.trim().length === 0) {
    return "Password cannot contain only spaces.";
  }
  return null;
}

export async function registerUser(username, password) {
  const database = getDatabase();
  const normalizedUsername = username.toLowerCase();
  const salt = randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(password, salt);
  const createdAt = Math.floor(Date.now() / 1000);

  try {
    const result = database.prepare(
      "INSERT INTO users (username, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?)"
    ).run(normalizedUsername, salt, passwordHash, createdAt);
    return { id: Number(result.lastInsertRowid), username: normalizedUsername };
  } catch (error) {
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("USERNAME_TAKEN");
    }
    throw error;
  }
}

export async function verifyUser(username, password) {
  const database = getDatabase();
  const normalizedUsername = username.toLowerCase();
  const user = database.prepare(
    "SELECT id, username, password_salt, password_hash FROM users WHERE username = ? COLLATE NOCASE"
  ).get(normalizedUsername);
  const salt = user?.password_salt || DUMMY_SALT;
  const actualHash = await hashPassword(password, salt);
  const expectedHash = user?.password_hash || "0".repeat(PASSWORD_HASH_BYTES * 2);
  const isMatch = timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));

  return user && isMatch ? { id: user.id, username: user.username } : null;
}

export function issueSession(userId) {
  return createSession(userId);
}

export function findSession(token) {
  if (!token || typeof token !== "string") return null;
  const now = Math.floor(Date.now() / 1000);
  const session = getDatabase().prepare(`
    SELECT users.id, users.username
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), now);
  return session ? { id: session.id, username: session.username } : null;
}

export function revokeSession(token) {
  if (typeof token !== "string" || token.length === 0) return;
  getDatabase().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}
