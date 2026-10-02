let visitor = localStorage.getItem("eatvibing-visitor");
if (!visitor) {
  visitor = crypto.randomUUID();
  localStorage.setItem("eatvibing-visitor", visitor);
}
export async function api(route, body) {
  const response = await fetch(`/api${route}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "x-visitor-id": visitor },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || "Unable to connect.");
  return result;
}
