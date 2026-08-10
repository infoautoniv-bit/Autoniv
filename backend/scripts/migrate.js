/**
 * Database migration runner.
 *
 * Usage:
 *   node scripts/migrate.js <migration-name>
 *
 * Example:
 *   node scripts/migrate.js add-agent-indexes
 *
 * Migrations are stored in scripts/migrations/ and run once (tracked in a
 * `migrations` collection). Create a new file named <timestamp>_<name>.js
 * that exports an `up(db)` async function.
 */

import 'dotenv/config';
import { connectDb, closeDb } from '../db/connection.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function getExecutedMigrations(db) {
  const col = db.collection('migrations');
  const docs = await col.find({}).toArray();
  return new Set(docs.map((d) => d.name));
}

async function markExecuted(db, name) {
  const col = db.collection('migrations');
  await col.insertOne({ name, executedAt: new Date() });
}

async function run() {
  const migrationName = process.argv[2];
  if (!migrationName) {
    console.error('Usage: node scripts/migrate.js <migration-name>');
    process.exit(1);
  }

  const migrationFile = path.join(MIGRATIONS_DIR, `${migrationName}.js`);
  if (!fs.existsSync(migrationFile)) {
    console.error(`Migration not found: ${migrationFile}`);
    process.exit(1);
  }

  await connectDb();
  const db = mongoose.connection.db;

  const executed = await getExecutedMigrations(db);
  if (executed.has(migrationName)) {
    console.log(`Migration "${migrationName}" already executed. Skipping.`);
    await closeDb();
    return;
  }

  console.log(`Running migration: ${migrationName}`);
  const migration = await import(migrationFile);

  try {
    await migration.up(db);
    await markExecuted(db, migrationName);
    console.log(`Migration "${migrationName}" completed successfully.`);
  } catch (err) {
    console.error(`Migration "${migrationName}" failed:`, err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

run();
