import { createContext, type ReactNode } from 'react';

export const IsRecordIndexPageContext = createContext(false);

type RecordIndexPageProviderProps = {
  children: ReactNode;
};

export const RecordIndexPageProvider = ({
  children,
}: RecordIndexPageProviderProps) => {
  return (
    <IsRecordIndexPageContext.Provider value={true}>
      {children}
    </IsRecordIndexPageContext.Provider>
  );
};
