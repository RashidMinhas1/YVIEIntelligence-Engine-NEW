import fs from "fs";
import path from "path";

const localDbPath = path.join(process.cwd(), ".local-db.json");

type LocalDbSchema = {
  titleFormats: any[];
  videoIdeas: any[];
  generatedScripts: any[];
  titleAnalyses: any[];
  scriptAnalyses: any[];
  libraryFolders: any[];
  libraryItems: any[];
  jobs: any[];
  // Enterprise Dashboard Tables
  researchSessions: any[];
  researchItems: any[];
  analysisResults: any[];
  cachedResults: any[];
};

const DEFAULT_DB = {
  titleFormats: [],
  videoIdeas: [],
  generatedScripts: [],
  titleAnalyses: [],
  scriptAnalyses: [],
  libraryFolders: [],
  libraryItems: [],
  jobs: [],
  researchSessions: [],
  researchItems: [],
  analysisResults: [],
  cachedResults: [],
};

function getLocalDb(): LocalDbSchema {
  if (fs.existsSync(localDbPath)) {
    try {
      return { ...DEFAULT_DB, ...JSON.parse(fs.readFileSync(localDbPath, "utf-8")) };
    } catch {
      return { ...DEFAULT_DB };
    }
  }
  return { ...DEFAULT_DB };
}

function saveLocalDb(data: LocalDbSchema, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), "utf-8");
      return;
    } catch (e) {
      if (i === retries - 1) {
        console.error("Failed to save local DB after retries:", e);
        throw e;
      }
      // Wait 50ms before retrying
      const start = Date.now();
      while (Date.now() - start < 50) { /* wait */ }
    }
  }
}

export const localDb = {
  getDb: getLocalDb,
  saveDb: saveLocalDb,
  getAll(table: keyof LocalDbSchema) {
    const db = getLocalDb();
    return db[table] || [];
  },
  insert(table: keyof LocalDbSchema, record: any) {
    const db = getLocalDb();
    if (!db[table]) db[table] = [];
    const newRecord = { ...record, id: Date.now(), createdAt: new Date().toISOString() };
    db[table].unshift(newRecord);
    saveLocalDb(db);
    return newRecord;
  }
};
