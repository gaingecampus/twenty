import { createContext } from 'react';

export const WidgetHeaderTitleContext = createContext<HTMLSpanElement | null>(
  null,
);
