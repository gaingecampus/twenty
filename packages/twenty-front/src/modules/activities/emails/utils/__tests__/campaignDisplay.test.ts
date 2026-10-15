import {
  campaignBodyToText,
  parseCampaignAttachments,
} from '@/activities/emails/utils/campaignDisplay';

it('preserves readable paragraphs, breaks, entities and personalization', () => {
  expect(
    campaignBodyToText(
      '<p>{{fullName}}님 &amp; 팀</p><p>안녕하세요<br>감사합니다</p>',
    ),
  ).toBe('{{fullName}}님 & 팀\n안녕하세요\n감사합니다');
});
it('does not expose active content or markup', () => {
  expect(
    campaignBodyToText(
      '<script>alert(1)</script><style>body{}</style><p onclick="bad()">본문</p>',
    ),
  ).toBe('본문');
});
it('supports serialized attachment data and ignores malformed entries', () => {
  expect(
    parseCampaignAttachments(
      '[{"id":"1","name":"보고서.pdf"},null,{"name":3}]',
    ),
  ).toEqual([{ id: '1', name: '보고서.pdf' }]);
  expect(parseCampaignAttachments('invalid')).toEqual([]);
});
