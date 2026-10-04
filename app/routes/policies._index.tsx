import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/policies._index';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';
import {BUILTIN_POLICIES, frTitle} from '~/lib/policies';

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const b = BUILTIN_POLICIES;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.shippingPolicy ?? b.shippingPolicy,
    shopPolicies?.refundPolicy ?? b.refundPolicy,
    shopPolicies?.termsOfService ?? b.termsOfService,
    shopPolicies?.privacyPolicy,
    shopPolicies?.subscriptionPolicy,
  ]
    .filter((policy): policy is PolicyItemFragment => policy != null)
    .map(frTitle);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <div className="policies container">
      <header className="page-head page-head--tight">
        <p className="eyebrow">Informations légales</p>
        <h1 className="display-l">Nos conditions.</h1>
      </header>
      <div>
        {policies.map((policy) => (
          <fieldset key={policy.id}>
            <Link to={`/policies/${policy.handle}`}>{policy.title}</Link>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
