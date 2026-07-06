import { gql } from '@apollo/client';

export const RELATION_ROLLUP_AGGREGATES = gql`
  query RelationRollupAggregates(
    $parentObjectNameSingular: String!
    $parentRecordIds: [UUID!]!
    $rollups: [RelationRollupAggregateInput!]!
  ) {
    relationRollupAggregates(
      parentObjectNameSingular: $parentObjectNameSingular
      parentRecordIds: $parentRecordIds
      rollups: $rollups
    ) {
      rollupKey
      values {
        parentRecordId
        aggregateFieldKey
        value
      }
    }
  }
`;
