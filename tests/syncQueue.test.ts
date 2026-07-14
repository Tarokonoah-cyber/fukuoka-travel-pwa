import { describe, expect, it } from "vitest";
import { drainOperationQueue } from "@/lib/syncQueue";

describe("sync outbox drain", () => {
  it("會處理同步途中才加入的操作", async () => {
    const queue = ["first"];
    const processed: string[] = [];
    await drainOperationQueue(
      async () => [...queue],
      async (operation) => {
        queue.splice(queue.indexOf(operation), 1);
        processed.push(operation);
        if (operation === "first") queue.push("second");
      },
    );
    expect(processed).toEqual(["first", "second"]);
    expect(queue).toEqual([]);
  });
});
