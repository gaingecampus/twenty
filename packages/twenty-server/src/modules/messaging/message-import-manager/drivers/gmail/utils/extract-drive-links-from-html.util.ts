import { isNonEmptyString } from '@sniptt/guards';

export type DriveLinkFromHtml = {
  url: string;
  label: string;
};

const DRIVE_FILE_ID_PATTERNS = [
  /https?:\/\/drive\.google\.com\/file\/d\/([^/"'\s>]+)(?:\/[^"'\s>]*)?/gi,
  /https?:\/\/drive\.google\.com\/open\?id=([^"'&\s>]+)/gi,
];

const DRIVE_URL_QUICK_CHECK =
  /https?:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=)/i;

const PLAIN_TEXT_LABEL_PATTERN =
  /([^\n<]+?)\s*<\s*(https?:\/\/drive\.google\.com\/[^>\s]+)\s*>/g;

const extractFileIdFromDriveUrl = (url: string): string | null => {
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(url);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

const extractLabelNearUrl = (body: string, fileId: string): string | null => {
  const anchorMatch = new RegExp(
    `<a[^>]*href=["'][^"']*${fileId}[^"']*["'][^>]*>([^<]+)</a>`,
    'i',
  ).exec(body);

  if (anchorMatch?.[1]) {
    return anchorMatch[1].trim();
  }

  const plainTextLabelMatch = new RegExp(
    `([^\\n<]+?)\\s*<\\s*[^>]*${fileId}[^>]*>`,
    'i',
  ).exec(body);

  if (plainTextLabelMatch?.[1]) {
    return plainTextLabelMatch[1].trim();
  }

  return null;
};

const extractPlainTextLabelPatternLinks = (
  body: string,
  linksByFileId: Map<string, DriveLinkFromHtml>,
): void => {
  PLAIN_TEXT_LABEL_PATTERN.lastIndex = 0;

  for (const match of body.matchAll(PLAIN_TEXT_LABEL_PATTERN)) {
    const label = match[1]?.trim();
    const url = match[2]?.trim();

    if (!isNonEmptyString(url)) {
      continue;
    }

    const fileId = extractFileIdFromDriveUrl(url);

    if (!fileId || linksByFileId.has(fileId)) {
      continue;
    }

    linksByFileId.set(fileId, {
      url,
      label: isNonEmptyString(label) ? label : `Google Drive file ${fileId}`,
    });
  }
};

const extractUrlPatternLinks = (
  body: string,
  linksByFileId: Map<string, DriveLinkFromHtml>,
): void => {
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of body.matchAll(pattern)) {
      const url = match[0];
      const fileId = match[1];

      if (!fileId || linksByFileId.has(fileId)) {
        continue;
      }

      const label =
        extractLabelNearUrl(body, fileId) ?? `Google Drive file ${fileId}`;

      linksByFileId.set(fileId, { url, label });
    }
  }
};

export const hasDriveLinksInMessageBody = ({
  htmlBody,
  textBody,
}: {
  htmlBody?: string | null;
  textBody?: string | null;
}): boolean => {
  return [htmlBody, textBody].some(
    (body) => isNonEmptyString(body) && DRIVE_URL_QUICK_CHECK.test(body),
  );
};

export const extractDriveLinksFromMessageBodies = ({
  htmlBody,
  textBody,
}: {
  htmlBody?: string | null;
  textBody?: string | null;
}): DriveLinkFromHtml[] => {
  const linksByFileId = new Map<string, DriveLinkFromHtml>();

  for (const body of [textBody, htmlBody].filter(isNonEmptyString)) {
    extractPlainTextLabelPatternLinks(body, linksByFileId);
  }

  for (const body of [htmlBody, textBody].filter(isNonEmptyString)) {
    extractUrlPatternLinks(body, linksByFileId);
  }

  return [...linksByFileId.values()];
};

export const extractDriveLinksFromHtml = (
  html: string,
): DriveLinkFromHtml[] => {
  return extractDriveLinksFromMessageBodies({ htmlBody: html });
};
