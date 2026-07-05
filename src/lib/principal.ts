/**
 * A Principal is whoever is making a request. This is the spine of tenant
 * isolation — NFR #1.
 *
 *  - A `member` is a staff user, scoped to one organisation.
 *  - A `contact` is a client user, scoped to one organisation AND one customer.
 *
 * Every data access must be checked against the acting principal via the
 * assertions below. A cross-tenant leak is company-ending, so we make the
 * checks explicit and centralised rather than scattering `where` clauses.
 */

export type MemberPrincipal = {
  kind: "member";
  memberId: string;
  organisationId: string;
  role: "owner" | "member";
};

export type ContactPrincipal = {
  kind: "contact";
  contactId: string;
  organisationId: string;
  customerId: string;
};

export type Principal = MemberPrincipal | ContactPrincipal;

/** Thrown when a principal attempts to touch data outside its scope. */
export class TenantAccessError extends Error {
  constructor(message = "Resource is outside the caller's tenant scope") {
    super(message);
    this.name = "TenantAccessError";
  }
}

/** Anything that carries a tenant fingerprint. */
type OrgScoped = { organisationId: string };
type CustomerScoped = OrgScoped & { customerId: string };

/**
 * Assert that `resource` belongs to the principal's organisation, and — for
 * contacts — to the principal's customer. Returns the resource narrowed, or
 * throws. Use this at the boundary of every read/write.
 */
export function assertCanAccess<T extends OrgScoped>(principal: Principal, resource: T): T {
  if (resource.organisationId !== principal.organisationId) {
    throw new TenantAccessError();
  }
  if (principal.kind === "contact") {
    const customerId = (resource as Partial<CustomerScoped>).customerId;
    // A contact may only touch resources tied to their own customer. Resources
    // with no customer dimension (org-level) are never contact-accessible.
    if (customerId === undefined || customerId !== principal.customerId) {
      throw new TenantAccessError();
    }
  }
  return resource;
}

/** Only owners may manage billing and members. */
export function assertIsOwner(principal: Principal): MemberPrincipal {
  if (principal.kind !== "member" || principal.role !== "owner") {
    throw new TenantAccessError("Owner role required");
  }
  return principal;
}

/** Only staff (members) may act on the firm side. */
export function assertIsMember(principal: Principal): MemberPrincipal {
  if (principal.kind !== "member") {
    throw new TenantAccessError("Staff access required");
  }
  return principal;
}
