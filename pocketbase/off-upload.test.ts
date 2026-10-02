// @vitest-environment node
// Test d'intégration du relais pb_hooks/off-upload.pb.js : lance le vrai
// binaire PocketBase sur un dossier de données jetable, avec un faux
// serveur Open Food Facts local qui enregistre ce qu'il reçoit.
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const POCKETBASE_DIR = fileURLToPath(new URL(".", import.meta.url));
const BINARY = path.join(POCKETBASE_DIR, "pocketbase");
const SUPERUSER = { email: "relay-test@example.com", password: "relay-test-password" };

interface ReceivedUpload {
  fields: Record<string, string>;
  files: Record<string, string>;
}

async function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

describe.skipIf(!fs.existsSync(BINARY))("relais PocketBase vers Open Food Facts", () => {
  let dataDir: string;
  let pocketbase: ChildProcess;
  let fakeOff: http.Server;
  let baseUrl: string;
  let token: string;
  let received: ReceivedUpload[] = [];
  let upstreamStatus = 200;

  beforeAll(async () => {
    fakeOff = http.createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const form = await new Request("http://fake-off/", {
        method: "POST",
        headers: req.headers as Record<string, string>,
        body: Buffer.concat(chunks),
      }).formData();
      const upload: ReceivedUpload = { fields: {}, files: {} };
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") upload.fields[key] = value;
        else upload.files[key] = await value.text();
      }
      received.push(upload);
      res.writeHead(upstreamStatus, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "status ok" }));
    });
    const offPort = await freePort();
    await new Promise<void>((resolve) => fakeOff.listen(offPort, "127.0.0.1", resolve));

    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oxalapp-pb-"));
    execFileSync(BINARY, ["superuser", "upsert", SUPERUSER.email, SUPERUSER.password, "--dir", dataDir]);

    const pbPort = await freePort();
    baseUrl = `http://127.0.0.1:${pbPort}`;
    pocketbase = spawn(
      BINARY,
      ["serve", "--dir", dataDir, "--hooksDir", path.join(POCKETBASE_DIR, "pb_hooks"), "--http", `127.0.0.1:${pbPort}`],
      {
        env: {
          ...process.env,
          OFF_CONTRIBUTOR_USER: "oxalapp-test",
          OFF_CONTRIBUTOR_PASSWORD: "server-side-secret",
          OFF_UPLOAD_URL: `http://127.0.0.1:${offPort}/cgi/product_image_upload.pl`,
        },
        stdio: "ignore",
      }
    );
    for (let attempt = 0; ; attempt++) {
      try {
        if ((await fetch(`${baseUrl}/api/health`)).ok) break;
      } catch {
        // pas encore prêt
      }
      if (attempt > 100) throw new Error("PocketBase n'a pas démarré");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const auth = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: SUPERUSER.email, password: SUPERUSER.password }),
    });
    token = ((await auth.json()) as { token: string }).token;
  }, 30_000);

  afterAll(async () => {
    pocketbase?.kill();
    await new Promise((resolve) => fakeOff?.close(resolve));
    if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    received = [];
    upstreamStatus = 200;
  });

  function upload(fields: { code?: string; lang?: string; image?: boolean }, auth = true) {
    const form = new FormData();
    if (fields.code !== undefined) form.append("code", fields.code);
    if (fields.lang !== undefined) form.append("lang", fields.lang);
    if (fields.image) form.append("image", new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" }), "photo.jpg");
    return fetch(`${baseUrl}/api/oxalapp/off-upload`, {
      method: "POST",
      headers: auth ? { Authorization: token } : {},
      body: form,
    });
  }

  it("transmet la photo à Open Food Facts avec les identifiants du serveur", async () => {
    const response = await upload({ code: "3017620422003", lang: "fr", image: true });

    expect(response.status).toBe(200);
    expect(received).toHaveLength(1);
    expect(received[0].fields).toEqual({
      code: "3017620422003",
      user_id: "oxalapp-test",
      password: "server-side-secret",
      imagefield: "ingredients_fr",
    });
    expect(received[0].files).toEqual({ imgupload_ingredients_fr: "fake-jpeg-bytes" });
  });

  it("refuse un appel sans utilisateur connecté", async () => {
    const response = await upload({ code: "3017620422003", lang: "fr", image: true }, false);

    expect(response.status).toBe(401);
    expect(received).toHaveLength(0);
  });

  it("refuse un code-barres, une langue ou une photo invalides", async () => {
    for (const fields of [
      { code: "abc", lang: "fr", image: true },
      { code: "3017620422003", lang: "fr&x=1", image: true },
      { code: "3017620422003", lang: "fr" },
    ]) {
      expect((await upload(fields)).status, JSON.stringify(fields)).toBe(400);
    }
    expect(received).toHaveLength(0);
  });

  it("signale l'échec quand Open Food Facts refuse l'envoi", async () => {
    upstreamStatus = 500;
    const response = await upload({ code: "3017620422003", lang: "fr", image: true });

    expect(response.status).toBe(502);
  });

  it("ne renvoie jamais les identifiants au client", async () => {
    const response = await upload({ code: "3017620422003", lang: "fr", image: true });

    expect(await response.text()).not.toContain("server-side-secret");
  });
});
