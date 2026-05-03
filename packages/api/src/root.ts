import { adminRouter } from "./router/admin";
import { attendanceRouter } from "./router/attendance";
import { authRouter } from "./router/auth";
import { dashboardRouter } from "./router/dashboard";
import { drawingRouter } from "./router/drawing";
import { groupRouter } from "./router/group";
import { questionRouter } from "./router/question";
import { stageRouter } from "./router/stage";
import { taskRouter } from "./router/task";
import { unitRouter } from "./router/unit";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  attendance: attendanceRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  drawing: drawingRouter,
  group: groupRouter,
  question: questionRouter,
  stage: stageRouter,
  task: taskRouter,
  unit: unitRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
