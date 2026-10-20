import { createContext } from 'react';

// Optional destination for actions owned by a widget's content.
export const WidgetHeaderActionContext = createContext<HTMLDivElement | null>(
  null,
);
