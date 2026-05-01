import { ConversationWorkspace } from '@/components/chat/ConversationWorkspace';

type ConversationPageProps = {
  params: {
    conversationId: string;
  };
};

export default function ConversationPage({ params }: ConversationPageProps) {
  return <ConversationWorkspace conversationId={params.conversationId} />;
}
