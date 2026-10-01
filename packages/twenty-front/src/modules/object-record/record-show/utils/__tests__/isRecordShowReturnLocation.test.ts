import { isRecordShowReturnLocation } from '@/object-record/record-show/utils/isRecordShowReturnLocation';
import { type RecordShowReturnContext } from '@/object-record/record-show/states/recordShowReturnContextState';

const context: RecordShowReturnContext = {
  locationKey: 'source',
  url: '/objects/companies?viewId=view',
  recordPath: '/object/company/record',
  recordIndexId: 'companies-view',
  filters: [],
  filterGroups: [],
  sorts: [],
  page: 2,
  scrollTop: 200,
  scrollLeft: 100,
};

describe('isRecordShowReturnLocation', () => {
  it('does not restore when no source was captured', () => {
    expect(isRecordShowReturnLocation(null, 'source', 'companies-view')).toBe(
      false,
    );
  });
  it('restores a browser history return to the original list', () => {
    expect(
      isRecordShowReturnLocation(context, 'source', 'companies-view'),
    ).toBe(true);
  });
  it('restores an explicit return with a new history entry key', () => {
    expect(
      isRecordShowReturnLocation(
        context,
        'new-key',
        'companies-view',
        'source',
      ),
    ).toBe(true);
  });
  it('does not restore another view even with the same return key', () => {
    expect(
      isRecordShowReturnLocation(
        context,
        'new-key',
        'companies-other-view',
        'source',
      ),
    ).toBe(false);
  });
  it('does not restore an unrelated visit to the same list', () => {
    expect(
      isRecordShowReturnLocation(context, 'other-key', 'companies-view'),
    ).toBe(false);
  });
});
