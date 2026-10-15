export const campaignBodyToText = (html: string): string => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  document
    .querySelectorAll('script,style,iframe,object,template')
    .forEach((node) => node.remove());
  document.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
  document
    .querySelectorAll('p,div,li,h1,h2,h3,h4,tr,blockquote')
    .forEach((node) => node.append('\n'));
  return (document.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
};

export const parseCampaignAttachments = (
  value: unknown,
): { id: string; name: string }[] => {
  if (typeof value === 'string') {
    try {
      return parseCampaignAttachments(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.filter(
    (file): file is { id: string; name: string } =>
      typeof file === 'object' &&
      file !== null &&
      typeof file.id === 'string' &&
      typeof file.name === 'string',
  );
};
