import { type ConfigVariable } from '~/generated-admin/graphql';
import { ConfigVariableTable } from '@/settings/config-variables/components/ConfigVariableTable';
import { getSettingsPath } from 'twenty-shared/utils';
import { SettingsPath } from 'twenty-shared/types';

type SettingsAdminConfigVariablesTableProps = {
  variables: ConfigVariable[];
};

export const SettingsAdminConfigVariablesTable = ({
  variables,
}: SettingsAdminConfigVariablesTableProps) => {
  const configVariables = variables.map((variable) => ({
    name:
      variable.name === 'GAINGE_SALES_ALLOW_ALL_MEMBERS'
        ? '전사 매출 조회 범위'
        : variable.name,
    description: variable.description,
    value:
      variable.name === 'GAINGE_SALES_ALLOW_ALL_MEMBERS'
        ? variable.value === true
          ? '전체 멤버 허용'
          : '지정 멤버만 허용'
        : variable.value === ''
          ? 'null'
          : variable.isSensitive
            ? '••••••'
            : typeof variable.value === 'boolean'
              ? variable.value
                ? 'true'
                : 'false'
              : typeof variable.value === 'object' && variable.value !== null
                ? JSON.stringify(variable.value)
                : variable.value,
    to: getSettingsPath(SettingsPath.AdminPanelConfigVariableDetails, {
      variableName: variable.name,
    }),
  }));

  return <ConfigVariableTable configVariables={configVariables} />;
};
