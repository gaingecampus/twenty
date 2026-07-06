import { useStore } from 'jotai';
import { useCallback } from 'react';

import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useUpdateMetadataStoreDraft } from '@/metadata-store/hooks/useUpdateMetadataStoreDraft';
import { type FlatViewField } from '@/metadata-store/types/FlatViewField';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { usePerformViewFieldAPIPersist } from '@/views/hooks/internal/usePerformViewFieldAPIPersist';
import { useCanPersistViewChanges } from '@/views/hooks/useCanPersistViewChanges';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { type ViewField } from '@/views/types/ViewField';
import { resolveExistingViewFieldForSave } from '@/views/utils/resolveViewFieldForSave';
import {
  type CreateViewFieldInput,
  type UpdateViewFieldMutationVariables,
} from '~/generated-metadata/graphql';
import { isDefined } from 'twenty-shared/utils';
import { type RelationRollupSettings } from 'twenty-shared/types';
import { isDeeplyEqual } from '~/utils/isDeeplyEqual';
import { isUndefinedOrNull } from '~/utils/isUndefinedOrNull';

const DEFAULT_VIEW_FIELD_SIZE = 180;

export const useSaveCurrentViewFields = () => {
  const { canPersistChanges } = useCanPersistViewChanges();
  const { performViewFieldAPICreate, performViewFieldAPIUpdate } =
    usePerformViewFieldAPIPersist();
  const { addToDraft, applyChanges } = useUpdateMetadataStoreDraft();

  const { getViewFromState } = useGetViewFromState();

  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const store = useStore();

  const saveViewFields = useCallback(
    async (viewFieldsToSave: Omit<ViewField, 'definition'>[]) => {
      if (!canPersistChanges) {
        return;
      }

      const currentViewId = store.get(currentViewIdCallbackState);

      if (!currentViewId) {
        return;
      }

      const view = getViewFromState(currentViewId);

      if (isUndefinedOrNull(view)) {
        return;
      }

      const currentViewFields = view.viewFields;

      const { viewFieldsToCreate, viewFieldsToUpdate } =
        viewFieldsToSave.reduce<{
          viewFieldsToCreate: CreateViewFieldInput[];
          viewFieldsToUpdate: UpdateViewFieldMutationVariables[];
        }>(
          (
            { viewFieldsToCreate, viewFieldsToUpdate },
            viewFieldToCreateOrUpdate,
          ) => {
            const createViewFieldInput = {
              id: viewFieldToCreateOrUpdate.id,
              fieldMetadataId: viewFieldToCreateOrUpdate.fieldMetadataId,
              position: viewFieldToCreateOrUpdate.position,
              isVisible: viewFieldToCreateOrUpdate.isVisible,
              size: viewFieldToCreateOrUpdate.size,
              aggregateOperation: viewFieldToCreateOrUpdate.aggregateOperation,
              viewId: currentViewId,
              relationRollup: viewFieldToCreateOrUpdate.relationRollup,
            } as CreateViewFieldInput;

            const existingField = resolveExistingViewFieldForSave({
              viewFieldToSave: viewFieldToCreateOrUpdate,
              currentViewFields,
            });

            if (isUndefinedOrNull(existingField)) {
              return {
                viewFieldsToCreate: [
                  ...viewFieldsToCreate,
                  createViewFieldInput,
                ],
                viewFieldsToUpdate,
              };
            }

            const relationRollupToSave =
              createViewFieldInput.relationRollup ?? existingField.relationRollup;

            const hasRelationRollupChange =
              isDefined(createViewFieldInput.relationRollup) &&
              !isDeeplyEqual(
                createViewFieldInput.relationRollup,
                existingField.relationRollup,
              );

            if (
              isDeeplyEqual(
                {
                  position: existingField.position,
                  size: existingField.size,
                  isVisible: existingField.isVisible,
                  aggregateOperation: existingField.aggregateOperation,
                  relationRollup: existingField.relationRollup,
                },
                {
                  position: createViewFieldInput.position,
                  size: createViewFieldInput.size,
                  isVisible: createViewFieldInput.isVisible,
                  aggregateOperation: createViewFieldInput.aggregateOperation,
                  relationRollup: relationRollupToSave,
                },
              )
            ) {
              return {
                viewFieldsToCreate,
                viewFieldsToUpdate,
              };
            }

            return {
              viewFieldsToCreate,
              viewFieldsToUpdate: [
                ...viewFieldsToUpdate,
                {
                  input: {
                    id: existingField.id,
                    update: {
                      aggregateOperation:
                        createViewFieldInput.aggregateOperation,
                      isVisible: createViewFieldInput.isVisible,
                      position: createViewFieldInput.position,
                      size: createViewFieldInput.size,
                      ...(hasRelationRollupChange && isDefined(relationRollupToSave)
                        ? {
                            relationRollup:
                              relationRollupToSave as RelationRollupSettings,
                          }
                        : {}),
                    },
                  },
                },
              ],
            };
          },
          {
            viewFieldsToUpdate: [],
            viewFieldsToCreate: [],
          },
        );

      const [createResult, updateResult] = await Promise.all([
        performViewFieldAPICreate({ inputs: viewFieldsToCreate }),
        performViewFieldAPIUpdate(viewFieldsToUpdate),
      ]);

      const viewFieldsToSyncInDraft: FlatViewField[] = [];

      if (createResult.status === 'successful') {
        for (const createViewFieldInput of viewFieldsToCreate) {
          viewFieldsToSyncInDraft.push({
            id: createViewFieldInput.id ?? '',
            viewId: createViewFieldInput.viewId,
            fieldMetadataId: createViewFieldInput.fieldMetadataId,
            position: createViewFieldInput.position ?? 0,
            isVisible: createViewFieldInput.isVisible ?? true,
            size: createViewFieldInput.size ?? DEFAULT_VIEW_FIELD_SIZE,
            isActive: true,
            aggregateOperation: createViewFieldInput.aggregateOperation,
            ...(isDefined(createViewFieldInput.relationRollup)
              ? {
                  relationRollup:
                    createViewFieldInput.relationRollup as RelationRollupSettings,
                }
              : {}),
          });
        }
      }

      if (updateResult.status === 'successful') {
        for (const viewFieldToUpdate of viewFieldsToUpdate) {
          const existingViewField = currentViewFields.find(
            (currentViewField) =>
              currentViewField.id === viewFieldToUpdate.input.id,
          );

          if (!isDefined(existingViewField)) {
            continue;
          }

          viewFieldsToSyncInDraft.push({
            id: existingViewField.id,
            viewId: currentViewId,
            fieldMetadataId: existingViewField.fieldMetadataId,
            position:
              viewFieldToUpdate.input.update.position ??
              existingViewField.position,
            isVisible:
              viewFieldToUpdate.input.update.isVisible ??
              existingViewField.isVisible,
            size:
              viewFieldToUpdate.input.update.size ?? existingViewField.size,
            isActive: existingViewField.isActive,
            aggregateOperation:
              viewFieldToUpdate.input.update.aggregateOperation ??
              existingViewField.aggregateOperation,
            relationRollup: isDefined(viewFieldToUpdate.input.update.relationRollup)
              ? (viewFieldToUpdate.input.update
                  .relationRollup as RelationRollupSettings)
              : existingViewField.relationRollup,
          });
        }
      }

      if (viewFieldsToSyncInDraft.length > 0) {
        addToDraft({ key: 'viewFields', items: viewFieldsToSyncInDraft });
        applyChanges();
      }
    },
    [
      store,
      canPersistChanges,
      performViewFieldAPICreate,
      currentViewIdCallbackState,
      getViewFromState,
      performViewFieldAPIUpdate,
      addToDraft,
      applyChanges,
    ],
  );

  return {
    saveViewFields,
  };
};
