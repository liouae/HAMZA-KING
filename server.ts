import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    // Temporary runtime diagnostics for Oxygen. Exposes no secrets.
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname === '/__health') {
      const report: Record<string, unknown> = {
        ok: false,
        host: requestUrl.hostname,
        storeDomain: env.PUBLIC_STORE_DOMAIN || null,
        checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN || null,
        hasStorefrontToken: Boolean(env.PUBLIC_STOREFRONT_API_TOKEN),
        hasStorefrontId: Boolean(env.PUBLIC_STOREFRONT_ID),
        hasCustomerAccountClientId: Boolean(env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID),
        hasSessionSecret: Boolean(env.SESSION_SECRET),
      };
      try {
        const diagnosticContext = await createHydrogenRouterContext(
          request,
          env,
          executionContext,
        );
        const result = await diagnosticContext.storefront.query(
          `#graphql
            query RuntimeHealth($country: CountryCode, $language: LanguageCode)
            @inContext(country: $country, language: $language) {
              shop { name }
            }
          `,
          {cache: diagnosticContext.storefront.CacheNone()},
        );
        report.ok = true;
        report.shop = result.shop?.name ?? null;
      } catch (error) {
        report.error =
          error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      }
      return Response.json(report, {status: report.ok ? 200 : 500});
    }

    // www → apex, one address for Google and customers.
    const incoming = requestUrl;
    if (incoming.hostname === 'www.hamzaking.com') {
      incoming.hostname = 'hamzaking.com';
      incoming.protocol = 'https:';
      return Response.redirect(incoming.toString(), 301);
    }
    try {
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      /**
       * Create a Hydrogen request handler that internally
       * delegates to React Router for routing and rendering.
       */
      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
