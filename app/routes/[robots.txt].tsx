import type {Route} from './+types/[robots.txt]';
import {resolveSiteUrl} from '~/lib/seo';

export function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const canonical = resolveSiteUrl(request, context.env);
  // Any host other than the canonical domain (e.g. the *.myshopify.dev
  // preview once the domain is attached) must stay out of Google.
  if (new URL(canonical).host !== url.host) {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: {'Content-Type': 'text/plain'},
    });
  }
  const body = robotsTxtData({url: canonical});

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',

      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

function robotsTxtData({url}: {url?: string}) {
  const sitemapUrl = url ? `${url}/sitemap.xml` : undefined;

  return `
User-agent: *
${generalDisallowRules({sitemapUrl})}

# Google adsbot ignores robots.txt unless specifically named!
User-agent: adsbot-google
Disallow: /cart
Disallow: /account
Disallow: /search
Allow: /search/
Disallow: /search/?*

User-agent: Nutch
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10
${generalDisallowRules({sitemapUrl})}

User-agent: AhrefsSiteAudit
Crawl-delay: 10
${generalDisallowRules({sitemapUrl})}

User-agent: MJ12bot
Crawl-Delay: 10

User-agent: Pinterest
Crawl-delay: 1
`.trim();
}

/**
 * This function generates disallow rules that generally follow what Shopify's
 * Online Store has as defaults for their robots.txt
 */
function generalDisallowRules({sitemapUrl}: {sitemapUrl?: string}) {
  return `Disallow: /cart
Disallow: /account
Disallow: /collections/*sort_by*
Disallow: /*/collections/*sort_by*
Disallow: /collections/*+*
Disallow: /collections/*%2B*
Disallow: /collections/*%2b*
Disallow: /*/collections/*+*
Disallow: /*/collections/*%2B*
Disallow: /*/collections/*%2b*
Disallow: /*/collections/*filter*&*filter*
Disallow: /blogs/*+*
Disallow: /blogs/*%2B*
Disallow: /blogs/*%2b*
Disallow: /*/blogs/*+*
Disallow: /*/blogs/*%2B*
Disallow: /*/blogs/*%2b*
Disallow: /policies/
Disallow: /search
Disallow: /suivi
Disallow: /*?*filter=
Disallow: /*?*sort=
Disallow: /*?*cursor=
Disallow: /*?*direction=
Disallow: /*?*price.min=
Disallow: /*?*price.max=
${sitemapUrl ? `Sitemap: ${sitemapUrl}` : ''}`;
}
