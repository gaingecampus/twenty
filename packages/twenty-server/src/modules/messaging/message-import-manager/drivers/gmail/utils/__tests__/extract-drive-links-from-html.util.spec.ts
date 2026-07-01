import {
  extractDriveLinksFromHtml,
  extractDriveLinksFromMessageBodies,
  hasDriveLinksInMessageBody,
} from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/extract-drive-links-from-html.util';

describe('extractDriveLinksFromHtml', () => {
  it('should extract file links from drive.google.com/file/d URLs', () => {
    const html =
      '<a href="https://drive.google.com/file/d/abc123/view">Proposal.pdf</a>';

    const links = extractDriveLinksFromHtml(html);

    expect(links).toEqual([
      {
        url: 'https://drive.google.com/file/d/abc123/view',
        label: 'Proposal.pdf',
      },
    ]);
  });

  it('should extract open?id links and use fallback label', () => {
    const html = 'See https://drive.google.com/open?id=xyz789 for the document';

    const links = extractDriveLinksFromHtml(html);

    expect(links).toEqual([
      {
        url: 'https://drive.google.com/open?id=xyz789',
        label: 'Google Drive file xyz789',
      },
    ]);
  });

  it('should deduplicate identical URLs', () => {
    const html = `
      <a href="https://drive.google.com/file/d/dup-id/view">First</a>
      Also see https://drive.google.com/file/d/dup-id/view again
    `;

    const links = extractDriveLinksFromHtml(html);

    expect(links).toHaveLength(1);
    expect(links[0].label).toBe('First');
  });
});

describe('extractDriveLinksFromMessageBodies', () => {
  it('should extract drive links from Gmail plain text large attachment format', () => {
    const textBody =
      '4444 강의안(PPT)_우리 조직의 원인원 사이클 설계하기.pptx < https://drive.google.com/file/d/163Ewa26dD1a2JB--dxIUyronPOdL0CDY/view?usp=drive_web >';

    const links = extractDriveLinksFromMessageBodies({ textBody });

    expect(links).toEqual([
      {
        url: 'https://drive.google.com/file/d/163Ewa26dD1a2JB--dxIUyronPOdL0CDY/view?usp=drive_web',
        label: '4444 강의안(PPT)_우리 조직의 원인원 사이클 설계하기.pptx',
      },
    ]);
  });

  it('should prefer plain text label over fallback when html is also provided', () => {
    const textBody =
      'Report.pdf < https://drive.google.com/file/d/file-id-123/view >';
    const htmlBody =
      '<a href="https://drive.google.com/file/d/file-id-123/view">Other name</a>';

    const links = extractDriveLinksFromMessageBodies({ textBody, htmlBody });

    expect(links).toHaveLength(1);
    expect(links[0].label).toBe('Report.pdf');
  });
});

describe('hasDriveLinksInMessageBody', () => {
  it('should return true when plain text contains a drive URL', () => {
    expect(
      hasDriveLinksInMessageBody({
        textBody:
          'file.pdf < https://drive.google.com/file/d/abc123/view?usp=drive_web >',
      }),
    ).toBe(true);
  });

  it('should return false when no drive URL is present', () => {
    expect(
      hasDriveLinksInMessageBody({
        textBody: 'Hello, please see the attached file.',
      }),
    ).toBe(false);
  });
});
