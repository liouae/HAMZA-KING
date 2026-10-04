/**
 * Built-in policy texts, shown when the policy isn't saved in Shopify
 * (Settings → Policies). A policy saved in Shopify always wins, so the owner
 * can edit there; keep these in sync with what the store really does.
 */
export type BuiltinPolicy = {
  id: string;
  handle: string;
  title: string;
  body: string;
  url: string;
};

const p = (handle: string, title: string, body: string): BuiltinPolicy => ({
  id: `builtin-${handle}`,
  handle,
  title,
  body,
  url: `/policies/${handle}`,
});

export const BUILTIN_POLICIES: Record<string, BuiltinPolicy> = {
  shippingPolicy: p(
    'shipping-policy',
    'Livraison',
    '<p>Dernière mise à jour : 4 octobre 2026</p><h2>Livraison gratuite partout au Maroc</h2><p>La livraison est offerte sur toutes les commandes, sans minimum d’achat, dans toutes les villes du Maroc. Nous ne livrons pas à l’international.</p><h2>Appel de confirmation</h2><p>Après chaque commande (sur le site ou sur WhatsApp), nous t’appelons ou t’écrivons pour confirmer le modèle, la couleur, la pointure, le prix et l’adresse de livraison. Ta commande n’est expédiée qu’après cette confirmation. Si nous n’arrivons pas à te joindre dans les 24 heures, la commande peut être annulée.</p><h2>Délais</h2><ul><li>Casablanca : environ 24h après confirmation.</li><li>Grandes villes : environ 48h.</li><li>Reste du Maroc : 48h à 72h.</li></ul><p>Ces délais sont indicatifs et peuvent varier selon la zone, les jours fériés et le transporteur. Tu reçois le suivi de ta commande dès l’expédition.</p><h2>Paiement à la livraison</h2><p>Le paiement se fait uniquement en espèces, au livreur, à la réception. Tu peux vérifier ta paire avant de payer. Aucun paiement en ligne n’est demandé.</p><h2>Colis refusé ou absent</h2><p>Si tu n’es pas disponible, le livreur te recontacte pour une nouvelle tentative. Merci de ne commander que si tu es sûr(e) de recevoir la paire : les refus répétés sans raison peuvent entraîner le refus de futures commandes.</p><h2>Contact</h2><p>WhatsApp : +212 614-719446 · E-mail : hamza20king00@gmail.com</p>',
  ),
  refundPolicy: p(
    'refund-policy',
    'Retours & échanges',
    '<p>Dernière mise à jour : 4 octobre 2026</p><h2>Vérifie avant de payer</h2><p>Le paiement se fait à la livraison : tu peux ouvrir le colis et vérifier ta paire devant le livreur avant de payer. Si la paire ne correspond pas à ta commande (modèle, couleur ou pointure), tu peux la refuser sans rien payer et nous t’envoyons la bonne.</p><h2>Échange de pointure sous 7 jours</h2><p>Tu as 7 jours après réception pour échanger ta paire contre une autre pointure ou un autre modèle de même prix, si :</p><ul><li>la paire n’a pas été portée à l’extérieur ;</li><li>elle est rendue propre, dans sa boîte d’origine, avec tous ses accessoires ;</li><li>la pointure ou le modèle souhaité est disponible.</li></ul><p>Pour demander un échange, écris-nous sur WhatsApp au +212 614-719446 avec ton nom et ton numéro de commande. Nous organisons la récupération et l’envoi de la nouvelle paire. Si tu choisis un modèle plus cher, tu payes la différence au livreur.</p><h2>Produit défectueux ou erreur de notre part</h2><p>Si ta paire présente un défaut ou si nous nous sommes trompés dans ta commande, contacte-nous sous 7 jours avec des photos : nous l’échangeons sans frais ou, si aucun échange n’est possible, nous te remboursons le montant payé.</p><h2>Remboursement</h2><p>Comme le paiement se fait à la livraison, nous privilégions l’échange. Un remboursement est accordé uniquement en cas de défaut, d’erreur de notre part, ou si l’article échangé n’est plus disponible. Il est effectué par virement ou transfert sous 7 jours après réception de la paire retournée.</p><h2>Non échangeable</h2><ul><li>Paires portées, abîmées ou sans leur boîte d’origine.</li><li>Demandes faites après 7 jours.</li></ul>',
  ),
  termsOfService: p(
    'terms-of-service',
    'Conditions générales',
    '<p>Dernière mise à jour : 4 octobre 2026</p><h2>1. Vendeur</h2><p>Le site et la boutique sont exploités par HAMZA KING, vendeur de sneakers au Maroc. Contact : WhatsApp +212 614-719446 · hamza20king00@gmail.com.</p><h2>2. Commandes</h2><p>Les commandes peuvent être passées sur le site ou sur WhatsApp. Une commande devient ferme après notre appel ou message de confirmation (modèle, couleur, pointure, prix, adresse). Nous pouvons refuser ou annuler une commande en cas de rupture de stock, d’erreur manifeste de prix, d’informations incomplètes ou de refus répétés de colis.</p><h2>3. Prix</h2><p>Les prix sont indiqués en dirhams marocains (DH), toutes taxes applicables comprises. La livraison est gratuite partout au Maroc. Le prix applicable est celui affiché au moment de la commande et confirmé lors de l’appel.</p><h2>4. Paiement</h2><p>Le paiement s’effectue uniquement en espèces, à la livraison, auprès du livreur. Aucun paiement en ligne n’est demandé.</p><h2>5. Livraison</h2><p>Les modalités et délais de livraison sont décrits dans notre politique d’expédition. Les délais sont indicatifs.</p><h2>6. Produits</h2><p>Nous décrivons chaque paire (modèle, couleur, pointures, photos) le plus fidèlement possible. Les couleurs peuvent légèrement varier selon l’écran. En cas de doute sur une paire ou une pointure, contacte-nous sur WhatsApp avant de commander.</p><h2>7. Échanges et remboursements</h2><p>Les conditions sont décrites dans notre politique de retour et d’échange (échange de pointure sous 7 jours).</p><h2>8. Données personnelles</h2><p>Les informations collectées servent à traiter et livrer ta commande et à améliorer nos services, conformément à notre politique de confidentialité. Les outils de mesure d’audience et de publicité ne sont activés qu’après ton accord dans le bandeau cookies.</p><h2>9. Droit applicable</h2><p>Les présentes conditions sont régies par le droit marocain, notamment la loi n° 31-08 édictant des mesures de protection du consommateur. En cas de litige, contacte-nous d’abord : nous cherchons toujours une solution amiable.</p>',
  ),
};
