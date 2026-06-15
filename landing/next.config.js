const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  outputFileTracingIncludes: {
    '/*': ['./public/**/*.html', './public/*.txt', './public/*.xml'],
  },
};

module.exports = nextConfig;
