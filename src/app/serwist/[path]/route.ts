import { createSerwistRoute } from "@serwist/turbopack";
import { publicOfflineRoutes } from "@/data/pwa";
import { tripImagePaths } from "@/data/tripImages";

const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? "fukuoka-control-v1";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  manifestTransforms: [async (entries) => {
    const normalizedUrl = (url: string) => url.replaceAll("\\", "/").replace(/^\/?public\//, "/");
    const manifestUrls = new Set(entries.map((entry) => normalizedUrl(entry.url)));
    for (const imagePath of tripImagePaths) {
      if (!manifestUrls.has(imagePath)) {
        throw new Error(`Missing itinerary image in Serwist manifest: ${imagePath}`);
      }
    }
    return {
      manifest: entries,
      warnings: [],
    };
  }],
  additionalPrecacheEntries: publicOfflineRoutes.map((url) => ({ url, revision })),
});
