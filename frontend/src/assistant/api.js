import { supabase } from "../supabaseClient";
export async function assistantApi(path, body, method = body ? "POST" : "GET") {
  const { data: { session } } = await supabase.auth.getSession();
  let response;
  try { response = await fetch(`/api/v1${path}`, {
    method, credentials: "same-origin", signal: AbortSignal.timeout(20000), headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }, ...(body ? { body: JSON.stringify(body) } : {}),
  }); } catch (e) { throw new Error(e.name === "TimeoutError" ? "The request timed out. Your draft is still available; please retry." : "Unable to reach the server. Please check your connection and retry."); }
  let data;
  try { data = await response.json(); } catch { const error = new Error("The server returned an invalid response. Please retry."); error.status = response.status || 503; throw error; }
  if (!response.ok) { const error = new Error(data.error || "Unable to connect."); error.status = response.status; throw error; }
  return data;
}
