import { useContext } from 'react';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { transformAggregateRawValueIntoAggregateDisplayValue } from '@/object-record/record-aggregate/utils/transformAggregateRawValueIntoAggregateDisplayValue';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { isFieldRelationRollup } from '@/object-record/record-field/ui/types/guards/isFieldRelationRollup';
import { relationRollupValueFamilyState } from '@/object-record/relation-rollup/states/relationRollupValueFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { UserContext } from '@/users/contexts/UserContext';
import { isDefined } from 'twenty-shared/utils';
import { dateLocaleState } from '~/localization/states/dateLocaleState';

export const RelationRollupFieldDisplay = () => {
  const { fieldDefinition, recordId } = useContext(FieldContext);
  const { numberFormat } = useNumberFormat();
  const { dateFormat, timeFormat, timeZone } = useContext(UserContext);
  const dateLocale = useAtomStateValue(dateLocaleState);

  const viewFieldId = isFieldRelationRollup(fieldDefinition)
    ? fieldDefinition.metadata.viewFieldId
    : '';

  const rollupValue = useAtomFamilyStateValue(
    relationRollupValueFamilyState,
    isDefined(recordId) && viewFieldId !== ''
      ? { recordId, viewFieldId }
      : { recordId: '', viewFieldId: '' },
  );

  if (!isFieldRelationRollup(fieldDefinition) || !isDefined(recordId)) {
    return null;
  }

  if (!isDefined(rollupValue)) {
    return <span>-</span>;
  }

  const aggregateFieldMetadataItem =
    fieldDefinition.metadata.aggregateFieldMetadataItem;

  const aggregateOperation =
    fieldDefinition.metadata.relationRollup.aggregateOperation;

  const displayValue = transformAggregateRawValueIntoAggregateDisplayValue({
    aggregateFieldMetadataItem: aggregateFieldMetadataItem ?? null,
    aggregateOperation,
    aggregateRawValue: rollupValue,
    dateFormat,
    timeFormat,
    timeZone,
    localeCatalog: dateLocale.localeCatalog,
    numberFormat,
  });

  return <span>{displayValue}</span>;
};
