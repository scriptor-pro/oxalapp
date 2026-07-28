migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "scans",
    listRule: "@request.auth.id = user",
    viewRule: "@request.auth.id = user",
    createRule: "@request.auth.id = user",
    updateRule: "@request.auth.id = user",
    deleteRule: null,
    fields: [
      {
        name: "user",
        type: "relation",
        required: true,
        collectionId: "_pb_users_auth_",
        cascadeDelete: true,
        maxSelect: 1,
      },
      { name: "ean", type: "text", required: false },
      { name: "productName", type: "text", required: true },
      {
        name: "level",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["faible", "modéré", "élevé", "très élevé", "non déterminable"],
      },
      {
        name: "source",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["off", "saisie_manuelle"],
      },
      { name: "favorite", type: "bool", required: false },
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("scans");
  return app.delete(collection);
});
