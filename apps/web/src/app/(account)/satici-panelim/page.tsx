import { SellerMessagesWorkspace } from "@/components/chat/SellerMessagesWorkspace";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function SellerPanelOverviewPage() {
  return (
    <RequireAuth>
      <SellerMessagesWorkspace />
    </RequireAuth>
  );
}
