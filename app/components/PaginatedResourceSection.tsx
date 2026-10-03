import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';

/**
 * Grid with "load previous / load more" pagination (cursor based).
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  ariaLabel,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  ariaLabel?: string;
  resourcesClassName?: string;
}) {
  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink}) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );
        return (
          <div className="paginated">
            <PreviousLink className="load-more load-more--prev">
              {isLoading ? 'Chargement…' : 'Afficher les précédents'}
            </PreviousLink>
            {resourcesClassName ? (
              <div
                aria-label={ariaLabel}
                className={resourcesClassName}
                role={ariaLabel ? 'region' : undefined}
              >
                {resourcesMarkup}
              </div>
            ) : (
              resourcesMarkup
            )}
            <NextLink className="load-more">
              {isLoading ? 'Chargement…' : 'Afficher plus'}
            </NextLink>
          </div>
        );
      }}
    </Pagination>
  );
}
