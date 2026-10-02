// pocketbase/pb_hooks/off-upload.pb.js
// Relaie vers Open Food Facts la photo des ingrédients envoyée par l'app,
// en y ajoutant les identifiants du compte contributeur lus dans
// l'environnement du service (OFF_CONTRIBUTOR_USER/PASSWORD) : ils ne
// quittent jamais le serveur. Réservé aux utilisateurs connectés. Sous
// /api/ pour passer par la route nginx existante. OFF_UPLOAD_URL ne sert
// qu'aux tests (pocketbase/off-upload.test.ts).
routerAdd("POST", "/api/oxalapp/off-upload", (e) => {
  const user = $os.getenv("OFF_CONTRIBUTOR_USER");
  const password = $os.getenv("OFF_CONTRIBUTOR_PASSWORD");
  if (!user || !password) {
    return e.json(500, { error: "off_contributor_not_configured" });
  }

  const code = e.request.formValue("code");
  const lang = e.request.formValue("lang");
  if (!/^\d{8,14}$/.test(code) || !/^[a-z]{2}$/.test(lang)) {
    return e.json(400, { error: "invalid_code_or_lang" });
  }

  let image;
  try {
    image = e.findUploadedFiles("image")[0];
  } catch (err) {
    image = undefined;
  }
  if (!image) {
    return e.json(400, { error: "missing_image" });
  }

  const form = new FormData();
  form.append("code", code);
  form.append("user_id", user);
  form.append("password", password);
  form.append("imagefield", "ingredients_" + lang);
  form.append("imgupload_ingredients_" + lang, image);

  let response;
  try {
    response = $http.send({
      url: $os.getenv("OFF_UPLOAD_URL") || "https://world.openfoodfacts.org/cgi/product_image_upload.pl",
      method: "POST",
      body: form,
      timeout: 60,
    });
  } catch (err) {
    return e.json(502, { error: "off_unreachable" });
  }

  if (response.statusCode !== 200) {
    return e.json(502, { error: "off_rejected" });
  }
  return e.json(200, { ok: true });
}, $apis.requireAuth());
