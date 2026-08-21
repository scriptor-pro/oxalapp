/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("scans");

  collection.fields.add(new Field({
    name: "created",
    type: "autodate",
    onCreate: true,
    onUpdate: false,
  }));
  collection.fields.add(new Field({
    name: "updated",
    type: "autodate",
    onCreate: true,
    onUpdate: true,
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("scans");

  collection.fields.removeByName("created");
  collection.fields.removeByName("updated");

  return app.save(collection);
});
