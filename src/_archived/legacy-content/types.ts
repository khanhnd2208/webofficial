/** Shared publish/content types for marketing surfaces (static typed content). */

export type PublishState = 'draft' | 'published';

export type ProcessStep = {
	title: string;
	description: string;
};

export type ServiceFormat = {
	name: string;
	description: string;
};

export type ServiceContext = {
	id: string;
	title: string;
	summary: string;
};

export type FAQItem = {
	question: string;
	answer: string;
};

export type ServiceInquiryType =
	| 'training'
	| 'learning-design'
	| 'people-organization'
	| 'mentoring'
	| 'business'
	| 'ai';

export type Service = {
	slug: string;
	title: string;
	shortTitle: string;
	/** In-page anchor on /gioi-thieu */
	anchorId: string;
	summary: string;
	audience: string[];
	problems: string[];
	notFor: string[];
	outcomes: string[];
	deliverables: string[];
	process: ProcessStep[];
	formats: ServiceFormat[];
	/** Optional nested contexts (e.g. mentoring vs business advisory). */
	contexts: ServiceContext[];
	pricingNote: string;
	faq: FAQItem[];
	relatedCaseSlugs: string[];
	relatedArticleSlugs: string[];
	inquiryType: ServiceInquiryType;
	status: PublishState;
};

export type CaseStudy = {
	slug: string;
	title: string;
	isAnonymous: boolean;
	clientName?: string;
	context: string;
	challenge: string;
	approach: string[];
	deliverables: string[];
	outcomes: string[];
	relatedServices: string[];
	permissionStatus: 'pending' | 'approved' | 'anonymous';
	status: PublishState;
};

export type Testimonial = {
	id: string;
	quote: string;
	personName?: string;
	role?: string;
	organization?: string;
	relatedService: string;
	permissionStatus: 'pending' | 'approved';
	visibility: 'public' | 'anonymous';
};

export type Resource = {
	slug: string;
	title: string;
	summary: string;
	type: 'boardgame' | 'tool' | 'template' | 'guide' | 'experiment';
	audience: string[];
	productStatus: 'concept' | 'prototype' | 'beta' | 'stable' | 'archived';
	access: 'public' | 'login' | 'invite';
	instructions?: string;
	privacyNote?: string;
	updatedAt: string;
	status: PublishState;
	href?: string;
};

export type AudienceGatewayItem = {
	id: string;
	title: string;
	description: string;
	href: string;
	cta: string;
};

export type PolicyPage = {
	slug: string;
	title: string;
	summary: string;
	sections: { heading: string; body: string[] }[];
	status: PublishState;
	legalReview: 'pending' | 'approved';
	updatedAt: string;
};

/** Verified milestones only — empty until owner confirms. */
export type Milestone = {
	id: string;
	label: string;
	detail: string;
	verified: boolean;
};
