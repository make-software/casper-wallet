import React, { PropsWithChildren } from 'react';

import { Link } from '@libs/ui/components';

interface IMaybeLinkProps extends PropsWithChildren {
  link?: string | null;
}

export const MaybeLink: React.FC<IMaybeLinkProps> = ({ link, children }) => {
  return link ? (
    <Link color="contentAction" href={link} target="_blank">
      {children}
    </Link>
  ) : (
    children
  );
};
