import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { isExternalLink } from "../../lib/section";

type SectionLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
};

/** A CMS link can point at a route, an in-page anchor, or another website. */
function SectionLink({ href, className, children, onNavigate }: SectionLinkProps) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  }

  if (isExternalLink(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer" onClick={onNavigate}>
        {children}
      </a>
    );
  }

  return (
    <a href={href || "#"} className={className} onClick={onNavigate}>
      {children}
    </a>
  );
}

export default SectionLink;
