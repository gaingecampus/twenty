// Analyze a completed connector export locally with the same deployed rules.
import { readFile, writeFile } from 'node:fs/promises';
import { analyze } from './detect.ts';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: node analyze-snapshot.mjs input.json output.json');
const snapshot = JSON.parse(await readFile(inputPath, 'utf8'));
if (!Array.isArray(snapshot.records) || snapshot.records.length !== snapshot.expectedCount || snapshot.finalCount !== snapshot.expectedCount) {
  throw new Error('완전한 조회 결과와 최종 총건수 검증이 필요합니다.');
}
const result = analyze(snapshot.records, snapshot.startedAt);
await writeFile(outputPath, JSON.stringify(result), { mode: 0o600 });
const { markdown, ...summary } = result;
console.log(JSON.stringify({ ...summary, reportCharacters: markdown.length }));
