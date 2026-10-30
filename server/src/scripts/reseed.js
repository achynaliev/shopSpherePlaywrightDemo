// Wipes every table and re-seeds the catalog. Usage: npm run seed
import { loadConfig } from '../config.js';
import { openDb } from '../db.js';
import { seedIfEmpty } from '../seed.js';

const config = loadConfig();
const db = openDb(config.databasePath);
seedIfEmpty(db, { ...config, logRequests: true }, { force: true });
db.close();
