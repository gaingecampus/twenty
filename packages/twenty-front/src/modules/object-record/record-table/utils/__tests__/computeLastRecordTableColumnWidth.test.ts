import { getRecordTableColumnDisplayWidth } from '@/object-record/record-table/constants/RecordTableColumnWidthExtra';
import { computeLastRecordTableColumnWidth } from '@/object-record/record-table/utils/computeLastRecordTableColumnWidth';

describe('computeLastRecordTableColumnWidth', () => {
  const twoColumnDisplayWidth =
    getRecordTableColumnDisplayWidth(100) +
    getRecordTableColumnDisplayWidth(100);

  it('returns the last empty column min width when remaining width is not positive', () => {
    const recordFields = [{ size: 100 }, { size: 100 }];

    const { lastColumnWidth } = computeLastRecordTableColumnWidth({
      recordFields,
      tableWidth: twoColumnDisplayWidth,
      shouldCompactFirstColumn: false,
      isDragColumnHidden: false,
      isCheckboxColumnHidden: false,
    });

    expect(lastColumnWidth).toBe(24);
  });

  it('returns the remaining positive width when the table is wider than the total content width', () => {
    const recordFields = [{ size: 100 }, { size: 100 }];

    const { lastColumnWidth } = computeLastRecordTableColumnWidth({
      recordFields,
      tableWidth: twoColumnDisplayWidth + 175,
      shouldCompactFirstColumn: false,
      isDragColumnHidden: false,
      isCheckboxColumnHidden: false,
    });

    expect(lastColumnWidth).toBe(103);
  });

  it('excludes drag-and-drop and checkbox widths from the calculation when both columns are hidden', () => {
    const recordFields = [{ size: 100 }, { size: 100 }];

    const { lastColumnWidth } = computeLastRecordTableColumnWidth({
      recordFields,
      tableWidth: twoColumnDisplayWidth + 175,
      shouldCompactFirstColumn: false,
      isDragColumnHidden: true,
      isCheckboxColumnHidden: true,
    });

    expect(lastColumnWidth).toBe(143);
  });

  it('excludes the add column button width when that column is hidden', () => {
    const recordFields = [{ size: 100 }, { size: 100 }];

    const { lastColumnWidth } = computeLastRecordTableColumnWidth({
      recordFields,
      tableWidth: twoColumnDisplayWidth + 175,
      shouldCompactFirstColumn: false,
      isDragColumnHidden: false,
      isCheckboxColumnHidden: false,
      isAddColumnButtonHidden: true,
    });

    expect(lastColumnWidth).toBe(135);
  });

  it('uses the compact first column width when shouldCompactFirstColumn is true', () => {
    const recordFields = [{ size: 100 }, { size: 150 }];

    const { lastColumnWidth: lastColumnWidthWithCompact } =
      computeLastRecordTableColumnWidth({
        recordFields,
        tableWidth: 500,
        shouldCompactFirstColumn: true,
        isDragColumnHidden: false,
        isCheckboxColumnHidden: false,
      });

    const { lastColumnWidth: lastColumnWidthWithoutCompact } =
      computeLastRecordTableColumnWidth({
        recordFields,
        tableWidth: 500,
        shouldCompactFirstColumn: false,
        isDragColumnHidden: false,
        isCheckboxColumnHidden: false,
      });

    expect(lastColumnWidthWithCompact).toBeGreaterThan(
      lastColumnWidthWithoutCompact,
    );
  });
});
