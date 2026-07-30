import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type APP_LOCALES } from 'twenty-shared/translations';

// Tracks which locale the IndexedDB metadata store labels were fetched for.
// Translated labels are cached without locale in the collection hash, so we
// invalidate the store when the workspace member locale differs from this value.
// Bump the key suffix when translation resolve paths change so clients refetch.
export const metadataStoreLocaleState = createAtomState<
  keyof typeof APP_LOCALES | null
>({
  key: 'metadataStoreLocaleStateV8',
  defaultValue: null,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
