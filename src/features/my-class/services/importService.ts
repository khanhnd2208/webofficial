import { previewCurriculum, importCurriculum } from '../imports/curriculum';
import { importQuestionCsv, previewQuestionCsv, QUESTION_CSV_TEMPLATE } from '../imports/questions';
import { importTestQuestionCsv, previewTestQuestionCsv } from '../imports/testQuestions';
import type { CurriculumImportInput } from '../schemas';

export async function previewCurriculumImport(input: CurriculumImportInput) {
	return previewCurriculum(input);
}

export async function commitCurriculumImport(input: CurriculumImportInput) {
	return importCurriculum(input);
}

export async function previewQuestionsImport(csv: string) {
	return previewQuestionCsv(csv);
}

export async function commitQuestionsImport(csv: string) {
	return importQuestionCsv(csv);
}

export async function previewTestQuestionsImport(testId: string, csv: string) {
	return previewTestQuestionCsv(testId, csv);
}

export async function commitTestQuestionsImport(
	testId: string,
	csv: string,
	strategy: 'append' | 'replace' = 'append',
) {
	return importTestQuestionCsv(testId, csv, strategy);
}

export { QUESTION_CSV_TEMPLATE };
