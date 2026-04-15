import { adminRouter } from "./router/admin";
import { authRouter } from "./router/auth";
import { unitRouter } from "./router/unit";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  auth: authRouter,
  unit: unitRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
