import { Controller, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { StyledContainer } from '@/keyboard-shortcut-menu/components/KeyboardShortcutMenuStyles';
import { SettingsMorphRelationMultiSelect } from '@/settings/components/SettingsMorphRelationMultiSelect';
import { FIELD_NAME_MAXIMUM_LENGTH } from '@/settings/data-model/constants/FieldNameMaximumLength';
import { SETTINGS_MANY_TO_MANY_RELATION_TYPE } from '@/settings/data-model/constants/SettingsRelationType';
import { SETTINGS_RELATION_TYPES } from '@/settings/data-model/constants/SettingsRelationTypes';
import { type SettingsRelationType } from '@/settings/data-model/types/SettingsRelationType';
import { isSettingsManyToManyRelationType } from '@/settings/data-model/utils/isSettingsManyToManyRelationType';
import { useFieldMetadataItemDisableFieldEdition } from '@/settings/data-model/fields/forms/morph-relation/hooks/useFieldMetadataItemDisableFieldEdition';
import { useRelationSettingsFormDefaultValuesTargetFieldMetadata } from '@/settings/data-model/fields/forms/morph-relation/hooks/useRelationSettingsFormDefaultValuesTargetFieldMetadata';
import { useRelationSettingsFormInitialTargetObjectMetadatas } from '@/settings/data-model/fields/forms/morph-relation/hooks/useRelationSettingsFormInitialTargetObjectMetadatas';

import { useFieldMetadataItemById } from '@/object-metadata/hooks/useFieldMetadataItemById';
import { hasJunctionConfig } from '@/object-record/record-field/ui/utils/junction/hasJunctionConfig';

import { IconPicker } from '@/ui/input/components/IconPicker';
import { Select } from '@/ui/input/components/Select';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { FeatureFlagKey, RelationType } from '~/generated-metadata/graphql';

const StyledSelectsContainer = styled.div<{ isMobile: boolean }>`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: ${({ isMobile }) => (isMobile ? '1fr' : '1fr 1fr')};
  margin-bottom: ${themeCssVariables.spacing[4]};
`;
const StyledInputsLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  display: block;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledInputsContainer = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const SETTINGS_RELATION_TYPE_OPTIONS = Object.entries(
  SETTINGS_RELATION_TYPES,
).map(([value, { label, Icon }]) => ({
  label,
  value: value as SettingsRelationType,
  Icon,
}));

export const settingsDataModelFieldMorphRelationFormSchema = z.object({
  morphRelationObjectMetadataIds: z.array(z.uuid()).min(1),
  relationType: z.enum([
    RelationType.ONE_TO_MANY,
    RelationType.MANY_TO_ONE,
    SETTINGS_MANY_TO_MANY_RELATION_TYPE,
  ]),
  targetFieldLabel: z.string().min(1),
  iconOnDestination: z.string().min(1),
  junctionLabelSingular: z.string().optional(),
  settings: z
    .object({
      junctionTargetFieldId: z.string().optional(),
    })
    .catchall(z.unknown())
    .optional(),
});

export type SettingsDataModelFieldMorphRelationFormValues = z.infer<
  typeof settingsDataModelFieldMorphRelationFormSchema
>;

type SettingsDataModelFieldRelationFormProps = {
  sourceObjectMetadataId: string;
  existingFieldMetadataId: string;
  disabled?: boolean;
};

export const SettingsDataModelFieldRelationForm = ({
  existingFieldMetadataId,
  sourceObjectMetadataId,
  disabled = false,
}: SettingsDataModelFieldRelationFormProps) => {
  const { t } = useLingui();
  const { control, watch, setValue } = useFormContext();
  const isJunctionRelationsEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_JUNCTION_RELATIONS_ENABLED,
  );

  const currentIds = watch('morphRelationObjectMetadataIds') as
    | string[]
    | undefined;

  const relationType = watch('relationType') as
    | SettingsRelationType
    | undefined;
  const isManyToMany = isSettingsManyToManyRelationType(relationType);

  const isSelfInDestinationForMorphRelation =
    isDefined(currentIds) &&
    currentIds.length > 1 &&
    currentIds.includes(sourceObjectMetadataId);

  const isSelfManyToMany =
    isManyToMany &&
    isDefined(currentIds) &&
    currentIds.includes(sourceObjectMetadataId);

  const { fieldMetadataItem: existingFieldMetadataItem } =
    useFieldMetadataItemById(existingFieldMetadataId);

  const disableRelationEdition = isDefined(existingFieldMetadataItem);
  const disableFieldEdition = useFieldMetadataItemDisableFieldEdition(
    existingFieldMetadataItem,
  );

  const initialRelationObjectMetadataItems =
    useRelationSettingsFormInitialTargetObjectMetadatas({
      fieldMetadataItem: existingFieldMetadataItem,
      sourceObjectMetadataId,
    });

  const hasExistingJunctionConfig = hasJunctionConfig(
    existingFieldMetadataItem?.settings,
  );

  const initialRelationType: SettingsRelationType = hasExistingJunctionConfig
    ? SETTINGS_MANY_TO_MANY_RELATION_TYPE
    : (existingFieldMetadataItem?.relation?.type ?? RelationType.ONE_TO_MANY);

  const { label: defaultLabelOnDestination, icon: defaultIconOnDestination } =
    useRelationSettingsFormDefaultValuesTargetFieldMetadata({
      fieldMetadataItem: existingFieldMetadataItem,
      objectMetadataItem: initialRelationObjectMetadataItems[0],
      relationType:
        initialRelationType === SETTINGS_MANY_TO_MANY_RELATION_TYPE
          ? RelationType.ONE_TO_MANY
          : initialRelationType,
    });

  const initialMorphRelationsObjectMetadataIds =
    initialRelationObjectMetadataItems.map(
      (relationObjectMetadataItem) => relationObjectMetadataItem.id,
    );
  const isMobile = useIsMobile();

  const relationTypeOptions = isJunctionRelationsEnabled
    ? SETTINGS_RELATION_TYPE_OPTIONS
    : SETTINGS_RELATION_TYPE_OPTIONS.filter(
        (option) => option.value !== SETTINGS_MANY_TO_MANY_RELATION_TYPE,
      );

  return (
    <StyledContainer>
      <StyledSelectsContainer isMobile={isMobile}>
        <Controller
          name="relationType"
          control={control}
          defaultValue={initialRelationType}
          render={({ field: { onChange, value } }) => (
            <Select
              label={t`Relation type`}
              dropdownId="relation-type-select"
              fullWidth
              disabled={disabled || disableRelationEdition}
              value={value}
              options={relationTypeOptions}
              onChange={(nextValue) => {
                onChange(nextValue);
                if (
                  isSettingsManyToManyRelationType(nextValue) &&
                  isDefined(currentIds) &&
                  currentIds.length > 1
                ) {
                  setValue('morphRelationObjectMetadataIds', [currentIds[0]]);
                }
              }}
            />
          )}
        />

        <Controller
          name="morphRelationObjectMetadataIds"
          control={control}
          defaultValue={initialMorphRelationsObjectMetadataIds}
          render={({ field: { onChange, value } }) => (
            <SettingsMorphRelationMultiSelect
              label={t`Object destination`}
              dropdownId="object-destination-select"
              fullWidth
              disabled={disableRelationEdition}
              selectedObjectMetadataIds={value}
              withSearchInput={true}
              onChange={(nextIds) => {
                if (isManyToMany && nextIds.length > 1) {
                  onChange([nextIds[nextIds.length - 1]]);
                  return;
                }
                onChange(nextIds);
              }}
              error={
                isSelfManyToMany
                  ? t`Many-to-many relations cannot point to the same object.`
                  : isSelfInDestinationForMorphRelation
                    ? t`Relations cannot include the source object when multiple destinations are selected.`
                    : isManyToMany && (value?.length ?? 0) > 1
                      ? t`Many-to-many relations support a single destination object.`
                      : undefined
              }
            />
          )}
        />
      </StyledSelectsContainer>
      <StyledInputsLabel>
        {isManyToMany
          ? t`Field on destination object`
          : t`Field on destination`}
      </StyledInputsLabel>
      <StyledInputsContainer>
        <Controller
          name="iconOnDestination"
          control={control}
          defaultValue={defaultIconOnDestination}
          render={({ field: { onChange, value } }) => (
            <IconPicker
              disabled={disableFieldEdition}
              dropdownId="field-destination-icon-picker"
              selectedIconKey={value ?? undefined}
              onChange={({ iconKey }) => onChange(iconKey)}
              variant="primary"
            />
          )}
        />
        <Controller
          name="targetFieldLabel"
          control={control}
          defaultValue={defaultLabelOnDestination}
          render={({ field: { onChange, value } }) => (
            <SettingsTextInput
              instanceId="relation-field-label"
              disabled={disableFieldEdition}
              placeholder={t`Field name`}
              value={value}
              onChange={onChange}
              fullWidth
              maxLength={FIELD_NAME_MAXIMUM_LENGTH}
            />
          )}
        />
      </StyledInputsContainer>
      {isManyToMany && !disableRelationEdition && (
        <>
          <StyledInputsLabel>{t`Junction object name (optional)`}</StyledInputsLabel>
          <StyledInputsContainer>
            <Controller
              name="junctionLabelSingular"
              control={control}
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <SettingsTextInput
                  instanceId="junction-object-label"
                  placeholder={t`Auto-generated if empty`}
                  value={value}
                  onChange={onChange}
                  fullWidth
                  maxLength={FIELD_NAME_MAXIMUM_LENGTH}
                />
              )}
            />
          </StyledInputsContainer>
        </>
      )}
    </StyledContainer>
  );
};
