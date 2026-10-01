import { getTabListInstanceIdFromPageLayoutAndRecord } from '@/page-layout/utils/getTabListInstanceIdFromPageLayoutAndRecord';
import { PageLayoutType } from '~/generated-metadata/graphql';

describe('getTabListInstanceIdFromPageLayoutAndRecord', () => {
  it('should scope record page tabs to the object', () => {
    const result = getTabListInstanceIdFromPageLayoutAndRecord({
      pageLayoutId: 'layout-1',
      layoutType: PageLayoutType.RECORD_PAGE,
      targetRecordIdentifier: {
        id: 'record-42',
        targetObjectNameSingular: 'company',
      },
    });

    expect(result).toBe('layout-1-tab-list-company');
  });

  it('shares tabs between company records but isolates other objects', () => {
    const instanceFor = (id: string, targetObjectNameSingular: string) =>
      getTabListInstanceIdFromPageLayoutAndRecord({
        pageLayoutId: 'layout-1',
        layoutType: PageLayoutType.RECORD_PAGE,
        targetRecordIdentifier: { id, targetObjectNameSingular },
      });
    expect(instanceFor('first', 'company')).toBe(
      instanceFor('second', 'company'),
    );
    expect(instanceFor('first', 'company')).not.toBe(
      instanceFor('first', 'person'),
    );
  });

  it('should omit record ID for DASHBOARD layout', () => {
    const result = getTabListInstanceIdFromPageLayoutAndRecord({
      pageLayoutId: 'layout-1',
      layoutType: PageLayoutType.DASHBOARD,
      targetRecordIdentifier: {
        id: 'record-42',
        targetObjectNameSingular: 'company',
      },
    });

    expect(result).toBe('layout-1-tab-list');
  });

  it('should omit record ID when targetRecordIdentifier is undefined', () => {
    const result = getTabListInstanceIdFromPageLayoutAndRecord({
      pageLayoutId: 'layout-1',
      layoutType: PageLayoutType.RECORD_PAGE,
      targetRecordIdentifier: undefined,
    });

    expect(result).toBe('layout-1-tab-list');
  });

  it('should use the base instance ID from getTabListInstanceIdFromPageLayoutId', () => {
    const result = getTabListInstanceIdFromPageLayoutAndRecord({
      pageLayoutId: 'my-custom-layout',
      layoutType: PageLayoutType.DASHBOARD,
    });

    expect(result).toBe('my-custom-layout-tab-list');
  });
});
