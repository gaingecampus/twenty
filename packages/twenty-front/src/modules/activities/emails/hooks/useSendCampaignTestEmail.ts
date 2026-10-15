import { SEND_EMAIL } from '@/activities/emails/graphql/mutations/sendEmail';
import { useMutation } from '@apollo/client/react';
import { useRef, useState } from 'react';
import { type EmailAttachment } from 'twenty-shared/types';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import {
  type SendEmailMutation,
  type SendEmailMutationVariables,
} from '~/generated-metadata/graphql';

type TestEmailInput = {
  connectedAccountId: string;
  to: string;
  subject: string;
  body: string;
  files: EmailAttachment[];
};

type TestEmailResult = {
  recipient: string;
  subject: string;
  success: boolean;
  error?: string;
};

export const useSendCampaignTestEmail = () => {
  const [sendEmail, { loading }] = useMutation<
    SendEmailMutation,
    SendEmailMutationVariables
  >(SEND_EMAIL);
  const [result, setResult] = useState<TestEmailResult | null>(null);
  // Prevent double clicks before Apollo's loading state is rendered.
  // oxlint-disable-next-line twenty/no-state-useref
  const sending = useRef(false);

  const sendTest = async (input: TestEmailInput) => {
    if (sending.current) return;
    const recipient = input.to.trim();
    if (!z.email().safeParse(recipient).success) {
      setResult({
        recipient,
        subject: input.subject,
        success: false,
        error: t`테스트 이메일 주소 한 개를 정확히 입력하세요.`,
      });
      return;
    }
    sending.current = true;
    setResult(null);
    try {
      const response = await sendEmail({
        variables: {
          input: {
            ...input,
            to: recipient,
            subject: `[테스트] ${input.subject}`,
          },
        },
      });
      const output = response.data?.sendEmail;
      setResult({
        recipient,
        subject: input.subject,
        success: output?.success === true,
        error: output?.success
          ? undefined
          : (output?.error ?? t`발송 결과를 확인하지 못했습니다.`),
      });
    } catch (error) {
      setResult({
        recipient,
        subject: input.subject,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : t`테스트 발송에 실패했습니다.`,
      });
    } finally {
      sending.current = false;
    }
  };

  return { sendTest, loading, result };
};
