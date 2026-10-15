export const getWorkspaceMemberRecipients = <
  T extends { id: string; userEmail?: string | null },
>(
  members: T[],
  currentMemberId: string | undefined,
) =>
  currentMemberId
    ? members
        .filter((member) => member.id !== currentMemberId)
        .map((member) => ({
          ...member,
          emails: { primaryEmail: member.userEmail ?? '' },
        }))
    : [];
