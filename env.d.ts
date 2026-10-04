/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    /** Meta (Facebook/Instagram) Pixel ID — enables tracking when set. */
    PUBLIC_META_PIXEL_ID?: string;
    PUBLIC_GA4_ID?: string;
    PUBLIC_TIKTOK_PIXEL_ID?: string;
    PUBLIC_CLARITY_ID?: string;
    PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
    PUBLIC_META_DOMAIN_VERIFICATION?: string;
    /** Public site URL once the domain is attached, e.g. https://hamzaking.ma (canonicals, sitemap, schema). Defaults to the request origin. */
    PUBLIC_SITE_URL?: string;
    /** Dev Dashboard app (client credentials grant) used server-side to save reviews and check orders. Scopes: write_metaobjects, read_metaobjects, read_orders, read_products. */
    PRIVATE_ADMIN_CLIENT_ID?: string;
    PRIVATE_ADMIN_CLIENT_SECRET?: string;
  }
}
