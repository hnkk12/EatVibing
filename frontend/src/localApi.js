import { supabase } from "./supabaseClient";
let visitor = localStorage.getItem("eatvibing-visitor");
if (!visitor) {
  visitor = crypto.randomUUID();
  localStorage.setItem("eatvibing-visitor", visitor);
}
export async function api(route, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`/api${route}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "x-visitor-id": visitor, ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || "Unable to connect.");
  return result;
}
