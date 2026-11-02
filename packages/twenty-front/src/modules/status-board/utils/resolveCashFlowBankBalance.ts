import { readCashFlowCurrency } from '@/status-board/utils/calculateCashFlow';

type CashFlowBankTransaction = Record<string, unknown> & {
  transactionAt?: string | null;
  balance?: unknown;
  incomingAmount?: unknown;
  outgoingAmount?: unknown;
};

const MAX_CHAIN_SEARCH_STEPS = 10_000;

const readCurrencyMicros = (value: unknown): bigint | null => {
  if (readCashFlowCurrency(value) === null) return null;

  return BigInt(
    Number((value as { amountMicros: number | string }).amountMicros),
  );
};

// Transactions must be ordered by transactionAt descending. IDs do not imply
// the order of bank transactions that share the same timestamp.
export const resolveCashFlowBankBalance = (
  transactions: CashFlowBankTransaction[],
  hasNextPage = false,
): number | null => {
  const latest = transactions.at(0);

  if (!latest?.transactionAt) return null;

  const simultaneous = transactions.filter(
    (transaction) => transaction.transactionAt === latest.transactionAt,
  );

  // Never infer a closing balance from only part of a timestamp group.
  if (hasNextPage && simultaneous.length === transactions.length) return null;

  const latestBalance = readCashFlowCurrency(latest.balance);

  // When every possible last transaction has the same valid balance, its
  // ordering cannot change the displayed amount.
  if (
    latestBalance !== null &&
    simultaneous.every(
      (transaction) =>
        readCashFlowCurrency(transaction.balance) === latestBalance,
    )
  )
    return latestBalance;

  const movements = simultaneous.map((transaction) => {
    const after = readCurrencyMicros(transaction.balance);
    const incoming = readCurrencyMicros(transaction.incomingAmount);
    const outgoing = readCurrencyMicros(transaction.outgoingAmount);

    if (
      after === null ||
      incoming === null ||
      outgoing === null ||
      incoming < 0n ||
      outgoing < 0n
    )
      return null;

    return { before: after - incoming + outgoing, after };
  });

  if (movements.some((movement) => movement === null)) return null;

  const used = new Set<number>();
  let solutionCount = 0;
  let closingBalance: bigint | null = null;
  let searchSteps = 0;

  const search = (balance: bigint | null) => {
    searchSteps += 1;
    if (searchSteps > MAX_CHAIN_SEARCH_STEPS || solutionCount > 1) return;

    if (used.size === movements.length) {
      solutionCount += 1;
      closingBalance = balance;
      return;
    }

    for (const [index, movement] of movements.entries()) {
      if (searchSteps > MAX_CHAIN_SEARCH_STEPS || solutionCount > 1) return;
      if (
        movement === null ||
        used.has(index) ||
        (balance !== null && movement.before !== balance)
      )
        continue;

      used.add(index);
      search(movement.after);
      used.delete(index);
    }
  };

  search(null);

  // Two valid orders (even with the same ending balance), or an incomplete
  // search, cannot establish which transaction was last.
  return solutionCount === 1 && searchSteps <= MAX_CHAIN_SEARCH_STEPS
    ? Number(closingBalance) / 1_000_000
    : null;
};
