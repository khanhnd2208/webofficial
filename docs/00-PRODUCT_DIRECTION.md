# Product direction

## Public purpose

**Duy Khánh** is a focused personal portfolio for management education,
learning design, applied AI, and context-aware business advisory. A first-time visitor should
be able to understand who Khánh is, what he does, what he has built, how he can
help, and how to start a conversation.

The central promise is: **turn complex management and AI knowledge into
capability, programs, and processes people can actually use.**

## Public information architecture

1. **Trang chủ** — `/`
2. **Giới thiệu** — `/gioi-thieu`
3. **Dự án** — `/du-an`
4. **Chi tiết dự án** — `/du-an/[slug]`
5. **Dịch vụ** — `/dich-vu`
6. **Liên hệ** — `/lien-he`

Policies remain readable where required by the contact form. Retired blog,
podcast, lab, service, case-study, and archive pages redirect into the new
portfolio instead of remaining separate public destinations.

## Internal boundary

- Admin, API, auth, databases, courses, vocabulary, messages, and learner data
  remain operational.
- Internal surfaces are excluded from public navigation, sitemap, and public
  footer.
- Archived public UI lives under `src/_archived` and is excluded by TypeScript.

## Product principles

- Understand the problem before proposing a tool.
- Use research without making the language unnecessarily academic.
- Publish only claims and outcomes that can be verified.
- Route visitors by what they want to achieve before introducing service names.
- Keep scope, deliverables, outcomes, and verified impact semantically distinct.
- Keep the public experience light-only, responsive, quiet, and editorial.
- Do not add login, account, blog, podcast, dark-mode, or decorative icon
  controls to the public navigation.
