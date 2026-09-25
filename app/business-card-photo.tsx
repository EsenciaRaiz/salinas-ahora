import { useEffect, useState, type ComponentType } from 'react';

type Props = {
  images: string[];
  name: string;
  category: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: 'true' }>;
};

export default function BusinessCardPhoto({ images, name, category, Icon }: Props) {
  const [index, setIndex] = useState(0);
  const imageKey = images.join('|');
  useEffect(() => setIndex(0), [imageKey]);
  const image = images[index];

  if (!image) return <div className="business-photo business-photo-placeholder" aria-label="Este negocio todavía no tiene foto disponible" role="img"><Icon size={64} strokeWidth={1.4} aria-hidden="true" /><span>{category || 'Negocio local'}</span></div>;
  return <div className={`business-photo-frame ${image.endsWith('.svg') ? 'logo-frame' : ''}`}><img className="business-photo" src={image} alt={`Imagen de ${name}`} loading="lazy" decoding="async" width="640" height="420" onError={() => setIndex((value) => value + 1)} /></div>;
}
