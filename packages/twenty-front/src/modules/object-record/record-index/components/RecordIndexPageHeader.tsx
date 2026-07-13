import { RecordIndexCommandMenu } from '@/command-menu-item/components/RecordIndexCommandMenu';
import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { contextStoreNumberOfSelectedRecordsComponentState } from '@/context-store/states/contextStoreNumberOfSelectedRecordsComponentState';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { RecordIndexPageHeaderIcon } from '@/object-record/record-index/components/RecordIndexPageHeaderIcon';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { SidePanelToggleButton } from '@/side-panel/components/SidePanelToggleButton';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isNonEmptyString } from '@sniptt/guards';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconInfoCircle } from 'twenty-ui/icon';
import { AppTooltip, TooltipDelay } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledTitleWithSelectedRecords = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  padding-right: ${themeCssVariables.spacing['0.5']};
`;

const StyledSelectedRecordsCount = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding-left: ${themeCssVariables.spacing['0.5']};
`;

const StyledTitleWithDescription = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledInfoIcon = styled(IconInfoCircle)`
  color: ${themeCssVariables.font.color.tertiary};
  cursor: default;
  flex-shrink: 0;
`;

export const RecordIndexPageHeader = () => {
  const { findObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();

  const contextStoreNumberOfSelectedRecords = useAtomComponentStateValue(
    contextStoreNumberOfSelectedRecordsComponentState,
  );

  const { formatNumber } = useNumberFormat();

  const { objectNamePlural } = useRecordIndexContextOrThrow();

  const objectMetadataItem =
    findObjectMetadataItemByNamePlural(objectNamePlural);

  const label = objectMetadataItem?.labelPlural ?? objectNamePlural;
  const description = objectMetadataItem?.description;
  const hasDescription = isNonEmptyString(description);
  const tooltipId = isDefined(objectMetadataItem)
    ? `record-index-object-description-${objectMetadataItem.id}`
    : undefined;

  const pageHeaderTitle =
    contextStoreNumberOfSelectedRecords > 0 ? (
      <StyledTitleWithSelectedRecords>
        <StyledTitle>{label}</StyledTitle>
        <>{'->'}</>
        <StyledSelectedRecordsCount>
          {t`${formatNumber(contextStoreNumberOfSelectedRecords)} selected`}
        </StyledSelectedRecordsCount>
      </StyledTitleWithSelectedRecords>
    ) : (
      label
    );

  const titleWithDescription =
    hasDescription && isDefined(tooltipId) ? (
      <StyledTitleWithDescription>
        {pageHeaderTitle}
        <StyledInfoIcon id={tooltipId} size={14} />
        <AppTooltip
          anchorSelect={`#${tooltipId}`}
          content={description}
          place="bottom"
          delay={TooltipDelay.shortDelay}
          positionStrategy="fixed"
        />
      </StyledTitleWithDescription>
    ) : (
      pageHeaderTitle
    );

  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
    MAIN_CONTEXT_STORE_INSTANCE_ID,
  );
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );

  return (
    <PageCardHeader
      icon={
        <RecordIndexPageHeaderIcon objectMetadataItem={objectMetadataItem} />
      }
      title={titleWithDescription}
      actionButton={
        isDefined(contextStoreCurrentViewId) ? (
          <>
            <RecordIndexCommandMenu />
            {!isLayoutCustomizationModeEnabled && <SidePanelToggleButton />}
          </>
        ) : undefined
      }
    />
  );
};
