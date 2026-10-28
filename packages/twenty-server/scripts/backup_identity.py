"""Read persistent identity columns without modifying the source workbook."""
import uuid


def header_column(sheet, labels):
    columns = {cell.column for row in sheet.iter_rows(max_row=min(20, sheet.max_row))
               for cell in row if str(cell.value).strip() in labels}
    if len(columns) > 1:
        raise ValueError('Ambiguous backup identity column')
    return next(iter(columns), None)


def backup_id(sheet, row, bank_key=None):
    column = header_column(sheet, {'CRM 백업 ID'})
    value = sheet.cell(row, column).value if column else None
    if value and str(value).strip() != 'CRM 백업 ID':
        try:
            return str(uuid.UUID(str(value).strip()))
        except ValueError:
            raise ValueError(f'Invalid CRM backup ID at row {row}') from None
    if bank_key:
        column = header_column(sheet, {'거래고유번호', '은행 거래 ID'})
        value = sheet.cell(row, column).value if column else None
        if value:
            # Hash the source ID: never expose an account/recipient identifier.
            return str(uuid.uuid5(uuid.NAMESPACE_URL, f'gainge:bank:{bank_key}:{sheet.title}:{value}'))
    return None


def is_payroll(sheet, row):
    column = header_column(sheet, {'CRM 급여'})
    flag = sheet.cell(row, column).value if column else None
    return str(flag).strip().lower() in {'true', '1', 'y', 'yes', '급여'} or any(
        any(term in str(cell.value or '') for term in ('급여', '상여', '성과급', '퇴직금'))
        for cell in sheet[row])
