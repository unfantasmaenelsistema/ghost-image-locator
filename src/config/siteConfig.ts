export interface SiteConfig {
  websiteUrl: string;
  websiteName: string;
  author: string;
  githubUrl: string;
  logoUrl: string;
  brandBannerUrl: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  websiteUrl: 'https://www.unfantasmaenelsistema.com/',
  websiteName: 'Un Fantasma en el Sistema',
  author: 'Un Fantasma en el Sistema',
  githubUrl: 'https://github.com/jpm70a',
  logoUrl: '/icono.png',
  brandBannerUrl: '/brand-banner.png',
};
