/*import { FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET } from "./fatsecret-config";
import { encode as btoa } from "base-64";

export async function getFatSecretToken() {
  const credentials = btoa(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`);
  const token = `${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`;

  const response = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=basic",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to get token", data);
    throw new Error(data.error_description || "Token fetch failed");
  }
  
  console.log("FatSecret Token:", token);
  return data.access_token;
}*/
