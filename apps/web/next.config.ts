import type { NextConfig } from "next";
const nextConfig: NextConfig = { transpilePackages: ["@parallax/simulation"] };

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";

Object.assign(nextConfig, {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGitHubPagesBuild ? "/parallax-ai" : "",
  assetPrefix: isGitHubPagesBuild ? "/parallax-ai/" : undefined,
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPagesBuild ? "/parallax-ai" : "" },
});

export default nextConfig;
