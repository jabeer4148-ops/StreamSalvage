import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function isSafeSegment(segment) {
  return (
    typeof segment === 'string' &&
    segment.length > 0 &&
    segment !== '.' &&
    segment !== '..' &&
    !segment.includes('/') &&
    !segment.includes('\\')
  );
}

function resolveHtmlPath(pathParts = []) {
  const decodedParts = [];

  for (const part of pathParts) {
    let decoded;
    try {
      decoded = decodeURIComponent(part);
    } catch {
      return null;
    }

    if (!isSafeSegment(decoded)) {
      return null;
    }
    decodedParts.push(decoded);
  }

  if (decodedParts.length === 0) {
    return path.join(PUBLIC_DIR, 'index.html');
  }

  const directoryIndexPath = path.join(PUBLIC_DIR, ...decodedParts, 'index.html');
  if (fs.existsSync(directoryIndexPath)) {
    return directoryIndexPath;
  }

  const htmlPath = `${path.join(PUBLIC_DIR, ...decodedParts)}.html`;
  if (fs.existsSync(htmlPath)) {
    return htmlPath;
  }

  return null;
}

export async function getServerSideProps({ params, res }) {
  const htmlPath = resolveHtmlPath(params?.path || []);

  if (!htmlPath) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
    return { props: {} };
  }

  const html = fs.readFileSync(htmlPath, 'utf8').replace(/\0+$/g, '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);

  return { props: {} };
}

export default function StaticHtmlPage() {
  return null;
}
