import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    // Analytics & ads: GA4, Meta Pixel, TikTok Pixel, Microsoft Clarity.
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://connect.facebook.net',
      'https://www.googletagmanager.com',
      'https://analytics.tiktok.com',
      'https://*.clarity.ms',
      'https://widget.trustpilot.com',
    ],
    // Trustpilot TrustBox (reviews widget).
    frameSrc: ["'self'", 'https://widget.trustpilot.com'],
    imgSrc: [
      "'self'",
      'data:',
      'https://cdn.shopify.com',
      'https://www.facebook.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://*.google-analytics.com',
      'https://analytics.tiktok.com',
      'https://*.clarity.ms',
      'https://c.bing.com',
      'https://*.trustpilot.com',
    ],
    connectSrc: [
      "'self'",
      'https://monorail-edge.shopifysvc.com',
      'https://www.facebook.com',
      'https://connect.facebook.net',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://analytics.tiktok.com',
      'https://*.tiktokw.us',
      'https://*.clarity.ms',
      'https://widget.trustpilot.com',
    ],
    mediaSrc: ["'self'", 'https://cdn.shopify.com'],
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
