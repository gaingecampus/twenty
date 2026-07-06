import { gql } from '@apollo/client';

export const VIEW_FIELD_FRAGMENT = gql`
  fragment ViewFieldFragment on ViewField {
    id
    fieldMetadataId
    viewId
    isVisible
    position
    size
    aggregateOperation
    viewFieldGroupId
    isActive
    relationRollup {
      relationFieldMetadataUniversalIdentifier
      aggregateOperation
      aggregateFieldMetadataUniversalIdentifier
      label
      recordFilters {
        fieldMetadataUniversalIdentifier
        relationTargetFieldMetadataUniversalIdentifier
        operand
        value
        viewFilterGroupId
      }
      recordFilterGroups {
        id
        parentViewFilterGroupId
        logicalOperator
      }
    }
    createdAt
    updatedAt
    deletedAt
  }
`;
