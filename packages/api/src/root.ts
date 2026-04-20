import { adminRouter } from "./router/admin";
import { authRouter } from "./router/auth";
import { dashboardRouter } from "./router/dashboard";
import { questionRouter } from "./router/question";
import { unitRouter } from "./router/unit";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  question: questionRouter,
  unit: unitRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
