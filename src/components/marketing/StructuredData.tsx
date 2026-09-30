type JsonLd = Record<string, unknown> | Record<string, unknown>[];

type StructuredDataProps = {
	data: JsonLd;
};

/**
 * JSON-LD script renderer for Person, WebSite, Article, Service, FAQ, etc.
 */
export function StructuredData({ data }: StructuredDataProps) {
	return (
		<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
	);
}
