import { getTrashAccessibleObjectMetadataItems } from '@/trash/utils/getTrashAccessibleObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type ObjectPermissions } from 'twenty-shared/types';

const createObjectMetadataItem = (
  overrides: Partial<EnrichedObjectMetadataItem> & {
    id: string;
    fields?: EnrichedObjectMetadataItem['fields'];
  },
): EnrichedObjectMetadataItem =>
  ({
    isActive: true,
    isSystem: false,
    isRemote: false,
    nameSingular: 'company',
    namePlural: 'companies',
    labelSingular: 'Company',
    labelPlural: 'Companies',
    labelIdentifierFieldMetadataId: 'name-field',
    icon: 'IconBuilding',
    fields: [
      {
        id: 'deleted-at-field',
        name: 'deletedAt',
      },
    ],
    ...overrides,
  }) as EnrichedObjectMetadataItem;

const createObjectPermissions = (
  objectMetadataId: string,
  overrides: Partial<ObjectPermissions> = {},
): ObjectPermissions & { objectMetadataId: string } => ({
  objectMetadataId,
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
  restrictedFields: {},
  rowLevelPermissionPredicates: [],
  rowLevelPermissionPredicateGroups: [],
  ...overrides,
});

describe('getTrashAccessibleObjectMetadataItems', () => {
  it('should include objects the user can soft-delete', () => {
    const company = createObjectMetadataItem({ id: 'company-id' });

    const result = getTrashAccessibleObjectMetadataItems({
      objectMetadataItems: [company],
      objectPermissionsByObjectMetadataId: {
        'company-id': createObjectPermissions('company-id', {
          canSoftDeleteObjectRecords: true,
        }),
      },
    });

    expect(result).toEqual([company]);
  });

  it('should include objects the user can only destroy', () => {
    const company = createObjectMetadataItem({ id: 'company-id' });

    const result = getTrashAccessibleObjectMetadataItems({
      objectMetadataItems: [company],
      objectPermissionsByObjectMetadataId: {
        'company-id': createObjectPermissions('company-id', {
          canDestroyObjectRecords: true,
        }),
      },
    });

    expect(result).toEqual([company]);
  });

  it('should exclude objects the user can only read', () => {
    const company = createObjectMetadataItem({ id: 'company-id' });

    const result = getTrashAccessibleObjectMetadataItems({
      objectMetadataItems: [company],
      objectPermissionsByObjectMetadataId: {
        'company-id': createObjectPermissions('company-id'),
      },
    });

    expect(result).toEqual([]);
  });

  it('should exclude system, remote, inactive, and objects without deletedAt', () => {
    const readableCompany = createObjectMetadataItem({ id: 'company-id' });

    const result = getTrashAccessibleObjectMetadataItems({
      objectMetadataItems: [
        createObjectMetadataItem({ id: 'system-id', isSystem: true }),
        createObjectMetadataItem({ id: 'remote-id', isRemote: true }),
        createObjectMetadataItem({ id: 'inactive-id', isActive: false }),
        createObjectMetadataItem({
          id: 'no-deleted-at-id',
          fields: [{ id: 'name-field', name: 'name' }],
        } as Partial<EnrichedObjectMetadataItem> & {
          id: string;
          fields: EnrichedObjectMetadataItem['fields'];
        }),
        readableCompany,
      ],
      objectPermissionsByObjectMetadataId: {
        'system-id': createObjectPermissions('system-id', {
          canSoftDeleteObjectRecords: true,
        }),
        'remote-id': createObjectPermissions('remote-id', {
          canSoftDeleteObjectRecords: true,
        }),
        'inactive-id': createObjectPermissions('inactive-id', {
          canSoftDeleteObjectRecords: true,
        }),
        'no-deleted-at-id': createObjectPermissions('no-deleted-at-id', {
          canSoftDeleteObjectRecords: true,
        }),
        'company-id': createObjectPermissions('company-id', {
          canSoftDeleteObjectRecords: true,
        }),
      },
    });

    expect(result).toEqual([readableCompany]);
  });
});
