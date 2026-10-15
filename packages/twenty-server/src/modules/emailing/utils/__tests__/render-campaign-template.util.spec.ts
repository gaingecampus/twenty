import { renderCampaignTemplate } from 'src/modules/emailing/utils/render-campaign-template.util';

describe('renderCampaignTemplate', () => {
  it('fills customer variables while preserving email formatting', () => {
    expect(
      renderCampaignTemplate(
        '<p>{{fullName}}님, {{ firstName }} {{lastName}} / {{email}}</p>',
        {
          fullName: '하나 박',
          firstName: '하나',
          lastName: '박',
          email: 'hana@example.com',
        },
        { escapeValues: true },
      ),
    ).toBe('<p>하나 박님, 하나 박 / hana@example.com</p>');
  });

  it('escapes customer data as text instead of inserting HTML', () => {
    expect(
      renderCampaignTemplate(
        '<p>{{fullName}}</p>',
        { fullName: '<img src=x>' },
        { escapeValues: true },
      ),
    ).toBe('<p>&lt;img src=x&gt;</p>');
  });

  it('renders missing values as empty text', () => {
    expect(
      renderCampaignTemplate(
        '{{fullName}}님 {{unknown}}',
        {},
        { escapeValues: true },
      ),
    ).toBe('님 ');
  });
});
