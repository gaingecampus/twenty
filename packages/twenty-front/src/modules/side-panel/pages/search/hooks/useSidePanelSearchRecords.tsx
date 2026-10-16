import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useObjectRecordSearchRecords } from '@/object-record/hooks/useObjectRecordSearchRecords';
import { useReadableObjectMetadataItems } from '@/object-metadata/hooks/useReadableObjectMetadataItems';
import { useSearchableObjectNameSingulars } from '@/side-panel/hooks/useSearchableObjectNameSingulars';
import { sidePanelSearchObjectFilterState } from '@/side-panel/states/sidePanelSearchObjectFilterState';
import { sidePanelSearchState } from '@/side-panel/states/sidePanelSearchState';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useMemo } from 'react';
import { useDebounce } from 'use-debounce';

export type SearchResultItem = {
  id: string;
  label: string;
  objectNameSingular: string;
  recordId: string;
  imageUrl?: string | null;
  objectLabel: string;
  customerContext?: string;
  avatarType: 'squared' | 'rounded';
};

export type SearchResultGroup = {
  heading: string;
  items: SearchResultItem[];
};

export const useSidePanelSearchRecords = () => {
  const sidePanelSearch = useAtomStateValue(sidePanelSearchState);
  const sidePanelSearchObjectFilter = useAtomStateValue(
    sidePanelSearchObjectFilterState,
  );
  const trimmedSidePanelSearch = sidePanelSearch.trim();

  const [deferredSidePanelSearch] = useDebounce(trimmedSidePanelSearch, 300);
  const { readableObjectMetadataItems } = useReadableObjectMetadataItems();
  const includedObjectNameSingulars = useSearchableObjectNameSingulars({
    selectedObjectNameSingular: sidePanelSearchObjectFilter,
  });

  const { loading, searchRecords } = useObjectRecordSearchRecords({
    objectNameSingulars: includedObjectNameSingulars,
    searchInput: deferredSidePanelSearch,
  });

  const personIds = searchRecords
    .filter(
      (record) => record.objectNameSingular === CoreObjectNameSingular.Person,
    )
    .map((record) => record.recordId);
  const { records: people } = useFindManyRecords<
    ObjectRecord & { jobTitle?: string; company?: { name?: string } | null }
  >({
    objectNameSingular: CoreObjectNameSingular.Person,
    filter: { id: { in: personIds } },
    skip: personIds.length === 0,
    recordGqlFields: {
      id: true,
      jobTitle: true,
      company: { id: true, name: true },
    },
    limit: personIds.length || 1,
  });
  const customerContextById = useMemo(
    () =>
      new Map(
        people.map((person) => [
          person.id,
          [person.company?.name, person.jobTitle].filter(Boolean).join(' · '),
        ]),
      ),
    [people],
  );

  const searchResultItems: SearchResultItem[] = useMemo(() => {
    return searchRecords.map((searchRecord) => ({
      id: searchRecord.recordId,
      label: searchRecord.label,
      objectNameSingular: searchRecord.objectNameSingular,
      recordId: searchRecord.recordId,
      imageUrl: searchRecord.imageUrl,
      customerContext:
        searchRecord.objectNameSingular === CoreObjectNameSingular.Person
          ? customerContextById.get(searchRecord.recordId)
          : undefined,
      objectLabel:
        readableObjectMetadataItems.find(
          (item) => item.nameSingular === searchRecord.objectNameSingular,
        )?.labelSingular ?? searchRecord.objectNameSingular,
      avatarType:
        searchRecord.objectNameSingular === CoreObjectNameSingular.Company
          ? ('squared' as const)
          : ('rounded' as const),
    }));
  }, [searchRecords, readableObjectMetadataItems, customerContextById]);

  return {
    loading,
    noResults: !searchResultItems.length,
    searchResultItems,
  };
};
