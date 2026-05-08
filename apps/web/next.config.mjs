/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['@toptannext/ui', '@toptannext/types'],
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'res.cloudinary.com',
			},
		],
	},
};

export default nextConfig;
