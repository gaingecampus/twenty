import { buildMessageListMilestones } from '@/activities/emails/utils/buildMessageListMilestones';

const input = {
  list: { id: 'list', createdAt: '2026-10-01T00:00:00Z' },
  campaigns: [
    {
      id: 'sent',
      subject: '안내',
      createdAt: '2026-10-02T00:00:00Z',
      sentAt: '2026-10-03T00:00:00Z',
    },
    {
      id: 'draft',
      subject: '초안',
      createdAt: '2026-10-04T00:00:00Z',
      sentAt: null,
    },
  ],
  campaignMetadataId: 'campaign-object',
  activities: [],
};
it('uses actual source dates in descending order and does not invent draft sends or authors', () => {
  const events = buildMessageListMilestones(input);
  expect(events.map((event) => event.createdAt)).toEqual([
    '2026-10-04T00:00:00Z',
    '2026-10-03T00:00:00Z',
    '2026-10-02T00:00:00Z',
    '2026-10-01T00:00:00Z',
  ]);
  expect(
    events.filter(
      (event) => event.properties.messagingMilestone === 'campaign-sent',
    ),
  ).toHaveLength(1);
  expect(events.every((event) => event.workspaceMember === null)).toBe(true);
  expect(events[1].linkedRecordId).toBe('sent');
});
it('does not duplicate an audited creation or mutate the source arrays', () => {
  const creation = buildMessageListMilestones({ ...input, campaigns: [] })[0];
  const events = buildMessageListMilestones({
    ...input,
    activities: [creation],
  });
  expect(
    events.filter((event) => event.name === 'messageList.created'),
  ).toHaveLength(1);
  expect(input.campaigns[0].id).toBe('sent');
});
it('ignores invalid or missing source timestamps', () => {
  expect(
    buildMessageListMilestones({
      ...input,
      list: undefined,
      campaigns: [{ ...input.campaigns[0], createdAt: '', sentAt: 'invalid' }],
    }),
  ).toEqual([]);
});
