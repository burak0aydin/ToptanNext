import { SellerMessagesWorkspace } from "@/components/chat/SellerMessagesWorkspace";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function SellerMessagesRedirectPage() {
  return (
    <RequireAuth>
      <SellerMessagesWorkspace />
    </RequireAuth>
  );
}
