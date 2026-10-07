import { parseFieldSummarySections } from '@/field-management/parseFieldSummarySections';

it('separates titled paragraphs and preserves line breaks', () => {
  expect(
    parseFieldSummarySections(
      '## 진행 내용\r\n진단 완료.\r\n초안 검토.\r\n\r\n## 다음 과제\r\n지표 공유.',
    ),
  ).toEqual([
    { title: '진행 내용', body: '진단 완료.\n초안 검토.' },
    { title: '다음 과제', body: '지표 공유.' },
  ]);
});

it('preserves plain text and omits empty sections', () => {
  expect(parseFieldSummarySections('기존 요약입니다.')).toEqual([
    { title: '', body: '기존 요약입니다.' },
  ]);
  expect(
    parseFieldSummarySections('## 주요 결정\n\n## 다음 과제\n검토 예정.'),
  ).toEqual([{ title: '다음 과제', body: '검토 예정.' }]);
});
