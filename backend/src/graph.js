import { StateGraph, START, END } from "@langchain/langgraph";
import { StateAnnotation } from "./state.js";
import { fetchPR } from "./nodes/fetchPR.js";
import { orchestrator } from "./nodes/orchestrator.js";
import { fanout } from "./nodes/fanout.js";
import { reducer } from "./nodes/reducer.js";
import { securityWorker }    from "./nodes/workers/security.js";
import { performanceWorker } from "./nodes/workers/performance.js";
import { styleWorker }       from "./nodes/workers/style.js";
import { testingWorker }     from "./nodes/workers/testing.js";
import { logicWorker }       from "./nodes/workers/logic.js";

const g = new StateGraph(StateAnnotation);

// Register nodes
g.addNode("fetchPR",           fetchPR);
g.addNode("orchestrator",      orchestrator);
g.addNode("securityWorker",    securityWorker);
g.addNode("performanceWorker", performanceWorker);
g.addNode("styleWorker",       styleWorker);
g.addNode("testingWorker",     testingWorker);
g.addNode("logicWorker",       logicWorker);
g.addNode("reducer",           reducer);

// Wire edges
g.addEdge(START,          "fetchPR");
g.addEdge("fetchPR",      "orchestrator");

// Orchestrator fans out to relevant workers
g.addConditionalEdges("orchestrator", fanout, [
  "securityWorker",
  "performanceWorker",
  "styleWorker",
  "testingWorker",
  "logicWorker",
]);

// All workers feed into reducer
g.addEdge("securityWorker",    "reducer");
g.addEdge("performanceWorker", "reducer");
g.addEdge("styleWorker",       "reducer");
g.addEdge("testingWorker",     "reducer");
g.addEdge("logicWorker",       "reducer");

g.addEdge("reducer", END);

export const app = g.compile();

const mermaid = app.getGraph().drawMermaid();

console.log(mermaid)