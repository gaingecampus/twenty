import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MailboxParticipantDTO {
  @Field(() => String)
  role: string;
  @Field(() => String, { nullable: true })
  handle: string | null;
  @Field(() => String, { nullable: true })
  displayName: string | null;
}

@ObjectType()
export class MailboxMessageDTO {
  @Field(() => String)
  id: string;
  @Field(() => String, { nullable: true })
  subject: string | null;
  @Field(() => String, { nullable: true })
  text: string | null;
  @Field(() => Date, { nullable: true })
  receivedAt: Date | null;
  @Field(() => [MailboxParticipantDTO])
  participants: MailboxParticipantDTO[];
}

@ObjectType()
export class MailboxPageDTO {
  @Field(() => [MailboxMessageDTO])
  messages: MailboxMessageDTO[];
  @Field(() => Boolean)
  hasMore: boolean;
}
