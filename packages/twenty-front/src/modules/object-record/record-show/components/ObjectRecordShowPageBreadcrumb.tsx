import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { ObjectMetadataIcon } from '@/object-metadata/components/ObjectMetadataIcon';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useRecordShowPagePagination } from '@/object-record/record-show/hooks/useRecordShowPagePagination';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledEditableTitleContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  font-size: 16px;
  gap: ${themeCssVariables.spacing[1]};
  line-height: 24px;
  min-height: 32px;
  overflow-x: hidden;
  width: 100%;
`;

const StyledEditableTitlePrefix = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[1]};
  white-space: nowrap;
`;

const StyledBreadcrumbPrefixObjectIcon = styled.div`
  display: flex;
  flex-shrink: 0;
  opacity: 0.64;
`;

const StyledPaginationInformation = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
`;

export const ObjectRecordShowPageBreadcrumb = ({
  objectNameSingular,
  objectRecordId,
  objectLabel,
  labelIdentifierFieldMetadataItem,
}: {
  objectNameSingular: string;
  objectRecordId: string;
  objectLabel: string;
  labelIdentifierFieldMetadataItem?: FieldMetadataItem;
}) => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { loading } = useFindOneRecord({
    objectNameSingular,
    objectRecordId,
    recordGqlFields: {
      [labelIdentifierFieldMetadataItem?.name ?? 'name']: true,
    },
  });

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const { navigateToIndexView, rankInView, totalCount } =
    useRecordShowPagePagination(objectNameSingular, objectRecordId);

  const { formatNumber } = useNumberFormat();

  if (!loading && isInitialLoad) {
    setIsInitialLoad(false);
  }

  if (isInitialLoad && loading) {
    return null;
  }

  return (
    <StyledEditableTitleContainer data-testid="top-bar-title">
      <StyledEditableTitlePrefix
        onClick={() => {
          navigateToIndexView();
        }}
      >
        <StyledBreadcrumbPrefixObjectIcon>
          <ObjectMetadataIcon
            objectMetadataItem={objectMetadataItem}
            size={18}
          />
        </StyledBreadcrumbPrefixObjectIcon>
        {objectLabel}
      </StyledEditableTitlePrefix>
      <StyledPaginationInformation>
        {`(${formatNumber(rankInView + 1)}/${formatNumber(totalCount)})`}
      </StyledPaginationInformation>
    </StyledEditableTitleContainer>
  );
};
