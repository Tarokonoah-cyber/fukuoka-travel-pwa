import { createSerwistRoute } from "@serwist/turbopack";
import { publicOfflineRoutes } from "@/data/pwa";

const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? "fukuoka-control-v1";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  additionalPrecacheEntries: publicOfflineRoutes.map((url) => ({ url, revision })),
});
