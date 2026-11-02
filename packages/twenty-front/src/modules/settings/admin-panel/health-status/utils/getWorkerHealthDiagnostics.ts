export type WorkerHealthDiagnostic = {
  queueName: string;
  errorMessage?: string;
  workers: number;
};

export const getWorkerHealthDiagnostics = (
  serialized: string | null | undefined,
): WorkerHealthDiagnostic[] => {
  try {
    const details: unknown = JSON.parse(serialized ?? '{}');

    if (
      !details ||
      typeof details !== 'object' ||
      !('queues' in details) ||
      !Array.isArray(details.queues)
    ) {
      return [];
    }

    return details.queues.flatMap((queue: unknown) => {
      if (
        !queue ||
        typeof queue !== 'object' ||
        !('queueName' in queue) ||
        typeof queue.queueName !== 'string' ||
        !('workers' in queue) ||
        typeof queue.workers !== 'number'
      ) {
        return [];
      }

      return [
        {
          queueName: queue.queueName,
          workers: queue.workers,
          errorMessage:
            'errorMessage' in queue && typeof queue.errorMessage === 'string'
              ? queue.errorMessage
              : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
};
