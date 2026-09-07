'use client';

type ClassIntroProps = {
 summary: string; description: string; announcement: string;
 links: { id: string; label: string; url: string; description: string }[];
};

export function StudentClassIntro({ summary, description, announcement, links }: ClassIntroProps) {
 if (![summary, description, announcement].some(value => value.trim()) && !links.length) return null;
 return <section className="mc-surface overflow-hidden" aria-label="Thông tin lớp">
  {announcement.trim() ? <div className="border-b border-mc-rule bg-accent-subtle px-4 py-3" role="note">
   <p className="mc-eyebrow">Thông báo</p><p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-ink">{announcement}</p>
  </div> : null}
  {summary.trim() || description.trim() ? <div className="px-4 py-3">
   {summary.trim() ? <p className="break-words text-sm font-medium text-ink">{summary}</p> : null}
   {description.trim() ? <details className="mt-2">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink">Giới thiệu lớp · Xem thêm</summary>
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ink-secondary">{description}</p>
   </details> : null}
  </div> : null}
  {links.length ? <details className="border-t border-mc-rule px-4 py-2">
   <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink">Tài nguyên lớp ({links.length})</summary>
   <ul className="grid gap-2 pb-2 sm:grid-cols-2">{links.map(link => <li key={link.id} className="min-w-0">
    <a href={link.url} target="_blank" rel="noopener noreferrer" className="block min-h-11 break-words rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 text-sm text-ink hover:border-accent">
     <strong className="font-semibold text-accent">{link.label} ↗</strong>
     {link.description ? <span className="mt-1 block text-xs leading-5 text-ink-secondary">{link.description}</span> : null}
    </a>
   </li>)}</ul>
  </details> : null}
 </section>;
}

