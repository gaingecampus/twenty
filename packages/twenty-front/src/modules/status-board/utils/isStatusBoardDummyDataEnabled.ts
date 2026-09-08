import { getIsDevelopmentEnvironment } from '~/utils/getIsDevelopmentEnvironment';

export const isStatusBoardDummyDataEnabled = () =>
  getIsDevelopmentEnvironment() &&
  new URLSearchParams(window.location.search).get('statusBoardDemo') === 'true';
