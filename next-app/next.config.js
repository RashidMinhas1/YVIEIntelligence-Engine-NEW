import path from "path";
const nextConfig = {
    outputFileTracingRoot: path.join(process.cwd()),
    serverExternalPackages: ["postgres", "@xenova/transformers"],
    images: {
        unoptimized: true,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '25mb',
        },
    },
    serverActions: {
        bodySizeLimit: '25mb',
    },
};
export default nextConfig;
