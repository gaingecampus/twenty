import { useDeleteOneFieldMetadataItem } from '@/object-metadata/hooks/useDeleteOneFieldMetadataItem';
import { useFieldMetadataItem } from '@/object-metadata/hooks/useFieldMetadataItem';
import { useGetIsMetadataItemCustom } from '@/object-metadata/hooks/useGetIsMetadataItemCustom';
import { useGetRelationMetadata } from '@/object-metadata/hooks/useGetRelationMetadata';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { isDDLLockedState } from '@/client-config/states/isDDLLockedState';
import { isObjectMetadataReadOnly } from '@/object-record/read-only/utils/isObjectMetadataReadOnly';
import { hasJunctionConfig } from '@/object-record/record-field/ui/utils/junction/hasJunctionConfig';
import { getJunctionConfig } from '@/object-record/record-field/ui/utils/junction/getJunctionConfig';
import { SettingsItemTypeTag } from '@/settings/components/SettingsItemTypeTag';
import { SettingsNameCellSecondaryLabel } from '@/settings/components/SettingsNameCellSecondaryLabel';
import { RELATION_TYPES } from '@/settings/data-model/constants/RelationTypes';
import { SETTINGS_MANY_TO_MANY_RELATION_TYPE } from '@/settings/data-model/constants/SettingsRelationType';
import { SETTINGS_RELATION_TYPES } from '@/settings/data-model/constants/SettingsRelationTypes';
import { SettingsObjectFieldInactiveActionDropdown } from '@/settings/data-model/object-details/components/SettingsObjectFieldDisabledActionDropdown';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { styled } from '@linaria/react';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FieldMetadataType, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import {
  IconChevronRight,
  IconRelationManyToMany,
  useIcons,
} from 'twenty-ui/icon';
import { UndecoratedLink } from 'twenty-ui/navigation';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

type SettingsObjectRelationItemTableRowProps = {
  fieldMetadataItem: FieldMetadataItem;
  objectMetadataItem: EnrichedObjectMetadataItem;
};

export const OBJECT_RELATION_TABLE_ROW_GRID_TEMPLATE_COLUMNS =
  'minmax(0, 1fr) 148px 148px 36px';

const StyledNameContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledNameLabel = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledIconChevronRightContainer = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
`;

const StyledRelationType = styled.div`
  align-items: center;
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledLinkContainer = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  > a {
    color: ${themeCssVariables.font.color.primary};
    overflow: hidden;
    text-decoration: underline;
    text-decoration-color: ${themeCssVariables.border.color.strong};
    text-overflow: ellipsis;
    text-underline-offset: 2px;
    white-space: nowrap;

    &:hover {
      color: ${themeCssVariables.color.blue};
      text-decoration-color: ${themeCssVariables.color.blue};
    }
  }
`;

export const SettingsObjectRelationItemTableRow = ({
  fieldMetadataItem,
  objectMetadataItem,
}: SettingsObjectRelationItemTableRowProps) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useLingui();
  const navigate = useNavigateSettings();
  const { getIcon } = useIcons();

  const getIsMetadataItemCustom = useGetIsMetadataItemCustom();

  const Icon = getIcon(fieldMetadataItem.icon);

  const getRelationMetadata = useGetRelationMetadata();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { relationObjectMetadataItem, relationType } =
    useMemo(
      () => getRelationMetadata({ fieldMetadataItem }),
      [fieldMetadataItem, getRelationMetadata],
    ) ?? {};

  const isJunctionRelation = hasJunctionConfig(fieldMetadataItem.settings);

  const junctionFinalTargetObjectMetadataItem = useMemo(() => {
    if (!isJunctionRelation || !isDefined(relationObjectMetadataItem?.id)) {
      return undefined;
    }

    const junctionConfig = getJunctionConfig({
      settings: fieldMetadataItem.settings,
      relationObjectMetadataId: relationObjectMetadataItem.id,
      sourceObjectMetadataId: objectMetadataItem.id,
      objectMetadataItems,
    });

    const targetObjectMetadataId =
      junctionConfig?.targetFields?.[0]?.relation?.targetObjectMetadata.id;

    if (!isDefined(targetObjectMetadataId)) {
      return undefined;
    }

    return objectMetadataItems.find(
      (item) => item.id === targetObjectMetadataId,
    );
  }, [
    fieldMetadataItem.settings,
    isJunctionRelation,
    objectMetadataItem.id,
    objectMetadataItems,
    relationObjectMetadataItem?.id,
  ]);

  const isDDLLocked = useAtomStateValue(isDDLLockedState);

  const readonly =
    isObjectMetadataReadOnly({
      objectMetadataItem,
    }) || isDDLLocked;

  const { activateMetadataField } = useFieldMetadataItem();
  const { deleteOneFieldMetadataItem } = useDeleteOneFieldMetadataItem();

  const linkToNavigate = getSettingsPath(SettingsPath.ObjectFieldEdit, {
    objectNamePlural: objectMetadataItem.namePlural,
    fieldName: fieldMetadataItem.name,
  });

  // oxlint-disable-next-line twenty/no-navigate-prefer-link
  const navigateToFieldEdit = () =>
    navigate(SettingsPath.ObjectFieldEdit, {
      objectNamePlural: objectMetadataItem.namePlural,
      fieldName: fieldMetadataItem.name,
    });

  const isMorphRelation =
    fieldMetadataItem.type === FieldMetadataType.MORPH_RELATION;

  const morphRelationCount = fieldMetadataItem.morphRelations?.length ?? 0;
  const morphRelationTargetLabel =
    morphRelationCount === 1 ? t`1 Object` : t`${morphRelationCount} Objects`;
  const morphRelationFieldLabel = fieldMetadataItem.label;
  const displayRelationType = isMorphRelation
    ? fieldMetadataItem.morphRelations?.[0]?.type
    : relationType;

  const relationTypeLabel = (() => {
    if (isJunctionRelation) {
      return SETTINGS_RELATION_TYPES[SETTINGS_MANY_TO_MANY_RELATION_TYPE].label;
    }
    if (isDefined(displayRelationType) === true) {
      return RELATION_TYPES[displayRelationType].label;
    }
    return '';
  })();

  const RelationIcon = isJunctionRelation
    ? SETTINGS_RELATION_TYPES[SETTINGS_MANY_TO_MANY_RELATION_TYPE].Icon
    : displayRelationType
      ? RELATION_TYPES[displayRelationType].Icon
      : undefined;

  const NameIcon =
    isMorphRelation || isJunctionRelation ? IconRelationManyToMany : Icon;

  const displayedRelationObjectMetadataItem =
    junctionFinalTargetObjectMetadataItem ?? relationObjectMetadataItem;

  const isDisplayedRelatedObjectLinkable = isDefined(
    displayedRelationObjectMetadataItem?.namePlural,
  );

  const targetObjectLabel = isMorphRelation
    ? morphRelationTargetLabel
    : isDisplayedRelatedObjectLinkable &&
        isDefined(displayedRelationObjectMetadataItem)
      ? displayedRelationObjectMetadataItem.labelPlural
      : fieldMetadataItem.label;

  const fieldLabelSubtitle = isMorphRelation
    ? morphRelationFieldLabel
    : fieldMetadataItem.label;

  const shouldDisplayFieldLabelAsSubtitle =
    isMorphRelation || isDefined(displayedRelationObjectMetadataItem);

  return (
    <TableRow
      gridTemplateColumns={OBJECT_RELATION_TABLE_ROW_GRID_TEMPLATE_COLUMNS}
      // The row can't be a Link: it contains a nested link to the related
      // object, and <a> inside <a> is invalid HTML (React 19 errors on it).
      // oxlint-disable-next-line twenty/no-navigate-prefer-link
      onClick={navigateToFieldEdit}
      cursor="pointer"
    >
      <TableCell
        color={themeCssVariables.font.color.primary}
        gap={themeCssVariables.spacing[2]}
      >
        {isDefined(NameIcon) && (
          <NameIcon
            style={{
              minWidth: theme.icon.size.md,
            }}
            size={theme.icon.size.md}
            stroke={theme.icon.stroke.sm}
          />
        )}
        <StyledNameContainer>
          {isDisplayedRelatedObjectLinkable &&
          isDefined(displayedRelationObjectMetadataItem) ? (
            <StyledLinkContainer>
              <Link
                to={getSettingsPath(SettingsPath.ObjectDetail, {
                  objectNamePlural:
                    displayedRelationObjectMetadataItem.namePlural,
                })}
                onClick={(event) => event.stopPropagation()}
                title={targetObjectLabel}
              >
                {targetObjectLabel}
              </Link>
            </StyledLinkContainer>
          ) : (
            <StyledNameLabel title={targetObjectLabel}>
              {targetObjectLabel}
            </StyledNameLabel>
          )}
          {shouldDisplayFieldLabelAsSubtitle && (
            <SettingsNameCellSecondaryLabel title={fieldLabelSubtitle}>
              {fieldLabelSubtitle}
            </SettingsNameCellSecondaryLabel>
          )}
          {!fieldMetadataItem.isActive && (
            <SettingsNameCellSecondaryLabel>
              {t`Deactivated`}
            </SettingsNameCellSecondaryLabel>
          )}
        </StyledNameContainer>
      </TableCell>

      <TableCell>
        <SettingsItemTypeTag
          item={{
            isRemote: objectMetadataItem.isRemote,
            applicationId: fieldMetadataItem.applicationId,
          }}
        />
      </TableCell>

      <TableCell>
        <StyledRelationType>
          {RelationIcon && (
            <RelationIcon
              size={theme.icon.size.sm}
              stroke={theme.icon.stroke.sm}
            />
          )}
          {relationTypeLabel}
        </StyledRelationType>
      </TableCell>

      <TableCell
        align="center"
        padding={`0 ${themeCssVariables.spacing[1]} 0 ${themeCssVariables.spacing[2]}`}
      >
        {fieldMetadataItem.isActive ? (
          // The row navigates via onClick (it can't be a Link because it
          // contains a nested link to the related object). This chevron is a
          // real link to the same destination so keyboard users can still reach
          // field edit; stopPropagation avoids firing the row onClick too.
          <UndecoratedLink
            to={linkToNavigate}
            onClick={(event) => event.stopPropagation()}
          >
            <StyledIconChevronRightContainer>
              <IconChevronRight
                size={theme.icon.size.md}
                stroke={theme.icon.stroke.sm}
              />
            </StyledIconChevronRightContainer>
          </UndecoratedLink>
        ) : (
          <SettingsObjectFieldInactiveActionDropdown
            isCustomField={getIsMetadataItemCustom(fieldMetadataItem)}
            readonly={readonly}
            fieldMetadataItemId={fieldMetadataItem.id}
            onEdit={navigateToFieldEdit}
            onActivate={() =>
              activateMetadataField(fieldMetadataItem.id, objectMetadataItem.id)
            }
            onDelete={() =>
              deleteOneFieldMetadataItem({
                idToDelete: fieldMetadataItem.id,
              })
            }
          />
        )}
      </TableCell>
    </TableRow>
  );
};
