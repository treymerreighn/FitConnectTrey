import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { useLocation } from 'wouter';

interface AppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  asChild?: boolean;
}

export function Link({ href, asChild = false, children, ...props }: React.PropsWithChildren<AppLinkProps>) {
  const [, setLocation] = useLocation();

  const navigate = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setLocation(href);
  };

  if (asChild) {
    // Render Slot so consumer can use Button asChild
    return (
      <Slot onClick={navigate} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <a href={href} onClick={navigate} {...props}>
      {children}
    </a>
  );
}

export default Link;
