import { useMutation, useQuery } from '@apollo/client/react';
import gql from 'graphql-tag';

const GET_EMAIL_SIGNATURE = gql`
  query MyEmailSignature {
    myEmailSignature
  }
`;
const SAVE_EMAIL_SIGNATURE = gql`
  mutation SaveMyEmailSignature($html: String!) {
    saveMyEmailSignature(html: $html)
  }
`;

export const useEmailSignature = () => {
  const { data, loading, error } = useQuery<{ myEmailSignature: string }>(
    GET_EMAIL_SIGNATURE,
  );
  const [save, { loading: saving }] = useMutation<
    { saveMyEmailSignature: string },
    { html: string }
  >(SAVE_EMAIL_SIGNATURE);
  const saveSignature = async (html: string) => {
    const result = await save({
      variables: { html },
      update: (cache, response) => {
        if (response.data)
          cache.writeQuery({
            query: GET_EMAIL_SIGNATURE,
            data: { myEmailSignature: response.data.saveMyEmailSignature },
          });
      },
    });
    if (!result.data) throw new Error('서명을 저장하지 못했습니다.');
    return result.data.saveMyEmailSignature;
  };
  return {
    signature: data?.myEmailSignature ?? '',
    loading,
    error,
    saving,
    saveSignature,
  };
};
