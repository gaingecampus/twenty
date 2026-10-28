import { WidgetHeaderTitleContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderTitleContext';
import { WidgetHeaderActionContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderActionContext';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { t } from '@lingui/core/macro';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { PageLayoutWidgetForbiddenDisplay } from '@/page-layout/widgets/components/PageLayoutWidgetForbiddenDisplay';
import { PageLayoutWidgetInvalidConfigDisplay } from '@/page-layout/widgets/components/PageLayoutWidgetInvalidConfigDisplay';
import { WidgetContentRenderer } from '@/page-layout/widgets/components/WidgetContentRenderer';
import { WidgetComponentInstanceContext } from '@/page-layout/widgets/states/contexts/WidgetComponentInstanceContext';
import { type WidgetAccessDenialInfo } from '@/page-layout/widgets/types/WidgetAccessDenialInfo';
import { type WidgetAction } from '@/page-layout/widgets/types/WidgetAction';
import { type WidgetCardVariant } from '@/page-layout/widgets/types/WidgetCardVariant';
import { WidgetCard } from '@/page-layout/widgets/widget-card/components/WidgetCard';
import { WidgetCardContent } from '@/page-layout/widgets/widget-card/components/WidgetCardContent';
import { WidgetCardHeader } from '@/page-layout/widgets/widget-card/components/WidgetCardHeader';
import { styled } from '@linaria/react';
import { type MouseEvent, useContext, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { IconLock } from 'twenty-ui/icon';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import {
  WidgetConfigurationType,
  WidgetType,
} from '~/generated-metadata/graphql';

const StyledNoAccessContainer = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
`;

const StyledWidgetCard = styled(WidgetCard)`
  &.message-list-section {
    background: ${themeCssVariables.background.tertiary};
    border: none;
    border-radius: ${themeCssVariables.border.radius.md};
    gap: ${themeCssVariables.spacing[2]};
    padding: ${themeCssVariables.spacing[4]};
  }
`;

type WidgetCardShellProps = {
  widget: PageLayoutWidget;
  variant: WidgetCardVariant;
  isEditable: boolean;
  isEditing: boolean;
  isDragging: boolean;
  isResizing: boolean;
  isLastWidget: boolean;
  showHeader: boolean;
  hasAccess: boolean;
  restriction: WidgetAccessDenialInfo;
  actions: WidgetAction[];
  isInVerticalListTab: boolean;
  isMobile: boolean;
  isReorderEnabled: boolean;
  isDeletingWidgetEnabled: boolean;
  onClick?: () => void;
  onRemove: (e?: MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export const WidgetCardShell = ({
  widget,
  variant,
  isEditable,
  isEditing,
  isDragging,
  isResizing,
  isLastWidget,
  showHeader,
  hasAccess,
  restriction,
  actions,
  isInVerticalListTab,
  isMobile,
  isReorderEnabled,
  isDeletingWidgetEnabled,
  onClick,
  onRemove,
  onMouseEnter,
  onMouseLeave,
}: WidgetCardShellProps) => {
  const { theme } = useContext(ThemeContext);
  const [headerActionTarget, setHeaderActionTarget] =
    useState<HTMLDivElement | null>(null);
  const [headerTitleTarget, setHeaderTitleTarget] =
    useState<HTMLSpanElement | null>(null);
  const { objectMetadataItems } = useObjectMetadataItems();
  const fieldMetadataId =
    widget.configuration.configurationType === WidgetConfigurationType.FIELD &&
    'fieldMetadataId' in widget.configuration
      ? widget.configuration.fieldMetadataId
      : undefined;
  const messageListField =
    fieldMetadataId === undefined
      ? undefined
      : objectMetadataItems
          .find((object) => object.nameSingular === 'messageList')
          ?.fields.find(
            (field) =>
              field.id === fieldMetadataId || field.name === fieldMetadataId,
          )?.name;
  const campaignMetadata = objectMetadataItems.find(
    (object) => object.nameSingular === 'messageCampaign',
  );
  const campaignField =
    fieldMetadataId === undefined
      ? undefined
      : campaignMetadata?.fields.find(
          (field) =>
            field.id === fieldMetadataId ||
            (campaignMetadata.id === widget.objectMetadataId &&
              field.name === fieldMetadataId),
        )?.name;
  const isCampaignDelivery =
    campaignField === 'recipients' || campaignField === 'messages';
  const isMessageListMembers = messageListField === 'members';
  const isMessageListCampaigns = messageListField === 'campaigns';
  const isMessageListTable = isMessageListMembers || isMessageListCampaigns;

  const dataTestId =
    widget.type === WidgetType.FIELDS ? 'record-fields-widget' : widget.id;

  return (
    <WidgetComponentInstanceContext.Provider value={{ instanceId: widget.id }}>
      <StyledWidgetCard
        headerLess={!showHeader}
        variant={variant}
        isEditable={isEditable}
        onClick={onClick}
        isEditing={isEditing}
        isDragging={isDragging}
        isResizing={isResizing}
        isLastWidget={isLastWidget}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-widget-id={widget.id}
        data-testid={dataTestId}
        className={
          isMessageListTable && !isEditable
            ? 'widget message-list-section'
            : 'widget'
        }
      >
        {showHeader && (
          <WidgetCardHeader
            actionSlotRef={setHeaderActionTarget}
            titleSlotRef={
              isMessageListTable || isCampaignDelivery
                ? setHeaderTitleTarget
                : undefined
            }
            wrapActions={isMessageListTable}
            widgetId={widget.id}
            variant={variant}
            isInEditMode={isEditable}
            isResizing={isResizing}
            isReorderEnabled={isReorderEnabled}
            isDeletingWidgetEnabled={isDeletingWidgetEnabled}
            title={
              isCampaignDelivery
                ? '수신자별 발송 결과'
                : isMessageListMembers
                  ? t`고객 분류`
                  : widget.title
            }
            titleHelp={
              isCampaignDelivery
                ? '한 행은 수신자에게 보내는 메시지 한 건입니다. 발송 완료는 메일 서버에 전달된 상태이며, 읽음이나 최종 수신을 보장하지 않습니다. 기록 시각은 발송 처리 기록이 생성된 시각입니다.'
                : isMessageListMembers
                  ? t`이메일이 없거나 수신을 거부한 고객은 심방콜 발송 시 제외됩니다.`
                  : undefined
            }
            onRemove={onRemove}
            actions={
              isMessageListCampaigns || isCampaignDelivery
                ? actions.filter((action) => action.id !== 'see-all')
                : actions
            }
            forbiddenDisplay={
              !hasAccess && (
                <PageLayoutWidgetForbiddenDisplay
                  widgetId={widget.id}
                  restriction={restriction}
                />
              )
            }
          />
        )}

        <WidgetCardContent
          variant={variant}
          frameless={(isMessageListTable || isCampaignDelivery) && !isEditable}
          hasHeader={showHeader}
          isEditable={isEditable}
          isInVerticalListTab={isInVerticalListTab}
          isMobile={isMobile}
          hasInteractiveContent={widget.type === WidgetType.RECORD_TABLE}
        >
          {hasAccess ? (
            <ErrorBoundary
              FallbackComponent={PageLayoutWidgetInvalidConfigDisplay}
              resetKeys={[
                widget.id,
                widget.configuration,
                widget.objectMetadataId,
              ]}
            >
              <WidgetHeaderActionContext.Provider
                value={showHeader ? headerActionTarget : null}
              >
                <WidgetHeaderTitleContext.Provider
                  value={showHeader ? headerTitleTarget : null}
                >
                  <WidgetContentRenderer widget={widget} />
                </WidgetHeaderTitleContext.Provider>
              </WidgetHeaderActionContext.Provider>
            </ErrorBoundary>
          ) : (
            <StyledNoAccessContainer>
              <IconLock
                color={theme.font.color.tertiary}
                stroke={theme.icon.stroke.sm}
              />
            </StyledNoAccessContainer>
          )}
        </WidgetCardContent>
      </StyledWidgetCard>
    </WidgetComponentInstanceContext.Provider>
  );
};
