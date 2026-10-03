import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer
    ? customer.firstName
      ? `Salam, ${customer.firstName}.`
      : `Bienvenue dans ton espace.`
    : 'Mon compte';

  return (
    <div className="account container">
      <header className="page-head page-head--tight">
        <p className="eyebrow">Mon compte</p>
        <h1 className="display-l">{heading}</h1>
      </header>
      <AccountMenu />
      <div className="account-body">
        <Outlet context={{customer}} />
      </div>
    </div>
  );
}

function AccountMenu() {
  const cls = ({isActive}: {isActive: boolean}) =>
    `account-tab ${isActive ? 'is-active' : ''}`;
  return (
    <nav className="account-nav" aria-label="Compte">
      <NavLink to="/account/orders" className={cls}>
        Commandes
      </NavLink>
      <NavLink to="/account/profile" className={cls}>
        Profil
      </NavLink>
      <NavLink to="/account/addresses" className={cls}>
        Adresses
      </NavLink>
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <button type="submit" className="link-btn">
        Se déconnecter
      </button>
    </Form>
  );
}
