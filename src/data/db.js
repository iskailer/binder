import { APP_CONFIG } from "../config/appConfig.js";

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  const PouchDB = await waitForPouchDb();
  dbInstance = new PouchDB(APP_CONFIG.dbName, { auto_compaction: true });
  return dbInstance;
}

export function buildDocId(type, id) {
  return `${type}:${id}`;
}

export async function saveEntity(type, entity) {
  const db = await getDb();
  const _id = buildDocId(type, entity.id);
  const current = await getRawDoc(_id);
  const { _rev, ...entityBody } = entity;
  const doc = {
    ...(current || {}),
    ...entityBody,
    _id,
    type
  };

  if (_rev || current?._rev) {
    doc._rev = _rev || current._rev;
  }

  const result = await db.put(doc);
  return { ...entityBody, _rev: result.rev };
}

export async function getEntity(type, id) {
  const doc = await getRawDoc(buildDocId(type, id));
  return doc ? mapDoc(doc) : null;
}

export async function listEntities(type) {
  const db = await getDb();
  const result = await db.allDocs({
    include_docs: true,
    startkey: `${type}:`,
    endkey: `${type}:\ufff0`
  });

  return result.rows.map((row) => mapDoc(row.doc));
}

export async function removeEntity(type, id) {
  const db = await getDb();
  const doc = await getRawDoc(buildDocId(type, id));
  if (!doc) return;
  await db.remove(doc);
}

async function getRawDoc(_id) {
  const db = await getDb();
  try {
    return await db.get(_id);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

function mapDoc(doc) {
  const { _id, type, ...entity } = doc;
  return entity;
}

async function waitForPouchDb() {
  if (globalThis.PouchDB) return globalThis.PouchDB;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (globalThis.PouchDB) return globalThis.PouchDB;
  }

  throw new Error("PouchDB nao carregou. Verifique conexao na primeira abertura do app.");
}
