import { encryptStudentPiiField } from '@/features/teaching/domain/studentPiiCrypto';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { prisma } from '@/lib/prisma';

const ENCRYPTED_PREFIX = 'enc:v1:';

export const POST = withAdmin(async () => {
	const students = await prisma.teachingStudent.findMany({
		where: {
			OR: [{ phone: { not: null } }, { email: { not: null } }],
		},
		select: { id: true, phone: true, email: true },
	});

	let updatedCount = 0;
	for (const student of students) {
		const needsPhone =
			student.phone != null &&
			student.phone.trim() !== '' &&
			!student.phone.startsWith(ENCRYPTED_PREFIX);
		const needsEmail =
			student.email != null &&
			student.email.trim() !== '' &&
			!student.email.startsWith(ENCRYPTED_PREFIX);
		if (!needsPhone && !needsEmail) continue;

		await prisma.teachingStudent.update({
			where: { id: student.id },
			data: {
				...(needsPhone ? { phone: encryptStudentPiiField(student.phone) } : {}),
				...(needsEmail ? { email: encryptStudentPiiField(student.email) } : {}),
			},
		});
		updatedCount += 1;
	}

	return apiSuccess({ scannedCount: students.length, encryptedCount: updatedCount });
});
