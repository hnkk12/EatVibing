export const regions = [
  { id: 'asia', label: 'Asia' },
  { id: 'europe', label: 'Europe' },
  { id: 'americas', label: 'Americas' },
  { id: 'other', label: 'Other cuisines' },
];

const countries = [
  ['vietnam', 'Vietnam', 'Việt Nam', 'asia', 'Vietnamese'],
  ['japan', 'Japan', 'Nhật Bản', 'asia', 'Japanese'],
  ['korea', 'South Korea', 'Hàn Quốc', 'asia', 'Korean', 'Korea'],
  ['china', 'China', 'Trung Quốc', 'asia', 'Chinese'],
  ['thailand', 'Thailand', 'Thái Lan', 'asia', 'Thai'],
  ['india', 'India', 'Ấn Độ', 'asia', 'Indian'],
  ['philippines', 'Philippines', 'Philippines', 'asia', 'Filipino'],
  ['saudi-arabia', 'Saudi Arabia', 'Ả Rập Xê Út', 'asia', 'Saudi Arabian'],
  ['italy', 'Italy', 'Ý', 'europe', 'Italian'],
  ['france', 'France', 'Pháp', 'europe', 'French'],
  ['uk', 'United Kingdom', 'Anh', 'europe', 'British', 'English', 'UK'],
  ['norway', 'Norway', 'Na Uy', 'europe', 'Norwegian'],
  ['greece', 'Greece', 'Hy Lạp', 'europe', 'Greek'],
  ['spain', 'Spain', 'Tây Ban Nha', 'europe', 'Spanish'],
  ['portugal', 'Portugal', 'Bồ Đào Nha', 'europe', 'Portuguese'],
  ['usa', 'United States', 'Mỹ', 'americas', 'American', 'USA', 'United States of America'],
  ['mexico', 'Mexico', 'Mexico', 'americas', 'Mexican'],
  ['peru', 'Peru', 'Peru', 'americas', 'Peruvian'],
  ['brazil', 'Brazil', 'Brazil', 'americas', 'Brazilian'],
  ['canada', 'Canada', 'Canada', 'americas', 'Canadian'],
  ['jamaica', 'Jamaica', 'Jamaica', 'americas', 'Jamaican'],
  ['australia', 'Australia', 'Úc', 'other', 'Australian'],
  ['morocco', 'Morocco', 'Ma Rốc', 'other', 'Moroccan'],
];

export function normalizeSearch(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export function cuisineFor(origin) {
  const match = countries.find(([, en, vi, , ...aliases]) =>
    [en, vi, ...aliases].some((name) => normalizeSearch(name) === normalizeSearch(origin)),
  );
  if (!match) return { id: normalizeSearch(origin) || 'unknown', label: origin || 'Unspecified', localLabel: origin || 'Unspecified', region: 'other' };
  const [id, label, localLabel, region] = match;
  return { id, label, localLabel, region };
}

export function matchesRecipe(meal, query) {
  const cuisine = cuisineFor(meal.origin);
  const text = normalizeSearch([
    meal.name, meal.origin, cuisine.label, cuisine.localLabel, meal.description, ...(meal.search_aliases || []),
    ...(meal.ingredients || []), ...(meal.recipes || []).map((step) => `${step.title || ''} ${step.details || ''}`),
  ].join(' '));
  return normalizeSearch(query).split(/\s+/).every((word) => text.includes(word));
}

export function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  return [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}
