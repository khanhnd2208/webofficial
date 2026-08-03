export type PublishState = 'draft' | 'published';

export type PolicyPage = {
	slug: string;
	title: string;
	summary: string;
	sections: { heading: string; body: string[] }[];
	status: PublishState;
	legalReview: 'pending' | 'approved';
	updatedAt: string;
};
