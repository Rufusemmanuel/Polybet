'use client';

import Image, { type ImageProps } from 'next/image';

const ALLOWED_HOSTS = new Set<string>([
  'polymarket-upload.s3.us-east-2.amazonaws.com',
  'crests.football-data.org',
  'api.football-data.org',
]);

type SafeRemoteImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src?: string | null;
  alt: string;
};

const canRenderImage = (src?: string | null) => {
  if (!src) return false;
  try {
    const url = new URL(src);
    return ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

export function SafeRemoteImage({ src, alt, ...props }: SafeRemoteImageProps) {
  if (!canRenderImage(src)) return null;
  return <Image src={src!} alt={alt} {...props} />;
}
