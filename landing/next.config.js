const fs = require('fs');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  outputFileTracingIncludes: {
    '/*': ['./public/**/*.html', './public/*.txt', './public/*.xml'],
  },
  async redirects() {
    // Public HTML files otherwise remain reachable beside their clean URLs.
    const guides = fs.readdirSync(path.join(__dirname, 'public', 'guides'))
      .filter((file) => file.endsWith('.html') && file !== 'index.html');
    return [
      { source: '/index', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/guides/index', destination: '/guides', permanent: true },
      { source: '/guides/index.html', destination: '/guides', permanent: true },
      ...guides.map((file) => ({
        source: `/guides/${file}`,
        destination: `/guides/${file.slice(0, -5)}`,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [{
      source: '/success',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
    }];
  },
};

module.exports = nextConfig;
