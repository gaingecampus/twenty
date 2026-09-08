import { type StatusBoardDummyDataset } from '@/status-board/utils/buildStatusBoardDummyDataset';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { createContext, useContext } from 'react';

export type StatusBoardDummyDataValue = {
  enabled: boolean;
  members: ObjectRecord[];
  groups: ObjectRecord[];
  dataset: StatusBoardDummyDataset;
};

export const EMPTY_STATUS_BOARD_DUMMY_DATASET: StatusBoardDummyDataset = {};

export const StatusBoardDummyDataContext =
  createContext<StatusBoardDummyDataValue>({
    enabled: false,
    members: [],
    groups: [],
    dataset: EMPTY_STATUS_BOARD_DUMMY_DATASET,
  });

export const useStatusBoardDummyData = () => {
  return useContext(StatusBoardDummyDataContext);
};
