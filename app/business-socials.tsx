type SocialBusiness = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
};

const networks = [
  { key: 'instagram', label: 'Instagram', hosts: ['instagram.com'] },
  { key: 'facebook', label: 'Facebook', hosts: ['facebook.com', 'fb.com'] },
  { key: 'tiktok', label: 'TikTok', hosts: ['tiktok.com'] },
  { key: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
  { key: 'linkedin', label: 'LinkedIn', hosts: ['linkedin.com'] },
] as const;

export function socialLink(value: string | undefined, hosts: readonly string[]) {
  const source = String(value || '').trim();
  if (!source) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(source) ? source : `https://${source}`);
    const hostname = url.hostname.toLowerCase();
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password &&
      hosts.some(host => hostname === host || hostname.endsWith(`.${host}`)) ? url.href : '';
  } catch { return ''; }
}

function SocialIcon({ network }: { network: string }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
    {network === 'instagram' && <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2"/></>}
    {network === 'facebook' && <path d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.5A24 24 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v9z"/>}
    {network === 'tiktok' && <><path d="M15 3v12a5 5 0 1 1-4-4.9v3a2 2 0 1 0 1 1.9V3h3c.4 2.5 2.1 4 4.5 4.3v3A8 8 0 0 1 15 8.7" fill="#25f4ee" transform="translate(-.6 .6)"/><path d="M15 3v12a5 5 0 1 1-4-4.9v3a2 2 0 1 0 1 1.9V3h3c.4 2.5 2.1 4 4.5 4.3v3A8 8 0 0 1 15 8.7" fill="#fe2c55" transform="translate(.6 -.4)"/><path d="M15 3v12a5 5 0 1 1-4-4.9v3a2 2 0 1 0 1 1.9V3h3c.4 2.5 2.1 4 4.5 4.3v3A8 8 0 0 1 15 8.7"/></>}
    {network === 'youtube' && <><rect x="1" y="4.5" width="22" height="15" rx="5"/><path d="m10 8 6 4-6 4z" fill="white"/></>}
    {network === 'linkedin' && <><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="6.5" cy="7" r="1.5" fill="white"/><path d="M5 10h3v9H5zm5 0h3v1.3c.7-1 1.6-1.6 3-1.6 2.5 0 3 1.7 3 4.1V19h-3v-4.6c0-1.2-.2-2-1.3-2s-1.7.8-1.7 2V19h-3z" fill="white"/></>}
  </svg>;
}

export default function BusinessSocials({ business }: { business: SocialBusiness }) {
  const links = networks.map(network => ({ ...network, href: socialLink(business[network.key], network.hosts) })).filter(network => network.href);
  if (!links.length) return null;
  return <nav className="business-socials" aria-label="Redes sociales del negocio">
    {links.map(({ key, label, href }) => <a key={key} className={`business-social business-social-${key}`} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Visitar ${label} del negocio`}><SocialIcon network={key}/><span>{label}</span></a>)}
  </nav>;
}
