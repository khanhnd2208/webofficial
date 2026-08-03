export type ProofApproval = 'pending' | 'approved' | 'rejected';
export type ProofVerification = 'unverified' | 'verified';

export type PublicTestimonial = {
	id: string;
	quote: string;
	personName?: string;
	role?: string;
	organization?: string;
	anonymous?: boolean;
	relatedService?: string;
	approval: ProofApproval;
	verification: ProofVerification;
};

export type PublicOrganization = {
	id: string;
	name: string;
	logoSrc?: string;
	href?: string;
	approval: ProofApproval;
	verification: ProofVerification;
};

/**
 * Public proof is intentionally empty until the owner supplies verifiable data
 * and confirms publication permission. Never add placeholders to these arrays.
 */
export const publicTestimonials: PublicTestimonial[] = [];
export const publicOrganizations: PublicOrganization[] = [];

export function isPublishableProof<
	T extends { approval: ProofApproval; verification: ProofVerification },
>(item: T): boolean {
	return item.approval === 'approved' && item.verification === 'verified';
}

export function getPublishableTestimonials(): PublicTestimonial[] {
	return publicTestimonials.filter(isPublishableProof);
}

export function getPublishableOrganizations(): PublicOrganization[] {
	return publicOrganizations.filter(isPublishableProof);
}
