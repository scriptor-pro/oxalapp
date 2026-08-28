// pocketbase/pb_hooks/usda-proxy.pb.js
routerAdd("GET", "/usda/product/{gtin}", (e) => {
  const gtin = e.request.pathValue("gtin");
  const apiKey = $os.getenv("USDA_API_KEY");

  if (!apiKey) {
    return e.json(500, { error: "usda_api_key_not_configured" });
  }

  const searchUrl =
    "https://api.nal.usda.gov/fdc/v1/foods/search" +
    "?api_key=" + encodeURIComponent(apiKey) +
    "&query=" + encodeURIComponent(gtin) +
    "&dataType=Branded";

  let response;
  try {
    response = $http.send({
      url: searchUrl,
      method: "GET",
    });
  } catch (err) {
    return e.json(404, { error: "not_found" });
  }

  if (response.statusCode !== 200) {
    return e.json(404, { error: "not_found" });
  }

  let data;
  try {
    data = response.json;
  } catch (err) {
    return e.json(404, { error: "not_found" });
  }

  const foods = data.foods || [];
  let match = null;
  for (let i = 0; i < foods.length; i++) {
    if (foods[i].gtinUpc === gtin) {
      match = foods[i];
      break;
    }
  }

  if (!match) {
    return e.json(404, { error: "not_found" });
  }

  return e.json(200, {
    productName: match.description || "",
    brand: match.brandName || match.brandOwner || "",
    ingredientsText: match.ingredients || "",
    category: match.foodCategory || "",
    servingSize: typeof match.servingSize === "number" ? match.servingSize : null,
    servingSizeUnit: match.servingSizeUnit || "",
  });
});
