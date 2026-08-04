import { useApolloClient, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  FindManyCommandMenuItemsDocument,
  FindManyNavigationMenuItemsDocument,
  FindManyViewsDocument,
  ObjectMetadataItemsDocument,
} from '~/generated-metadata/graphql';

import { useMetadataErrorHandler } from '@/metadata-error-handler/hooks/useMetadataErrorHandler';
import { useUpdateMetadataStoreDraft } from '@/metadata-store/hooks/useUpdateMetadataStoreDraft';
import { type FlatFieldMetadataItem } from '@/metadata-store/types/FlatFieldMetadataItem';
import { type FlatObjectMetadataItem } from '@/metadata-store/types/FlatObjectMetadataItem';
import { splitViewWithRelated } from '@/metadata-store/utils/splitViewWithRelated';
import { type MetadataRequestResult } from '@/object-metadata/types/MetadataRequestResult.type';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useLoadCurrentUser } from '@/users/hooks/useLoadCurrentUser';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { t } from '@lingui/core/macro';
import { CrudOperationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const CREATE_MANY_TO_MANY_RELATION = gql`
  mutation CreateManyToManyRelation($input: CreateOneManyToManyRelationInput!) {
    createManyToManyRelation(input: $input) {
      sourceField {
        id
        type
        name
        label
        description
        icon
        isActive
        isUnique
        isNullable
        createdAt
        updatedAt
        settings
        defaultValue
        options
        isLabelSyncedWithName
        applicationId
        object {
          id
        }
      }
      targetField {
        id
        type
        name
        label
        description
        icon
        isActive
        isUnique
        isNullable
        createdAt
        updatedAt
        settings
        defaultValue
        options
        isLabelSyncedWithName
        applicationId
        object {
          id
        }
      }
      junctionObject {
        id
        nameSingular
        namePlural
        labelSingular
        labelPlural
        description
        icon
        isActive
        isSystem
        isUIEditable
        isUICreatable
        isSearchable
        isLabelSyncedWithName
        applicationId
        createdAt
        updatedAt
        labelIdentifierFieldMetadataId
        imageIdentifierFieldMetadataId
        fieldsList {
          id
          type
          name
          label
          description
          icon
          isActive
          isUnique
          isNullable
          createdAt
          updatedAt
          settings
          defaultValue
          options
          isLabelSyncedWithName
          applicationId
        }
      }
    }
  }
`;

export type CreateManyToManyRelationInput = {
  sourceObjectMetadataId: string;
  targetObjectMetadataId: string;
  sourceFieldLabel: string;
  sourceFieldIcon?: string;
  targetFieldLabel: string;
  targetFieldIcon?: string;
  junctionLabelSingular?: string;
  junctionLabelPlural?: string;
  junctionIcon?: string;
};

type ManyToManyCreatedField = {
  __typename?: string;
  id: string;
  type: string;
  name: string;
  label: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean | null;
  isUnique?: boolean | null;
  isNullable?: boolean | null;
  createdAt: string;
  updatedAt: string;
  settings?: Record<string, unknown> | null;
  defaultValue?: unknown;
  options?: unknown;
  isLabelSyncedWithName?: boolean | null;
  applicationId?: string | null;
  object?: { id: string } | null;
};

type ManyToManyCreatedJunctionObject = {
  __typename?: string;
  id: string;
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean | null;
  isSystem?: boolean | null;
  isUIEditable?: boolean | null;
  isUICreatable?: boolean | null;
  isSearchable?: boolean | null;
  isLabelSyncedWithName?: boolean | null;
  applicationId?: string | null;
  createdAt: string;
  updatedAt: string;
  labelIdentifierFieldMetadataId?: string | null;
  imageIdentifierFieldMetadataId?: string | null;
  fieldsList?: ManyToManyCreatedField[] | null;
};

type CreateManyToManyRelationMutationData = {
  createManyToManyRelation: {
    sourceField: ManyToManyCreatedField;
    targetField: ManyToManyCreatedField;
    junctionObject: ManyToManyCreatedJunctionObject;
  };
};

export const useCreateManyToManyRelation = () => {
  const [createManyToManyRelationMutation] = useMutation<
    CreateManyToManyRelationMutationData,
    { input: { manyToManyRelation: CreateManyToManyRelationInput } }
  >(CREATE_MANY_TO_MANY_RELATION);

  const client = useApolloClient();
  const { handleMetadataError } = useMetadataErrorHandler();
  const { enqueueErrorSnackBar } = useSnackBar();
  const { addToDraft, replaceDraft, applyChanges } =
    useUpdateMetadataStoreDraft();
  const { loadCurrentUser } = useLoadCurrentUser();

  const createManyToManyRelation = async (
    input: CreateManyToManyRelationInput,
  ): Promise<
    MetadataRequestResult<
      Awaited<ReturnType<typeof createManyToManyRelationMutation>>
    >
  > => {
    try {
      const response = await createManyToManyRelationMutation({
        variables: {
          input: {
            manyToManyRelation: input,
          },
        },
      });

      const created = response.data?.createManyToManyRelation;

      if (isDefined(created)) {
        const {
          __typename: _junctionTypename,
          fieldsList,
          ...junctionObjectData
        } = created.junctionObject;

        addToDraft({
          key: 'objectMetadataItems',
          items: [junctionObjectData as FlatObjectMetadataItem],
        });

        const junctionFields = (fieldsList ?? []).map(
          (field: ManyToManyCreatedField) => {
            const { __typename: _fieldTypename, ...fieldData } = field;

            return {
              ...fieldData,
              objectMetadataId: created.junctionObject.id,
            } as FlatFieldMetadataItem;
          },
        );

        const sourceField = created.sourceField;
        const targetField = created.targetField;

        const {
          __typename: _sourceTypename,
          object: sourceObject,
          ...sourceFieldData
        } = sourceField;
        const {
          __typename: _targetTypename,
          object: targetObject,
          ...targetFieldData
        } = targetField;

        addToDraft({
          key: 'fieldMetadataItems',
          items: [
            ...junctionFields,
            {
              ...sourceFieldData,
              objectMetadataId:
                sourceObject?.id ?? input.sourceObjectMetadataId,
            } as FlatFieldMetadataItem,
            {
              ...targetFieldData,
              objectMetadataId:
                targetObject?.id ?? input.targetObjectMetadataId,
            } as FlatFieldMetadataItem,
          ],
        });

        applyChanges();

        await client.query({
          query: ObjectMetadataItemsDocument,
          fetchPolicy: 'network-only',
        });

        const [viewsResult, navItemsResult, commandMenuItemsResult] =
          await Promise.all([
            client.query({
              query: FindManyViewsDocument,
              variables: { objectMetadataId: created.junctionObject.id },
              fetchPolicy: 'network-only',
            }),
            client.query({
              query: FindManyNavigationMenuItemsDocument,
              fetchPolicy: 'network-only',
            }),
            client.query({
              query: FindManyCommandMenuItemsDocument,
              fetchPolicy: 'network-only',
            }),
          ]);

        const fetchedViews = viewsResult.data?.getViews ?? [];
        const {
          flatViews,
          flatViewFields,
          flatViewFilters,
          flatViewSorts,
          flatViewGroups,
          flatViewFilterGroups,
          flatViewFieldGroups,
        } = splitViewWithRelated(fetchedViews);

        addToDraft({ key: 'views', items: flatViews });
        addToDraft({ key: 'viewFields', items: flatViewFields });
        addToDraft({ key: 'viewFilters', items: flatViewFilters });
        addToDraft({ key: 'viewSorts', items: flatViewSorts });
        addToDraft({ key: 'viewGroups', items: flatViewGroups });
        addToDraft({ key: 'viewFilterGroups', items: flatViewFilterGroups });
        addToDraft({ key: 'viewFieldGroups', items: flatViewFieldGroups });

        replaceDraft(
          'navigationMenuItems',
          navItemsResult.data?.navigationMenuItems ?? [],
        );
        replaceDraft(
          'commandMenuItems',
          commandMenuItemsResult.data?.commandMenuItems ?? [],
        );

        applyChanges();
        await loadCurrentUser();
      }

      return {
        status: 'successful',
        response,
      };
    } catch (error) {
      if (CombinedGraphQLErrors.is(error)) {
        handleMetadataError(error, {
          primaryMetadataName: 'fieldMetadata',
          operationType: CrudOperationType.CREATE,
        });
      } else {
        enqueueErrorSnackBar({ message: t`An error occurred.` });
      }

      return {
        status: 'failed',
        error,
      };
    }
  };

  return {
    createManyToManyRelation,
  };
};
