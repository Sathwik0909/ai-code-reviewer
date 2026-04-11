import { Send } from "@langchain/langgraph";

const WORKER_MAP = {
  security:    "securityWorker",
  performance: "performanceWorker",
  style:       "styleWorker",
  testing:     "testingWorker",
  logic:       "logicWorker",
};

export function fanout(state) {
  return state.plan.tasks.map(
    (task) =>
      new Send(WORKER_MAP[task.category], {
        task,
        diff:        state.diff,
        pr_metadata: state.pr_metadata,
      })
  );
}