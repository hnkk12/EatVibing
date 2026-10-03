const { clean } = require("../ingredients");
function planningIntent(prompt) {
  const value = clean(prompt);
  const swap = /doi mon|doi bua|thay mon|swap|replace.*meal|another.*meal/.test(value);
  const preview = /goi y.*(mon|bua|thuc don)|lap.*thuc don|len.*thuc don|suggest.*(meal|dinner|lunch|breakfast)|plan.*meal|preview.*meal/.test(value);
  if (!swap && !preview) return null;
  const slot = /breakfast|bua sang/.test(value) ? "breakfast" : /lunch|bua trua/.test(value) ? "lunch" : /dinner|bua toi|toi nay/.test(value) ? "dinner" : null;
  const explicitDate = value.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  const offset = /day after tomorrow|ngay kia/.test(value) ? 2 : /tomorrow|ngay mai/.test(value) ? 1 : /yesterday|hom qua/.test(value) ? -1 : 0;
  const needsDate = !explicitDate && /next week|this week|tuan sau|tuan nay|thu hai|thu ba|thu tu|thu nam|thu sau|thu bay|chu nhat|monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(value);
  return { swap, slots: slot ? [slot] : ["breakfast", "lunch", "dinner"], explicitDate, offset, needsDate };
}
module.exports = { planningIntent };
