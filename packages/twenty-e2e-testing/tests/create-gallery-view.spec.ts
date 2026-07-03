import { expect, test } from '../lib/fixtures/screenshot';

test.describe.serial('Create Gallery View', () => {
  test('Create gallery view from companies', async ({ page }) => {
    await page.getByRole('link', { name: 'Companies' }).click();
    await page.getByRole('button', { name: /All Companies/ }).click();
    await page.getByText('Add view').click();
    await page.getByRole('textbox').press('ControlOrMeta+a');
    await page.getByRole('textbox').fill('Gallery view');
    await page.getByRole('button', { name: 'Table', exact: true }).click();
    await page.getByText('Gallery').click();
    await page.getByRole('button', { name: 'Create new view' }).click();
    await expect(page.getByText('Gallery view')).toBeVisible({
      timeout: 30000,
    });
  });
});
