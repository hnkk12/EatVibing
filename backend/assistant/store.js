const EMPTY = () => ({ profiles: {}, measurements: {}, households: {}, memberships: {}, invites: {}, checkIns: {}, logs: {}, proposals: {}, plans: {}, pantry: {}, messages: {}, feedback: {}, nutrition: {}, demos: {}, events: [] });
// A versioned pilot document provides atomic cross-member changes in both adapters.
// Never expose this document through a client-accessible database policy.
class SQLiteStore {
  constructor(db) {
    this.db = db;
    db.exec("CREATE TABLE IF NOT EXISTS ev_assistant_state(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL,payload TEXT NOT NULL)");
    db.prepare("INSERT OR IGNORE INTO ev_assistant_state VALUES(1,0,?)").run(JSON.stringify(EMPTY()));
  }
  async read() {
    const row = this.db.prepare("SELECT version,payload FROM ev_assistant_state WHERE id=1").get();
    return { version: row.version, data: JSON.parse(row.payload) };
  }
  async compareAndSet(version, data) {
    return this.db.prepare("UPDATE ev_assistant_state SET version=version+1,payload=? WHERE id=1 AND version=?").run(JSON.stringify(data), version).changes === 1;
  }
}
class SupabaseStore {
  constructor(client) { this.client = client; }
  async read() {
    const { data, error } = await this.client.from("ev_assistant_state").select("version,payload").eq("id", 1).single();
    if (error) throw new Error("Assistant database is unavailable. Apply its migration before enabling the service.");
    return { version: data.version, data: data.payload };
  }
  async compareAndSet(version, data) {
    const { data: saved, error } = await this.client.rpc("ev_assistant_commit", { expected_version: version, next_payload: data });
    if (error) throw new Error("Unable to save assistant data.");
    return saved === true;
  }
}
async function mutate(store, action) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { version, data } = await store.read();
    const result = action(data);
    if (result && typeof result.then === "function") throw new Error("Store mutations must be synchronous.");
    if (await store.compareAndSet(version, data)) return result;
  }
  const error = new Error("Data changed while saving. Please retry."); error.status = 409; throw error;
}
module.exports = { EMPTY, SQLiteStore, SupabaseStore, mutate };
