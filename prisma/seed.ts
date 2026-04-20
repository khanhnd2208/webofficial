/* ════════════════════════════════════════════════════════════════════════
   prisma/seed.ts — Seed database with test data
   Run: npx tsx prisma/seed.ts
   ════════════════════════════════════════════════════════════════════════ */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/teaching_platform_vocab';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_MONGO_ID = 'seed-admin-000000000001';
const USER_MONGO_ID  = 'seed-user-000000000001';

// ─── Guess Who seed set ───────────────────────────────────────────────────────
const GUESS_WHO_SET = {
	title: '🎮 Guess Who I Am — 20 Classic Words',
	description: 'Bộ từ mẫu đầy đủ gợi ý Guess Who (hard / medium / easy). Dùng để demo & kiểm thử tính năng trò chơi.',
	words: [
		{
			term: 'metamorphosis',
			definition: 'a transformation from one form to another, especially in biology',
			partOfSpeech: 'noun',
			example: 'The caterpillar undergoes metamorphosis to become a butterfly.',
			ndkExplanation: 'Từ gốc Hy Lạp "meta" (thay đổi) + "morphe" (hình dạng). Dùng rộng cả nghĩa bóng: sự biến đổi tính cách.',
			hintsHard: [
				'I am the bridge between two radically different states of being',
				'Kafka wrote a novella named after me — but his protagonist changed in a single night',
				'I involve complete reorganisation of body tissues at the cellular level',
			],
			hintsMedium: [
				'I describe what happens inside a chrysalis',
				'Biologists classify me as either complete or incomplete',
				'I am the process that turns a tadpole into a frog',
			],
			hintsEasy: [
				'I am the transformation a caterpillar goes through to become a butterfly',
				'I am a noun that means a dramatic change in form or nature',
				'I have 13 letters and start with the prefix "meta"',
			],
		},
		{
			term: 'photosynthesis',
			definition: 'the process by which plants use sunlight, water, and CO₂ to produce oxygen and energy',
			partOfSpeech: 'noun',
			example: 'Photosynthesis is the foundation of almost all food chains on Earth.',
			ndkExplanation: '"Photo" = ánh sáng, "synthesis" = tổng hợp. Đây là lý do lá cây có màu xanh — diệp lục hấp thụ ánh sáng đỏ và xanh lam.',
			hintsHard: [
				'I am the reason animals can breathe on this planet',
				'My light-dependent and light-independent reactions happen in different parts of the same organelle',
				'I produce a 3-carbon molecule called G3P as my immediate sugar output',
			],
			hintsMedium: [
				'I take place in the chloroplasts of plant cells',
				'I convert carbon dioxide and water into glucose using light energy',
				'My by-product is the oxygen we breathe',
			],
			hintsEasy: [
				'I am the food-making process of plants',
				'Plants need sunlight, water, and CO₂ to do me',
				'I am a long noun that starts with "photo" meaning light',
			],
		},
		{
			term: 'democracy',
			definition: 'a system of government in which power is vested in the people',
			partOfSpeech: 'noun',
			example: 'Athens is often considered the birthplace of democracy.',
			ndkExplanation: '"Demos" = nhân dân, "kratos" = quyền lực. Dân chủ trực tiếp vs đại diện là hai biến thể chính.',
			hintsHard: [
				'Plato was sceptical of me, fearing mob rule would lead to tyranny',
				'I was practised in Athens around 508 BC but excluded women and slaves',
				'Winston Churchill called me "the worst form of government, except all the others"',
			],
			hintsMedium: [
				'I am a system where citizens vote to elect their leaders',
				'The word "demo" in my name means "people" in Greek',
				'The opposite of me is dictatorship or autocracy',
			],
			hintsEasy: [
				'I am the form of government used in most Western countries',
				'In me, every citizen has the right to vote',
				'I am a noun meaning "rule by the people"',
			],
		},
		{
			term: 'gravity',
			definition: 'the natural force that attracts objects toward each other, especially toward the Earth',
			partOfSpeech: 'noun',
			example: 'Newton formulated the law of gravity after observing a falling apple.',
			ndkExplanation: 'Không chỉ là lực kéo xuống — Einstein mô tả tôi là sự cong của không-thời gian. Cũng có nghĩa bóng: tầm quan trọng nghiêm túc.',
			hintsHard: [
				'Einstein redefined me as the curvature of spacetime caused by mass',
				'On the Moon I am about one-sixth of what I am on Earth',
				'My formula is F = Gm₁m₂/r²',
			],
			hintsMedium: [
				'I keep the Moon in orbit around the Earth',
				'Without me, you would float off the ground',
				'I am the force that causes objects to fall when dropped',
			],
			hintsEasy: [
				'I am the force that pulls things toward the ground',
				'Newton discovered me when he saw an apple fall from a tree',
				'I am what gives you weight',
			],
		},
		{
			term: 'camouflage',
			definition: 'the use of colour or pattern to blend into the surrounding environment',
			partOfSpeech: 'noun',
			example: 'The chameleon uses camouflage to hide from predators.',
			ndkExplanation: 'Từ tiếng Pháp "camoufler" = che giấu. Dùng cả trong quân sự và sinh học. Khác với "mimicry" (bắt chước loài khác).',
			hintsHard: [
				'I am nature\'s answer to the arms race between predator and prey',
				'Cuttlefish can perform me using chromatophores in under two seconds',
				'In WWI, artists called "camofleurs" were hired by the French army to do me to ships',
			],
			hintsMedium: [
				'Military uniforms often use me to help soldiers blend into their surroundings',
				'A chameleon changing colour is a famous example of me',
				'I am a strategy used by both predators and prey in nature',
			],
			hintsEasy: [
				'I help animals hide by matching their background',
				'Soldiers wear special patterned clothing that uses me',
				'I am the art of disguising something to make it hard to see',
			],
		},
		{
			term: 'symphony',
			definition: 'an elaborate musical composition for full orchestra, typically in four movements',
			partOfSpeech: 'noun',
			example: 'Beethoven\'s Fifth Symphony is one of the most recognisable pieces in classical music.',
			ndkExplanation: '"Sym" = cùng nhau, "phone" = âm thanh. Thường có 4 chương (movements). Khác với "concerto" (có nhạc cụ độc tấu).',
			hintsHard: [
				'My standard four-movement structure was largely established by Haydn',
				'Beethoven broke convention by adding a choir to his Ninth, making it unique in the canon',
				'I derive from the Greek words meaning "sounding together"',
			],
			hintsMedium: [
				'I am performed by a full orchestra, typically with strings, brass, woodwind and percussion',
				'Famous composers like Mozart, Brahms and Tchaikovsky each wrote dozens of me',
				'I typically consist of four movements varying in tempo',
			],
			hintsEasy: [
				'I am a long, formal piece of music performed by an orchestra',
				'Beethoven wrote nine of me, the most famous being his Fifth and Ninth',
				'I am a musical noun that starts with "sym"',
			],
		},
		{
			term: 'vaccine',
			definition: 'a biological preparation that provides immunity against a specific disease',
			partOfSpeech: 'noun',
			example: 'The COVID-19 vaccine was developed in record time using mRNA technology.',
			ndkExplanation: 'Từ gốc Latin "vacca" = con bò — Jenner dùng virus đậu bò để tạo miễn dịch với đậu mùa. mRNA vaccine là công nghệ thế hệ mới.',
			hintsHard: [
				'Edward Jenner created the first version of me in 1796 using cowpox material',
				'My name literally comes from the Latin word for cow',
				'I can be live-attenuated, inactivated, subunit, or mRNA-based',
			],
			hintsMedium: [
				'I teach your immune system to recognise a pathogen without causing the disease',
				'Many childhood diseases like polio and measles are controlled through me',
				'I usually come as an injection or, sometimes, as an oral dose',
			],
			hintsEasy: [
				'Doctors give me to prevent diseases like flu, COVID-19, and measles',
				'I am the shot you get to protect yourself from getting sick',
				'I am a noun that starts with "vac" and helps build immunity',
			],
		},
		{
			term: 'telescope',
			definition: 'an optical instrument for observing distant objects, especially in astronomy',
			partOfSpeech: 'noun',
			example: 'Galileo used a telescope to observe the moons of Jupiter.',
			ndkExplanation: '"Tele" = xa, "scope" = nhìn. Có hai loại chính: khúc xạ (kính) và phản xạ (gương). Hubble là kính thiên văn vũ trụ nổi tiếng nhất.',
			hintsHard: [
				'I was first used for astronomy by Galileo in 1609, though I was not invented by him',
				'The James Webb version of me uses infrared to see 13.6 billion light-years away',
				'A reflecting version of me uses a concave mirror rather than a lens as the primary collector',
			],
			hintsMedium: [
				'Galileo used me to discover that Jupiter has moons',
				'Astronomers use me to study stars, galaxies, and nebulae',
				'I make faraway objects appear much closer and larger',
			],
			hintsEasy: [
				'I am the instrument astronomers point at the night sky',
				'I make distant stars and planets look bigger',
				'I am a long tube-shaped device starting with "tele"',
			],
		},
		{
			term: 'parliament',
			definition: 'the highest legislative body in a country, responsible for making laws',
			partOfSpeech: 'noun',
			example: 'The UK Parliament consists of the House of Commons and the House of Lords.',
			ndkExplanation: 'Từ tiếng Pháp cũ "parlement" = nơi nói chuyện. Nghị viện Anh là một trong những nghị viện lâu đời nhất thế giới.',
			hintsHard: [
				'The Magna Carta of 1215 was a precursor to my creation in England',
				'My name derives from the Old French word "parler" meaning to speak',
				'In Westminster-style systems, the executive is drawn from within me',
			],
			hintsMedium: [
				'I am the elected body that debates and passes laws in many countries',
				'The UK version of me sits in the Palace of Westminster',
				'I am often divided into two chambers: upper and lower houses',
			],
			hintsEasy: [
				'I am the group of elected politicians who make the laws of a country',
				'The UK has one of the most famous versions of me',
				'I am a noun for a country\'s main law-making body',
			],
		},
		{
			term: 'evolution',
			definition: 'the process by which species change over successive generations through natural selection',
			partOfSpeech: 'noun',
			example: 'Darwin\'s theory of evolution changed how we understand life on Earth.',
			ndkExplanation: 'Darwin đề xuất "chọn lọc tự nhiên" làm cơ chế của tôi. Không có mục tiêu hay hướng đi — chỉ là sự sống sót của cá thể phù hợp nhất.',
			hintsHard: [
				'I was independently conceived by both Darwin and Alfred Russel Wallace around the same time',
				'My mechanism of natural selection requires heritable variation and differential reproductive success',
				'Horizontal gene transfer means I can also occur without reproduction in prokaryotes',
			],
			hintsMedium: [
				'Darwin\'s book "On the Origin of Species" introduced my modern scientific theory',
				'I explain why humans and chimpanzees share about 98% of their DNA',
				'I work through mutations, natural selection, genetic drift, and gene flow',
			],
			hintsEasy: [
				'I am the theory that species change and develop over millions of years',
				'Darwin is the scientist most associated with me',
				'I explain how humans developed from earlier ape-like ancestors',
			],
		},
		{
			term: 'epidemic',
			definition: 'a widespread occurrence of an infectious disease in a community at a particular time',
			partOfSpeech: 'noun',
			example: 'The 1918 influenza epidemic killed millions of people worldwide.',
			ndkExplanation: '"Epi" = trên, "demos" = dân. Khi lan ra toàn cầu thì gọi là "pandemic". Dịch địa phương nhỏ hơn gọi là "endemic".',
			hintsHard: [
				'The WHO classifies me by R₀ — the basic reproduction number — exceeding 1.0 in a susceptible population',
				'John Snow traced the 1854 Broad Street version of me to a contaminated water pump',
				'I differ from a pandemic by geographic scope: I am confined to a region or country',
			],
			hintsMedium: [
				'When an epidemic spreads to many countries, it is upgraded to a pandemic',
				'Public health officials try to control me by tracing contacts and issuing quarantines',
				'The Black Death of the 14th century started as an epidemic before becoming a pandemic',
			],
			hintsEasy: [
				'I am what happens when a disease spreads rapidly through a large population',
				'COVID-19 started as an epidemic before being declared a pandemic',
				'I am a noun for a sudden outbreak of disease affecting many people',
			],
		},
		{
			term: 'propaganda',
			definition: 'biased or misleading information used to promote a political cause or point of view',
			partOfSpeech: 'noun',
			example: 'Wartime propaganda posters were designed to boost public morale.',
			ndkExplanation: 'Ban đầu là thuật ngữ Công giáo ("Congregatio de Propaganda Fide"). Nghĩa tiêu cực hiện đại bắt đầu từ WWI. Khác với "advertising" — tôi thường liên quan đến chính trị.',
			hintsHard: [
				'My modern negative connotation largely emerged from its use in World War I by the British War Propaganda Bureau',
				'Edward Bernays, a nephew of Freud, pioneered the science of using me in peacetime commercial contexts',
				'Goebbels systematised me for the Nazi regime through control of all German media channels',
			],
			hintsMedium: [
				'Authoritarian governments use me to control what their citizens believe',
				'Posters, films, and newspapers have all been used as tools to spread me',
				'I am often one-sided and designed to manipulate emotions rather than inform',
			],
			hintsEasy: [
				'I am false or misleading information spread to influence people\'s opinions',
				'Governments in wartime often use me to make their side look good',
				'I am a noun starting with "pro" that refers to biased political messaging',
			],
		},
		{
			term: 'quarantine',
			definition: 'a state of isolation imposed to prevent the spread of disease',
			partOfSpeech: 'noun',
			example: 'Passengers arriving from infected regions were placed in quarantine.',
			ndkExplanation: 'Từ tiếng Ý "quarantina" = 40 ngày (thời gian tàu phải chờ ở Venice thế kỷ 14 để chống dịch hạch). COVID-19 đã phổ biến từ này toàn cầu.',
			hintsHard: [
				'My name comes from the Venetian practice of holding ships for 40 days — "quaranta giorni" — during the Black Death',
				'I am legally distinct from isolation: I apply to exposed but asymptomatic people, not confirmed cases',
				'The first systematic application of me in the USA was at Angel Island Immigration Station in 1891',
			],
			hintsMedium: [
				'I am used to stop the spread of contagious diseases by separating exposed people',
				'During COVID-19, millions of people were placed in me after international travel',
				'My name comes from an Italian word meaning "forty days"',
			],
			hintsEasy: [
				'I am the period of isolation you undergo when you may have been exposed to a disease',
				'During COVID-19, many people had to stay at home in me for 14 days',
				'I am a noun meaning enforced separation to prevent disease spreading',
			],
		},
		{
			term: 'bankruptcy',
			definition: 'the legal state of being unable to repay debts owed to creditors',
			partOfSpeech: 'noun',
			example: 'The company filed for bankruptcy after failing to secure new investment.',
			ndkExplanation: 'Từ tiếng Ý "banca rotta" = cái bàn bị gãy (bàn của người đổi tiền bị phá vỡ khi họ vỡ nợ). Chapter 7 vs Chapter 11 là hai dạng phổ biến ở Mỹ.',
			hintsHard: [
				'My etymology comes from the Italian "banca rotta" — the broken bench of insolvent medieval money-changers',
				'Chapter 11 of the US code allows a business version of me while continuing to operate',
				'I differ from insolvency in that I am a legal status declared by a court, not merely a financial condition',
			],
			hintsMedium: [
				'Companies or individuals who cannot pay their debts may declare me',
				'Declaring me can wipe out certain debts but damages your credit rating for years',
				'Lehman Brothers declared me in 2008 in what became the largest filing in US history',
			],
			hintsEasy: [
				'I am what happens when a person or company cannot pay back the money they owe',
				'A business "files for" me when it runs out of money to pay its debts',
				'I am a noun starting with "bank" that describes financial ruin',
			],
		},
		{
			term: 'phenomenon',
			definition: 'a fact or situation that is observed to exist or happen, especially one whose cause is in question',
			partOfSpeech: 'noun',
			example: 'The aurora borealis is a stunning natural phenomenon.',
			ndkExplanation: 'Số nhiều là "phenomena" (không phải "phenomenons"). Trong triết học Kant, tôi là thứ có thể quan sát được — đối lập với "noumenon" (bản thể).',
			hintsHard: [
				'Kant distinguished me from the "noumenon" — the thing-in-itself that lies beyond all possible experience',
				'The plural of me is "phenomena", a Greek neuter plural often incorrectly used as singular',
				'In physics, quantum entanglement is an example of a non-local version of me that defies classical explanation',
			],
			hintsMedium: [
				'Scientists observe and try to explain me — lightning, rainbows and earthquakes are all examples',
				'In philosophy, I refer to anything that can be perceived by the senses',
				'My plural form is "phenomena" — not "phenomenons"',
			],
			hintsEasy: [
				'I am an observable event or fact, especially one that is unusual or hard to explain',
				'A rainbow, an earthquake, or a solar eclipse are all examples of me',
				'My plural form is "phenomena" and I start with "phe"',
			],
		},
		{
			term: 'sarcasm',
			definition: 'the use of irony to mock or convey contempt, often saying the opposite of what is meant',
			partOfSpeech: 'noun',
			example: '"Oh great, another Monday," she said with heavy sarcasm.',
			ndkExplanation: '"Sarkazein" tiếng Hy Lạp = cắn thịt (châm biếm sắc bén). Khác với "irony" (rộng hơn) và "satire" (phê bình xã hội mang tính nghệ thuật).',
			hintsHard: [
				'My etymology derives from the Greek "sarkazein" meaning to tear flesh',
				'Research suggests I is harder to detect in written text than in speech because tonal cues are lost',
				'I am a form of verbal irony, but not all irony is me — I specifically involve mockery or contempt',
			],
			hintsMedium: [
				'I am often used to mock someone by saying the opposite of what you mean',
				'The TV show "The Office" and Sheldon Cooper from "The Big Bang Theory" are famous for using me',
				'Writers use me as a tool of wit and humour in dialogue',
			],
			hintsEasy: [
				'I am when you say something but mean the exact opposite, usually to mock someone',
				'"Oh, brilliant idea," said sarcastically, is an example of me',
				'I am a noun for a type of cutting, mocking humour',
			],
		},
		{
			term: 'prototype',
			definition: 'the first or preliminary version of a product from which other forms are developed',
			partOfSpeech: 'noun',
			example: 'Engineers built a prototype of the car to test its aerodynamics.',
			ndkExplanation: '"Proto" = đầu tiên, "typos" = dạng/kiểu. Trong UX/design, prototype có thể là wireframe thấp độ trung thực đến mô hình tương tác cao.',
			hintsHard: [
				'In Jungian psychology, I am an inherited pattern of thought present in the unconscious — distinct from the product-design meaning',
				'In software engineering, "rapid me" is a development strategy that prioritises early user feedback over specification completeness',
				'The International Prototype of the Kilogram was a physical version of me kept in Sèvres, France until 2019',
			],
			hintsMedium: [
				'Designers build me before mass production to test whether the design works',
				'In app development, a clickable wireframe is often called a me',
				'The word combines "proto" (first) and "type" (model or form)',
			],
			hintsEasy: [
				'I am the first working model of something built before the final product',
				'Car designers build me to test new features before making the real car',
				'I am a noun meaning "early model" and starts with "proto"',
			],
		},
		{
			term: 'inflation',
			definition: 'the rate at which the general level of prices for goods and services rises over time',
			partOfSpeech: 'noun',
			example: 'High inflation means your money buys less than it did last year.',
			ndkExplanation: 'Đừng nhầm với "deflation" (giá giảm) hay "stagflation" (giá tăng + tăng trưởng đình trệ). Ngân hàng trung ương thường nhắm mục tiêu 2% mỗi năm.',
			hintsHard: [
				'Hyperinflation in Weimar Germany in 1923 saw prices double every 3 to 4 days at its peak',
				'Central banks use interest rate policy as the primary tool to control me',
				'The Fisher Equation (MV = PQ) describes my relationship to money supply',
			],
			hintsMedium: [
				'When I am high, the purchasing power of money decreases',
				'Central banks like the US Federal Reserve try to keep me at around 2% per year',
				'Opposite of me is deflation, when prices fall',
			],
			hintsEasy: [
				'I am the reason prices go up over time and your money buys less',
				'When I am high, a coffee that cost 2 dollars last year might cost 3 dollars this year',
				'I am a noun for rising prices in an economy',
			],
		},
		{
			term: 'hibernation',
			definition: 'a state of inactivity and metabolic depression in animals during winter',
			partOfSpeech: 'noun',
			example: 'Bears enter hibernation in autumn and emerge in spring.',
			ndkExplanation: '"Hibernus" tiếng Latin = thuộc về mùa đông. Khác với "torpor" (ngủ đông cạn hơn). Trong trạng thái tôi, nhịp tim gấu giảm từ 55 xuống còn 9 nhịp/phút.',
			hintsHard: [
				'During deep versions of me, a bear\'s heart rate drops from roughly 55 beats per minute to just 8',
				'True versions of me involve a drop in core body temperature to near-ambient levels — bears technically undergo "torpor"',
				'Arctic ground squirrels are among the few mammals that experience me with body temperatures dropping below 0°C',
			],
			hintsMedium: [
				'Animals like bears, hedgehogs, and bats undergo me to survive the cold winter months',
				'During me, an animal\'s body temperature, heart rate, and breathing slow dramatically',
				'Animals build up fat reserves in autumn to survive the months of me',
			],
			hintsEasy: [
				'I am the long winter sleep that bears and some other animals have',
				'During me, animals do not eat, drink, or move for weeks or months',
				'I am a noun for the deep winter sleep of animals starting with "hiber"',
			],
		},
		{
			term: 'diplomacy',
			definition: 'the management of international relations by negotiation and dialogue',
			partOfSpeech: 'noun',
			example: 'Skilled diplomacy helped prevent the conflict from escalating into war.',
			ndkExplanation: 'Từ tiếng Pháp "diplomatie", gốc Greek "diploma" = tờ giấy gấp đôi (thư tín chính thức). Còn có nghĩa bóng: cách ứng xử khéo léo, tế nhị.',
			hintsHard: [
				'The Treaty of Westphalia in 1648 is often cited as the founding moment of the modern me-based international system',
				'The Congress of Vienna in 1815 pioneered multilateral me through great-power conferences',
				'Vienna Convention of 1961 codified the rules of me including the concept of diplomatic immunity',
			],
			hintsMedium: [
				'Ambassadors and foreign ministers are the key practitioners of me',
				'I am the preferred alternative to armed conflict between nations',
				'The United Nations was established partly to institutionalise me on a global scale',
			],
			hintsEasy: [
				'I am the art of managing relationships between countries through negotiation',
				'When two countries have a disagreement, they use me to resolve it peacefully',
				'I am a noun for the skill of handling international affairs tactfully',
			],
		},
	],
};

const SETS = [
	{
		title: 'IELTS Essential Vocabulary',
		description: 'High-frequency words for IELTS Academic band 7.0+',
		words: [
			{ term: 'abundant', definition: 'present in large quantities', partOfSpeech: 'adjective', example: 'The region has abundant natural resources.' },
			{ term: 'accumulate', definition: 'gather together or acquire an increasing number of', partOfSpeech: 'verb', example: 'She accumulated a vast collection of books.' },
			{ term: 'adequate', definition: 'satisfactory or acceptable in quality or quantity', partOfSpeech: 'adjective', example: 'The salary is adequate for a fresh graduate.' },
			{ term: 'ambiguous', definition: 'open to more than one interpretation', partOfSpeech: 'adjective', example: 'The question was ambiguous and confused many students.' },
			{ term: 'analyse', definition: 'examine in detail', partOfSpeech: 'verb', example: 'Scientists analyse the data carefully.' },
			{ term: 'approach', definition: 'a way of dealing with something', partOfSpeech: 'noun', example: 'We need a new approach to this problem.' },
			{ term: 'assess', definition: 'evaluate or estimate the nature or quality of', partOfSpeech: 'verb', example: 'The teacher will assess the students\'s progress.' },
{ term: 'assume', definition: 'suppose to be the case without proof', partOfSpeech: 'verb', example: 'Never assume you know the answer.' },
{ term: 'benefit', definition: 'an advantage or profit gained from something', partOfSpeech: 'noun', example: 'Exercise has many benefits for health.' },
{ term: 'category', definition: 'a class or division of things', partOfSpeech: 'noun', example: 'Books are sorted into different categories.' },
],
},
{
title: 'Business English Essentials',
description: 'Key vocabulary for professional communication',
words: [
{ term: 'agenda', definition: 'a list of items to be discussed at a meeting', partOfSpeech: 'noun', example: 'Please review the meeting agenda beforehand.' },
{ term: 'allocate', definition: 'distribute resources or duties for a particular purpose', partOfSpeech: 'verb', example: 'The manager allocated tasks to each team member.' },
{ term: 'benchmark', definition: 'a standard or point of reference against which things may be compared', partOfSpeech: 'noun', example: 'The company set a new benchmark for customer service.' },
{ term: 'collaborate', definition: 'work jointly on an activity or project', partOfSpeech: 'verb', example: 'The teams collaborated to deliver the project on time.' },
{ term: 'deadline', definition: 'the latest time by which something should be completed', partOfSpeech: 'noun', example: 'We must meet the project deadline.' },
{ term: 'delegate', definition: 'entrust a task or responsibility to another person', partOfSpeech: 'verb', example: 'A good manager knows how to delegate effectively.' },
{ term: 'efficient', definition: 'achieving maximum productivity with minimum wasted effort', partOfSpeech: 'adjective', example: 'The new process is far more efficient.' },
{ term: 'facilitate', definition: 'make an action or process easier', partOfSpeech: 'verb', example: 'Technology facilitates remote collaboration.' },
{ term: 'implement', definition: 'put a decision, plan, or agreement into effect', partOfSpeech: 'verb', example: 'We need to implement the new policy immediately.' },
{ term: 'leverage', definition: 'use something to maximum advantage', partOfSpeech: 'verb', example: 'We can leverage social media to reach more customers.' },
],
},
{
title: 'TOEIC Vocabulary: Parts 5 & 6',
description: 'Grammar-focused vocabulary for TOEIC Reading',
words: [
{ term: 'adjacent', definition: 'next to or adjoining something else', partOfSpeech: 'adjective', example: 'The conference room is adjacent to the lobby.' },
{ term: 'approximately', definition: 'used to show that something is almost, but not completely, accurate', partOfSpeech: 'adverb', example: 'The project will take approximately three months.' },
{ term: 'authorize', definition: 'give official permission for or approval to', partOfSpeech: 'verb', example: 'Only the director can authorize such expenditures.' },
{ term: 'available', definition: 'able to be used or obtained', partOfSpeech: 'adjective', example: 'Is the conference room available on Friday?' },
{ term: 'circulate', definition: 'move or cause to move continuously through a closed system', partOfSpeech: 'verb', example: 'Please circulate the memo to all staff.' },
{ term: 'clarify', definition: 'make a statement or situation less confused and more comprehensible', partOfSpeech: 'verb', example: 'Could you clarify your position on this issue?' },
{ term: 'comply', definition: 'act in accordance with a wish or command', partOfSpeech: 'verb', example: 'All employees must comply with the safety regulations.' },
{ term: 'comprehensive', definition: 'including or dealing with all or nearly all aspects of something', partOfSpeech: 'adjective', example: 'She wrote a comprehensive report on the market.' },
{ term: 'consecutive', definition: 'following continuously', partOfSpeech: 'adjective', example: 'Sales grew for five consecutive quarters.' },
{ term: 'coordinate', definition: 'bring the different elements of a complex activity into a harmonious relationship', partOfSpeech: 'verb', example: 'She will coordinate all logistics for the event.' },
],
},
];

async function main() {
	console.log('🌱 Seeding vocab database...');

	// Clean existing seed data
	await prisma.userVocabSet.deleteMany({ where: { userId: { in: [ADMIN_MONGO_ID, USER_MONGO_ID] } } });
	await prisma.vocabSet.deleteMany({ where: { ownerId: ADMIN_MONGO_ID } });

	// Create standard VocabSets (admin-owned)
	const createdSets = [];
	for (const setData of SETS) {
		const set = await prisma.vocabSet.create({
			data: {
				title: setData.title,
				description: setData.description,
				ownerId: ADMIN_MONGO_ID,
				ownerName: 'Admin (Seed)',
				words: { create: setData.words },
			},
			include: { words: true },
		});
		createdSets.push(set);
		console.log(`  ✅ Created set: "${set.title}" (${set.words.length} words)`);
	}

	// Create Guess Who set (admin-owned)
	const guessWhoSet = await prisma.vocabSet.create({
		data: {
			title: GUESS_WHO_SET.title,
			description: GUESS_WHO_SET.description,
			ownerId: ADMIN_MONGO_ID,
			ownerName: 'Admin (Seed)',
			words: { create: GUESS_WHO_SET.words },
		},
		include: { words: true },
	});
	console.log(`  🎮 Created Guess Who set: "${guessWhoSet.title}" (${guessWhoSet.words.length} words)`);

	// Add all sets to test user's library
	for (const set of [...createdSets.slice(0, 2), guessWhoSet]) {
		await prisma.userVocabSet.create({
			data: { userId: USER_MONGO_ID, vocabSetId: set.id, status: 'active' },
		});
		console.log(`  📚 Added "${set.title}" to test user library`);
	}

	// Add Guess Who set to admin library too
	await prisma.userVocabSet.create({
		data: { userId: ADMIN_MONGO_ID, vocabSetId: guessWhoSet.id, status: 'active' },
	});
	console.log(`  📚 Added "${guessWhoSet.title}" to admin library`);

	console.log('\n✅ Seed complete!');
	console.log(`   Admin MongoDB ID  : ${ADMIN_MONGO_ID}`);
	console.log(`   User  MongoDB ID  : ${USER_MONGO_ID}`);
	console.log(`   Standard sets     : ${createdSets.length}`);
	console.log(`   Guess Who set     : 1 (${guessWhoSet.words.length} words, all with hints)`);
}

main()
	.catch((e) => { console.error(e); process.exit(1); })
	.finally(() => prisma.$disconnect());
