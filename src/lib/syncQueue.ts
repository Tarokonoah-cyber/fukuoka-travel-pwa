export async function drainOperationQueue<T>(
  getOperations: () => Promise<T[]>,
  processOperation: (operation: T) => Promise<void>,
) {
  let processed = 0;
  while (true) {
    const operations = await getOperations();
    if (!operations.length) return processed;
    for (const operation of operations) {
      await processOperation(operation);
      processed += 1;
    }
  }
}
