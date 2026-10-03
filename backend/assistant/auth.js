const { randomBytes, createHash } = require("node:crypto");
const { mutate } = require("./store");
const hash = value => createHash("sha256").update(value).digest("hex");
function installDemo(app, store) {
  app.post("/api/v1/demo-session", async (req, res, next) => {
    try {
      const token = randomBytes(32).toString("hex");
      const actor = "demo-" + randomBytes(16).toString("hex");
      await mutate(store, s => { s.demos[hash(token)] = { actor, expires: Date.now() + 86400000 * 7 }; });
      res.cookie("eatvibing_demo", token, { httpOnly: true, sameSite: "strict", maxAge: 86400000 * 7, path: "/api/v1" });
      res.json({ demo: true });
    } catch (e) { next(e); }
  });
}
function authenticator({ client, store, demo = false }) {
  return async req => {
    const authorization = req.headers.authorization;
    if (authorization) {
      if (!authorization.startsWith("Bearer ") || !client) { const e = new Error("Sign in again."); e.status = 401; throw e; }
      const { data, error } = await client.auth.getUser(authorization.slice(7));
      if (error || !data?.user || data.user.is_anonymous) { const e = new Error("Sign in again."); e.status = 401; throw e; }
      return { id: data.user.id, demo: false };
    }
    if (demo) {
      const cookie = (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith("eatvibing_demo="));
      const token = cookie?.slice("eatvibing_demo=".length);
      if (token && /^[a-f0-9]{64}$/.test(token)) {
        const { data } = await store.read();
        const session = data.demos[hash(token)];
        if (session?.expires > Date.now()) return { id: session.actor, demo: true };
      }
    }
    const e = new Error("Sign in to manage your personal data."); e.status = 401; throw e;
  };
}
module.exports = { authenticator, installDemo, hash };
