#!/usr/bin/env node
/**
 * One-shot setup for a brand-new Shopify store.
 *
 * Creates everything the storefront code expects:
 *   - the smart collections (categories, genders, brands, gender × category, promo, limited…)
 *   - the optional product metafield definitions (custom.fit / story / weight / drop / benefits / specs)
 *   - publishes the collections to every sales channel (Online Store, Hydrogen…)
 *
 * It is safe to run several times: existing collections and definitions are skipped.
 *
 * Usage:
 *   SHOPIFY_STORE=xxxx.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/setup-store.mjs
 *
 * Get the token: Shopify admin → Settings → Apps and sales channels → Develop apps →
 * Create an app → Configure Admin API scopes: write_products, write_publications,
 * read_publications, write_metafields (for the definitions). Install the app and copy
 * the Admin API access token.
 */

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API = '2025-10';

if (!STORE || !TOKEN) {
  console.error(
    'Missing env. Run:\n  SHOPIFY_STORE=xxxx.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/setup-store.mjs',
  );
  process.exit(1);
}

/* ---------- What to create (keep in sync with app/lib/config.ts + navigation.ts) ---------- */

const BRANDS = [
  'Nike',
  'Jordan',
  'Adidas',
  'New Balance',
  'Asics',
  'Puma',
  'On',
  'Hoka',
  'Converse',
  'Vans',
  'Reebok',
  'Lacoste',
  'The North Face',
  'Dior',
  'Louis Vuitton',
];
const CATEGORIES = ['running', 'lifestyle', 'basketball', 'outdoor'];
const GENDERS = ['homme', 'femme'];

const tag = (t) => ({column: 'TAG', relation: 'EQUALS', condition: t});
const vendor = (v) => ({column: 'VENDOR', relation: 'EQUALS', condition: v});
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const handleOf = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const COLLECTIONS = [
  {
    title: 'All',
    handle: 'all',
    rules: [
      {column: 'VARIANT_PRICE', relation: 'GREATER_THAN', condition: '0'},
    ],
  },
  {title: 'Homme', handle: 'homme', rules: [tag('homme')]},
  {title: 'Femme', handle: 'femme', rules: [tag('femme')]},
  {title: 'Enfant', handle: 'enfant', rules: [tag('enfant')]},
  {title: 'Bébé', handle: 'bebe', rules: [tag('bebe')]},
  {title: 'Junior', handle: 'junior', rules: [tag('junior')]},
  {
    title: 'Promo',
    handle: 'promo',
    rules: [
      {column: 'IS_PRICE_REDUCED', relation: 'IS_SET', condition: 'true'},
    ],
  },
  {title: 'Restock', handle: 'restock', rules: [tag('restock')]},
  {title: 'Limited', handle: 'limited', rules: [tag('limited')]},
  ...CATEGORIES.map((c) => ({title: cap(c), handle: c, rules: [tag(c)]})),
  ...GENDERS.flatMap((g) =>
    CATEGORIES.map((c) => ({
      title: `${cap(g)} ${cap(c)}`,
      handle: `${g}-${c}`,
      rules: [tag(g), tag(c)],
    })),
  ),
  {
    title: 'Femme Plateformes',
    handle: 'femme-plateformes',
    rules: [tag('femme'), tag('plateforme')],
  },
  ...BRANDS.map((b) => ({title: b, handle: handleOf(b), rules: [vendor(b)]})),
  {
    title: 'Adidas Originals',
    handle: 'adidas-originals',
    any: true,
    rules: [vendor('Adidas Originals'), tag('originals')],
  },
  {
    title: 'Luxe',
    handle: 'luxe',
    any: true,
    description:
      '<p>Les sneakers des maisons de luxe — Dior, Louis Vuitton — vérifiées une par une.</p>',
    rules: [vendor('Dior'), vendor('Louis Vuitton'), tag('luxe')],
  },
];

const METAFIELDS = [
  {key: 'fit', name: 'Fit (conseil de taille)', type: 'single_line_text_field'},
  {key: 'story', name: 'Story (intro)', type: 'multi_line_text_field'},
  {key: 'weight', name: 'Poids', type: 'single_line_text_field'},
  {key: 'drop', name: 'Drop', type: 'single_line_text_field'},
  {key: 'benefits', name: 'Bénéfices (JSON)', type: 'json'},
  {key: 'specs', name: 'Caractéristiques (JSON)', type: 'json'},
];

/* ---------- Admin API helper ---------- */

async function gql(query, variables = {}) {
  const res = await fetch(`https://${STORE}/admin/api/${API}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({query, variables}),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

/* ---------- Steps ---------- */

async function existingCollections() {
  const map = new Map();
  let after = null;
  do {
    const d = await gql(
      `query($after: String) {
        collections(first: 250, after: $after) {
          nodes { id handle }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      {after},
    );
    for (const c of d.collections.nodes) map.set(c.handle, c.id);
    after = d.collections.pageInfo.hasNextPage
      ? d.collections.pageInfo.endCursor
      : null;
  } while (after);
  return map;
}

async function createCollections() {
  const existing = await existingCollections();
  const ids = [];
  for (const c of COLLECTIONS) {
    if (existing.has(c.handle)) {
      console.log(`  = ${c.handle} (exists)`);
      ids.push(existing.get(c.handle));
      continue;
    }
    const d = await gql(
      `mutation($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection { id handle }
          userErrors { field message }
        }
      }`,
      {
        input: {
          title: c.title,
          handle: c.handle,
          descriptionHtml: c.description ?? '',
          sortOrder: 'CREATED_DESC',
          ruleSet: {appliedDisjunctively: Boolean(c.any), rules: c.rules},
        },
      },
    );
    const r = d.collectionCreate;
    if (r.userErrors.length) {
      console.log(
        `  ! ${c.handle}: ${r.userErrors.map((e) => e.message).join(', ')}`,
      );
    } else {
      console.log(`  + ${c.handle}`);
      ids.push(r.collection.id);
    }
  }
  return ids;
}

async function publishCollections(ids) {
  const d = await gql(
    `{ publications(first: 25) { nodes { id catalog { title } } } }`,
  );
  const pubs = d.publications.nodes;
  if (!pubs.length)
    return console.log(
      '  (no sales channels found yet — install Hydrogen first, then re-run)',
    );
  console.log(
    `  channels: ${pubs.map((p) => p.catalog?.title ?? p.id).join(', ')}`,
  );
  const input = pubs.map((p) => ({publicationId: p.id}));
  for (const id of ids) {
    const r = await gql(
      `mutation($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) { userErrors { message } }
      }`,
      {id, input},
    );
    const errs = r.publishablePublish.userErrors;
    if (errs.length)
      console.log(`  ! ${id}: ${errs.map((e) => e.message).join(', ')}`);
  }
  console.log(`  published ${ids.length} collections`);
}

async function createMetafields() {
  const d = await gql(
    `{ metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: "custom") { nodes { key } } }`,
  );
  const have = new Set(d.metafieldDefinitions.nodes.map((n) => n.key));
  for (const m of METAFIELDS) {
    if (have.has(m.key)) {
      console.log(`  = custom.${m.key} (exists)`);
      continue;
    }
    const r = await gql(
      `mutation($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { key }
          userErrors { message }
        }
      }`,
      {
        definition: {
          name: m.name,
          namespace: 'custom',
          key: m.key,
          type: m.type,
          ownerType: 'PRODUCT',
          access: {storefront: 'PUBLIC_READ'},
        },
      },
    );
    const errs = r.metafieldDefinitionCreate.userErrors;
    console.log(
      errs.length
        ? `  ! custom.${m.key}: ${errs.map((e) => e.message).join(', ')}`
        : `  + custom.${m.key}`,
    );
  }
}

/* ---------- Run ---------- */

console.log(`\nSetting up ${STORE}\n`);
console.log('Collections');
const ids = await createCollections();
console.log('\nSales channels');
await publishCollections(ids);
console.log('\nProduct metafields');
await createMetafields();
console.log(`
Done. Next, in Shopify admin:
  - Settings → Markets: add Morocco, currency MAD
  - Settings → Payments → Manual payment methods: Cash on Delivery
  - Apps: install "Search & Discovery" and enable the filters (Availability, Price, Vendor, Pointure, Couleur)
  - Products: Vendor = brand name, tags as described in README.md
`);
