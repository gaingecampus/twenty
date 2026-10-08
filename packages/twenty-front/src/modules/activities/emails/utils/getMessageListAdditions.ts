export const getMessageListAdditions = <
  T extends { id: string; emails?: { primaryEmail?: string } | null },
>(
  customers: T[],
  existingPersonIds: string[],
) => {
  const existingIds = new Set(existingPersonIds);
  const uniqueCustomers = Array.from(
    new Map(customers.map((customer) => [customer.id, customer])).values(),
  );
  const additions = uniqueCustomers.filter(
    (customer) => !existingIds.has(customer.id),
  );
  return {
    additions,
    alreadyIncluded: uniqueCustomers.length - additions.length,
    missingEmail: additions.filter(
      (customer) => !customer.emails?.primaryEmail?.trim(),
    ).length,
  };
};
