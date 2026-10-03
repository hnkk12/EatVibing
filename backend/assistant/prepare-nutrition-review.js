// Generate a candidate manifest without fabricating ingredients, serving sizes or nutrients.
const fs = require("node:fs");
const { loadCatalog } = require("./catalog");
const catalog = loadCatalog();
const vietnameseNames = ["Phở gà", "Bún bò Huế", "Bún chả", "Bún thịt nướng", "Bún cá", "Bún riêu", "Bánh mì trứng", "Bánh cuốn", "Bánh xèo", "Gỏi cuốn tôm thịt", "Gỏi gà", "Gỏi ngó sen", "Cá kho tộ", "Thịt kho trứng", "Gà kho gừng", "Gà luộc", "Cá hấp gừng", "Đậu hũ sốt cà chua", "Rau muống xào tỏi", "Canh rau ngót thịt bằm", "Canh bí đỏ", "Canh cải đậu hũ", "Canh chua cá", "Cháo gà", "Cháo đậu xanh", "Cơm gạo lứt", "Rau củ luộc"];
const existingVietnamese = catalog.filter(m => /vietnam|viet nam/i.test(m.origin));
const international = catalog.filter(m => !/vietnam|viet nam/i.test(m.origin)).slice(0, 30);
const candidate = m => ({ id: m.id, name: m.name, cuisine: m.origin, sourceUrl: m.source_url || m.catalog_source_url || null, ingredients: m.ingredients, status: "awaiting-review", baseServings: null, perServing: null, reviewedBy: null, reviewedAt: null, required: ["confirm-source", "measure-edible-ingredients", "map-food-identifiers", "confirm-raw-or-cooked", "confirm-yield-and-servings", "review-allergens", "review-nutrition"] });
const queue = [...existingVietnamese.slice(0, 30).map(candidate), ...vietnameseNames.slice(0, Math.max(0, 30 - existingVietnamese.length)).map((name, i) => candidate({ id: "pending-vietnam-" + (i + 1), name, origin: "Vietnam", ingredients: [] })), ...international.map(candidate)];
const output = process.argv[2];
if (!output) throw new Error("Provide an output JSON path for the review manifest.");
fs.writeFileSync(output, JSON.stringify({ target: { vietnamese: 30, international: 30 }, verifiedCount: 0, recipes: queue }, null, 2) + "\n");
console.log("Prepared " + queue.length + " candidates; no recipes have been marked nutritionally verified.");
