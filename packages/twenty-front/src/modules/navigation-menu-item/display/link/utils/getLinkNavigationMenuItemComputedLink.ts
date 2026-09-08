import { type NavigationMenuItem } from '~/generated-metadata/graphql';

export const getLinkNavigationMenuItemComputedLink = (
  item: Pick<NavigationMenuItem, 'link'>,
  currentOrigin?: string,
): string => {
  const linkUrl = (item.link ?? '').trim();
  const computedLink =
    linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
      ? linkUrl
      : linkUrl
        ? `https://${linkUrl}`
        : '';

  if (currentOrigin && computedLink) {
    try {
      const url = new URL(computedLink);
      if (url.origin === currentOrigin) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return computedLink;
    }
  }

  return computedLink;
};
