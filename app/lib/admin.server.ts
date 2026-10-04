/**
 * Server-only access to the Shopify Admin API, through a Dev Dashboard app
 * installed on the store (client credentials grant). Used to save customer
 * reviews as drafts and to check an order number for the "Achat vérifié"
 * badge. Never import this file from client code.
 */

const ADMIN_API_VERSION = '2026-04';

type Creds = {shop: string; clientId: string; clientSecret: string};

let cached: {token: string; expires: number; key: string} | null = null;

export function adminCreds(env: Env): Creds | null {
  const shop = (env.PUBLIC_STORE_DOMAIN || '').replace(/^https?:\/\//, '');
  const clientId = env.PRIVATE_ADMIN_CLIENT_ID;
  const clientSecret = env.PRIVATE_ADMIN_CLIENT_SECRET;
  if (!shop || !clientId || !clientSecret) return null;
  return {shop, clientId, clientSecret};
}

async function accessToken(c: Creds) {
  const key = `${c.shop}:${c.clientId}`;
  if (cached && cached.key === key && cached.expires > Date.now()) {
    return cached.token;
  }
  const res = await fetch(`https://${c.shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: c.clientId,
      client_secret: c.clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Admin token request failed (${res.status})`);
  const json = (await res.json()) as {access_token: string; expires_in: number};
  cached = {
    token: json.access_token,
    // Refresh 5 minutes early.
    expires: Date.now() + (json.expires_in - 300) * 1000,
    key,
  };
  return json.access_token;
}

export async function adminGraphql<T>(
  c: Creds,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await accessToken(c);
  const res = await fetch(
    `https://${c.shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({query, variables}),
    },
  );
  const json = (await res.json()) as {data?: T; errors?: unknown};
  if (!res.ok || json.errors || !json.data) {
    throw new Error(
      `Admin API error (${res.status}): ${JSON.stringify(json.errors ?? '')}`,
    );
  }
  return json.data;
}
