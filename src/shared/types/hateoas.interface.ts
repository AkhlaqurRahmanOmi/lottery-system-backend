/**
 * HATEOAS (Hypermedia as the Engine of Application State) link structure
 */
export interface HATEOASLink {
  href: string;
  method: string;
  rel: string;
  type?: string;
}

/**
 * Collection of HATEOAS links for API responses
 */
export interface HATEOASLinks {
  self: string;
  related?: {
    [key: string]: HATEOASLink;
  };
  pagination?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

/**
 * HATEOAS link generation context
 */
export interface LinkContext {
  baseUrl: string;
  resourceId?: string | number;
  currentPage?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  queryParams?: Record<string, any>;
  resourceType?: string;
  action?: string;
  resourceState?: Record<string, any>;
}