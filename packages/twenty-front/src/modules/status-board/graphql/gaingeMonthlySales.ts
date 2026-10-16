import { gql } from '@apollo/client';

export type GaingeMonthlySales = {
  status:
    | 'READY'
    | 'NOT_CONFIGURED'
    | 'FORBIDDEN'
    | 'AUTH_ERROR'
    | 'UNAVAILABLE';
  month: string;
  startDate: string | null;
  endDate: string | null;
  generatedAt: string | null;
  fetchedAt: string | null;
  total: number | null;
  departments: { label: string; amount: number }[];
};

export const GAINGE_MONTHLY_SALES = gql`
  query GaingeMonthlySales($month: String!) {
    gaingeMonthlySales(month: $month) {
      status
      month
      startDate
      endDate
      generatedAt
      fetchedAt
      total
      departments {
        label
        amount
      }
    }
  }
`;

export type GaingeSalesTimeline = GaingeMonthlySales & {
  days:
    | {
        date: string;
        total: number;
        departments: { label: string; amount: number }[];
      }[]
    | null;
};

export const GAINGE_SALES_TIMELINE = gql`
  query GaingeSalesTimeline($month: String!) {
    gaingeSalesTimeline(month: $month) {
      status
      month
      days {
        date
        total
        departments {
          label
          amount
        }
      }
    }
  }
`;
