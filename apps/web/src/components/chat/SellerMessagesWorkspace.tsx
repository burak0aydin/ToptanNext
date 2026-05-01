"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  fetchConversationById,
  fetchConversations,
  fetchLatestLogisticsRequest,
  requestLogistics,
  selectLogisticsOffer,
  type ConversationSummary,
  type LogisticsOffer,
} from "@/features/chat/api/chat.api";
import { useChatStore } from "@/features/chat/store/useChatStore";
import { getCurrentUserIdFromToken, getCurrentUserRoleFromToken } from "@/features/chat/utils/auth";
import { useSocket } from "@/features/chat/hooks/useSocket";
import { resolveProductListingMediaUrl } from "@/features/product-listing/api/product-listing.api";
import { MessageInput } from "./MessageInput";
import { MessageThread } from "./MessageThread";

const filters = [
  { key: "all", label: "Tümü" },
  { key: "pending_quotes", label: "Teklif Bekleyenler" },
  { key: "logistics_pending", label: "Kargo Bekleyenler" },
] as const;

const quickLogistics = {
  fromCity: "İstanbul",
  toCity: "İzmir",
  palletCount: 2,
  itemCount: 500,
};

function formatMoney(value: number, currency = "TL"): string {
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value)} ${currency}`;
}

function getPartner(conversation: ConversationSummary | null, currentUserId: string | null) {
  return conversation?.participants.find((participant) => participant.userId !== currentUserId) ?? null;
}

function getInitials(value: string | null | undefined): string {
  if (!value) {
    return "TN";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function statusBadge(conversation: ConversationSummary) {
  if (conversation.hasPendingLogistics) {
    return { icon: "local_shipping", label: "Kargo Bekliyor", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  }

  if (conversation.hasApprovedLogistics) {
    return { icon: "check_circle", label: "Lojistik Onaylandı", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  }

  return null;
}

type ConversationCardProps = {
  conversation: ConversationSummary;
  currentUserId: string | null;
  isActive: boolean;
  onSelect: () => void;
};

function ConversationCard({
  conversation,
  currentUserId,
  isActive,
  onSelect,
}: ConversationCardProps) {
  const partner = getPartner(conversation, currentUserId);
  const partnerName = partner?.companyName || partner?.fullName || "Müşteri";
  const lastMessage = conversation.lastMessage?.body || "Henüz mesaj yok";
  const badge = statusBadge(conversation);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative flex w-full gap-3 border-b border-slate-200/70 p-4 text-left transition-colors",
        isActive ? "bg-[#e0e3e5]" : "hover:bg-[#e6e8ea]",
      ].join(" ")}
    >
      {isActive ? <span className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-[#003fb1]" /> : null}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-xs font-bold text-[#003fb1]">
        {partner?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={partnerName} className="h-full w-full object-cover" src={partner.avatarUrl} />
        ) : (
          getInitials(partnerName)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-[#191c1e]">{partnerName}</h3>
          <span className="shrink-0 text-xs text-[#434654]">
            {format(new Date(conversation.lastMessageAt), "HH:mm", { locale: tr })}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-[#434654]">{lastMessage}</p>
        {badge ? (
          <span className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.className}`}>
            <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
            {badge.label}
          </span>
        ) : null}
      </div>
    </button>
  );
}

type OfferManagementPanelProps = {
  conversationId: string | null;
  productListingId: string | null;
  productName: string | null;
};

function OfferManagementPanel({
  conversationId,
  productListingId,
  productName,
}: OfferManagementPanelProps) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const canRequestLogistics = useMemo(() => getCurrentUserRoleFromToken() === "SUPPLIER", []);
  const storeRequests = useChatStore((state) => state.logisticsRequests);
  const storeOffers = useChatStore((state) => state.logisticsOffers);
  const selectedOffers = useChatStore((state) => state.selectedLogisticsOffer);
  const [productTotal, setProductTotal] = useState(4_250_000);
  const [quantity, setQuantity] = useState(500);
  const [deliveryMode, setDeliveryMode] = useState<"PICKUP" | "OWN" | "NETWORK">("NETWORK");
  const [fromCity, setFromCity] = useState(quickLogistics.fromCity);
  const [toCity, setToCity] = useState(quickLogistics.toCity);
  const [sellerDeliveryFee, setSellerDeliveryFee] = useState<number | null>(0);
  const [openStep, setOpenStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);

  const latestRequestQuery = useQuery({
    queryKey: ["seller-logistics-request", conversationId],
    queryFn: () => fetchLatestLogisticsRequest(conversationId ?? ""),
    enabled: Boolean(conversationId),
  });

  const liveRequests = conversationId ? storeRequests.get(conversationId) ?? [] : [];
  const latestRequest = liveRequests.at(-1) ?? latestRequestQuery.data ?? null;
  const selectedOffer = (conversationId ? selectedOffers.get(conversationId) : null)
    ?? latestRequest?.offers.find((offer) => offer.status === "SELECTED")
    ?? null;
  const liveOffers = conversationId ? storeOffers.get(conversationId) ?? [] : [];
  const offers = Array.from(
    new Map([...(latestRequest?.offers ?? []), ...liveOffers].map((offer) => [offer.id, offer])).values(),
  ).sort((left, right) => left.price - right.price);
  const firstOffer = selectedOffer ?? offers[0] ?? null;
  const logisticsFee = deliveryMode === "NETWORK"
    ? firstOffer?.price ?? 0
    : deliveryMode === "OWN"
      ? (sellerDeliveryFee ?? 0)
      : 0;
  const grandTotal = productTotal + logisticsFee;

  const requestMutation = useMutation({
    mutationFn: () =>
      requestLogistics(conversationId ?? "", {
        fromCity: fromCity ?? quickLogistics.fromCity,
        toCity: toCity ?? quickLogistics.toCity,
        palletCount: quickLogistics.palletCount,
        itemCount: quantity,
        isSellerDelivery: deliveryMode === "OWN",
        sellerDeliveryFee: deliveryMode === "OWN" ? (sellerDeliveryFee ?? 0) : undefined,
      }),
    onSuccess: () => {
      setError(null);
      setOpenStep(2);
      void queryClient.invalidateQueries({ queryKey: ["seller-logistics-request", conversationId] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Lojistik talebi oluşturulamadı.");
    },
  });

  const selectOfferMutation = useMutation({
    mutationFn: (offerId: string) => selectLogisticsOffer(conversationId ?? "", offerId),
    onSuccess: () => {
      setError(null);
      setOpenStep(3);
      void queryClient.invalidateQueries({ queryKey: ["seller-logistics-request", conversationId] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Lojistik teklifi seçilemedi.");
    },
  });

  const sendQuote = () => {
    if (!socket || !conversationId || !productListingId) {
      setError("Teklif göndermek için aktif sohbet ve socket bağlantısı gerekli.");
      return;
    }

    socket.emit("send_quote_offer", {
      conversationId,
      quoteData: {
        productListingId,
        quantity,
        unitPrice: Math.max(productTotal / Math.max(quantity, 1), 1),
        logisticsFee,
        currency: "TRY",
        notes: deliveryMode === "PICKUP"
          ? "Teslim yöntemi: Satıcı iş yerinden teslim alınacak."
          : deliveryMode === "OWN"
            ? "Teslim yöntemi: Satıcı kendi aracıyla teslimat yapacak."
            : selectedOffer
              ? `${selectedOffer.partnerCompanyName ?? "Lojistik"} teklifi dahil edilmiştir.`
              : "ToptanNext lojistik ağı teklifi bekleniyor.",
        expiresInHours: 24,
      },
    });
    setError(null);
  };

  return (
    <aside className="flex h-full w-[30%] min-w-[340px] flex-col overflow-hidden border-l border-slate-200 bg-[#f7f9fb] shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="border-b border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#191c1e]">
          <span className="material-symbols-outlined text-[#003fb1]">edit_document</span>
          Teklif Yönetimi
        </h2>
        <p className="mt-1 text-xs text-[#434654]">Bu sohbet için entegre teklif oluşturun.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="overflow-hidden rounded-xl border border-[#003fb1]/40 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setOpenStep(openStep === 1 ? 2 : 1)}
            className="flex w-full items-center justify-between border-b border-[#003fb1]/20 bg-[#003fb1]/5 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#003fb1] text-[10px] font-bold text-white">1</span>
              <h3 className="text-sm font-semibold text-[#003fb1]">ADIM 1: Teslimat Yöntemi</h3>
            </div>
            <span className="material-symbols-outlined text-sm text-[#003fb1]">{openStep === 1 ? "expand_less" : "expand_more"}</span>
          </button>
          {openStep === 1 ? <div className="space-y-4 p-4">
            <div className="grid gap-2">
              {[
                { key: "PICKUP", icon: "storefront", title: "Satıcı iş yerinden teslim al", text: "Alıcı veya anlaşmalı taşıyıcı satıcıdan teslim alır." },
                { key: "OWN", icon: "local_shipping", title: "Kendi aracımla teslimat", text: "Satıcı teslimatı kendi operasyonuyla yapar." },
                { key: "NETWORK", icon: "campaign", title: "ToptanNext Lojistik ağına teklif oluştur", text: "Açık yük ilanı oluşturulur, lojistik firmaları teklif verir." },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setDeliveryMode(option.key as "PICKUP" | "OWN" | "NETWORK")}
                  className={[
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    deliveryMode === option.key ? "border-[#003fb1] bg-[#003fb1]/5" : "border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="material-symbols-outlined text-[20px] text-[#003fb1]">{option.icon}</span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{option.text}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[#eceef0] p-3">
              <div className="flex-1">
                <span className="block text-[10px] uppercase tracking-wider text-[#434654]">Nereden</span>
                <input
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold"
                />
              </div>
              <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
              <div className="flex-1">
                <span className="block text-[10px] uppercase tracking-wider text-[#434654]">Nereye</span>
                <input
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#434654]">
              <span className="material-symbols-outlined text-[14px]">inventory_2</span>
              Yük: {quickLogistics.palletCount} Palet / {quantity} Adet
            </div>
            <button
              type="button"
              disabled={!conversationId || requestMutation.isPending || (deliveryMode === "NETWORK" && !canRequestLogistics)}
              onClick={() => {
                if (deliveryMode === "NETWORK" || deliveryMode === "OWN") {
                  if (deliveryMode === "NETWORK" && !canRequestLogistics) {
                    setError("Lojistik ağına talep oluşturma yalnızca satıcılar için kullanılabilir.");
                    return;
                  }

                  requestMutation.mutate();
                  return;
                }
                setOpenStep(3);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#003fb1] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a56db] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <span className="material-symbols-outlined text-[18px]">{deliveryMode === "NETWORK" ? "campaign" : "arrow_forward"}</span>
              {requestMutation.isPending
                ? "Talep Oluşturuluyor..."
                : deliveryMode === "NETWORK"
                  ? canRequestLogistics
                    ? "Lojistik Ağına Sor (Fiyat İste)"
                    : "Lojistik Ağına Sor yalnızca satıcılar için"
                  : "Teklif Adımına Geç"}
            </button>
          </div> : null}
        </div>

        <div className={["overflow-hidden rounded-xl border bg-white shadow-sm", deliveryMode === "NETWORK" && latestRequest ? "border-slate-200" : "border-slate-200 opacity-60 grayscale"].join(" ")}>
          <button
            type="button"
            onClick={() => setOpenStep(2)}
            className="flex w-full items-center justify-between bg-[#f2f4f6] px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-white">2</span>
              <h3 className="text-sm font-semibold text-[#434654]">ADIM 2: Lojistikçilerden Gelen Teklifler</h3>
            </div>
            <span className="material-symbols-outlined text-sm text-[#434654]">{openStep === 2 ? "expand_less" : "expand_more"}</span>
          </button>
          {latestRequest && openStep === 2 ? (
            <div className="space-y-2 p-4">
              {latestRequest?.isSellerDelivery ? (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Satıcı kendi aracıyla teslimat belirledi</div>
                      <div className="mt-1 font-semibold text-sm">Kargo Ücreti: {formatMoney(latestRequest.sellerDeliveryFee ?? 0)}</div>
                    </div>
                    <div className="text-xs text-slate-400">—</div>
                  </div>
                </div>
              ) : null}
              {offers.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-3 text-xs font-medium text-slate-500">
                  Lojistik ağına talep gönderildi. Teklifler geldiğinde burada görünecek.
                </p>
              ) : (
                offers.map((offer) => (
                  <LogisticsOfferRow
                    key={offer.id}
                    offer={offer}
                    isSelected={selectedOffer?.id === offer.id}
                    onSelect={() => selectOfferMutation.mutate(offer.id)}
                  />
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className={["overflow-hidden rounded-xl border bg-white shadow-sm", deliveryMode !== "NETWORK" || firstOffer ? "border-slate-200" : "border-slate-200 opacity-60 grayscale"].join(" ")}>
          <button
            type="button"
            onClick={() => setOpenStep(3)}
            className="flex w-full items-center justify-between bg-[#f2f4f6] px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-white">3</span>
              <h3 className="text-sm font-semibold text-[#434654]">ADIM 3: Müşteriye Özel Teklif</h3>
            </div>
            <span className="material-symbols-outlined text-sm text-[#434654]">{openStep === 3 ? "expand_less" : "expand_more"}</span>
          </button>
          {openStep === 3 ? <div className="space-y-4 p-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Ürün Bedeli ({quantity} Adet)</span>
              <input
                value={productTotal}
                onChange={(event) => setProductTotal(Number(event.target.value) || 0)}
                type="number"
                className="w-full rounded-lg border-none bg-[#eceef0] px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#003fb1]"
              />
            </label>
            {deliveryMode === "OWN" ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">Satıcı Kargo Ücreti (TL)</span>
                <input
                  value={sellerDeliveryFee ?? 0}
                  onChange={(event) => setSellerDeliveryFee(Number(event.target.value) || 0)}
                  type="number"
                  className="w-full rounded-lg border-none bg-[#eceef0] px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#003fb1]"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Adet</span>
              <input
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                type="number"
                min={1}
                className="w-full rounded-lg border-none bg-[#eceef0] px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#003fb1]"
              />
            </label>
            <div className="rounded-xl border border-slate-200 bg-[#eceef0] p-4">
              <div className="flex justify-between text-sm">
                <span>{productName ?? "Ürün bedeli"}</span>
                <span className="font-semibold">{formatMoney(productTotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>Lojistik Bedeli</span>
                <span className="font-semibold">{formatMoney(logisticsFee)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-300 pt-3">
                <span className="text-sm font-semibold">Genel Toplam</span>
                <span className="text-lg font-bold text-[#003fb1]">{formatMoney(grandTotal)}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={!conversationId || !productListingId}
              onClick={sendQuote}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#fd591e] py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#ad3b00] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Müşteriye Özel Teklifi Gönder
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div> : null}
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>
        ) : null}
      </div>
    </aside>
  );
}

function LogisticsOfferRow({
  offer,
  isSelected,
  onSelect,
}: {
  offer: LogisticsOffer;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        isSelected ? "border-[#003fb1] bg-[#003fb1]/5" : "border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      <span className={["h-4 w-4 rounded-full border", isSelected ? "border-[#003fb1] bg-[#003fb1]" : "border-slate-300"].join(" ")} />
      <span className="min-w-0 flex-1">
        <span className="flex justify-between gap-2">
          <span className="truncate text-sm font-semibold">{offer.partnerCompanyName ?? "Lojistik Firması"}</span>
          <span className="text-sm font-bold text-[#003fb1]">{formatMoney(offer.price, offer.currency)}</span>
        </span>
        <span className="text-[11px] text-slate-500">
          Tahmini {offer.estimatedDays} Gün {offer.isInsured ? "· Sigortalı" : ""}
        </span>
      </span>
      <span className="material-symbols-outlined text-[20px] text-[#003fb1]">chat</span>
    </button>
  );
}

export function SellerMessagesWorkspace() {
  const currentUserId = useMemo(() => getCurrentUserIdFromToken(), []);
  const currentUserRole = useMemo(() => getCurrentUserRoleFromToken(), []);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [audience, setAudience] = useState<"customers" | "logistics">("customers");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["key"]>("all");
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setConversations = useChatStore((state) => state.setConversations);
  const conversationMap = useChatStore((state) => state.conversations);
  const canRequestLogistics = currentUserRole === "SUPPLIER";

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const conversationsQuery = useQuery({
    queryKey: ["seller-conversations", audience, activeFilter, debouncedSearch],
    queryFn: () =>
      fetchConversations({
        filter: audience === "logistics" ? "logistics_pending" : activeFilter,
        search: debouncedSearch,
      }),
  });

  useEffect(() => {
    if (conversationsQuery.data) {
      setConversations(conversationsQuery.data);
    }
  }, [conversationsQuery.data, setConversations]);

  const conversations = useMemo(
    () =>
      Array.from(conversationMap.values()).sort(
        (left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime(),
      ),
    [conversationMap],
  );

  useEffect(() => {
    if (!activeConversationId && conversations[0]) {
      setActiveConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, setActiveConversation]);

  const conversationQuery = useQuery({
    queryKey: ["seller-conversation", activeConversationId],
    queryFn: () => fetchConversationById(activeConversationId ?? ""),
    enabled: Boolean(activeConversationId),
  });

  const activeConversation =
    (activeConversationId ? conversationMap.get(activeConversationId) : null)
    ?? conversationQuery.data
    ?? null;
  const partner = getPartner(activeConversation, currentUserId);
  const productImage = activeConversation?.productImageMediaId
    ? resolveProductListingMediaUrl(activeConversation.productImageMediaId)
    : null;

  return (
    <div className="flex h-full min-h-0 w-full">
      <section className="flex h-full w-[25%] min-w-[320px] flex-col border-r border-slate-200 bg-[#f2f4f6]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4">
          <h1 className="text-xl font-semibold text-[#191c1e]">Mesajlar</h1>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#434654]">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border-none bg-[#e0e3e5] py-2.5 pl-10 pr-4 text-sm text-[#191c1e] placeholder:text-[#434654]/70 focus:bg-white focus:ring-1 focus:ring-[#003fb1]"
              placeholder="Firma, ürün veya mesaj ara..."
            />
          </div>
          <div className="flex gap-1 rounded-lg bg-[#e0e3e5] p-1">
            <button
              type="button"
              onClick={() => setAudience("customers")}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-semibold",
                audience === "customers" ? "bg-white text-[#003fb1] shadow-sm" : "text-[#434654] hover:text-[#191c1e]",
              ].join(" ")}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              Müşteriler
            </button>
            <button
              type="button"
              onClick={() => setAudience("logistics")}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-semibold",
                audience === "logistics" ? "bg-white text-[#003fb1] shadow-sm" : "text-[#434654] hover:text-[#191c1e]",
              ].join(" ")}
            >
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              Lojistik Ağı
            </button>
          </div>
          {audience === "customers" ? <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={[
                  "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  activeFilter === filter.key
                    ? "bg-[#003fb1] text-white"
                    : "bg-[#e0e3e5] text-[#434654] hover:bg-slate-200",
                ].join(" ")}
              >
                {filter.label}
              </button>
            ))}
          </div> : (
            <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-500">
              ToptanNext lojistik ağına açılan yük ilanları ve gelen teklifler burada listelenir.
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <p className="p-4 text-sm text-slate-500">Konuşmalar yükleniyor...</p>
          ) : null}
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUserId}
              isActive={conversation.id === activeConversationId}
              onSelect={() => setActiveConversation(conversation.id)}
            />
          ))}
          {!conversationsQuery.isLoading && conversations.length === 0 ? (
            <p className="m-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
              Bu filtrede konuşma bulunamadı.
            </p>
          ) : null}
        </div>
      </section>

      <section className="flex min-w-0 flex-1 flex-col bg-white">
        {activeConversationId && activeConversation ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400 shadow-sm">
                  {productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={activeConversation.productName ?? "Ürün"} className="h-full w-full object-cover" src={productImage} />
                  ) : (
                    <span className="material-symbols-outlined">inventory_2</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-[#191c1e]">
                    {activeConversation.productName ?? "Ürün görüşmesi"}
                  </h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3">
                    <span className="rounded bg-[#eceef0] px-2 py-0.5 text-xs font-medium text-[#434654]">
                      Müşteri: {partner?.companyName || partner?.fullName || "Müşteri"}
                    </span>
                    <span className="text-xs font-semibold text-[#003fb1]">Beklenen: ~4.500.000 TL</span>
                  </div>
                </div>
              </div>
              {activeConversation.productListingId ? (
                <Link
                  href={`/urun/${activeConversation.productListingId}`}
                  className="flex items-center gap-1 rounded-lg p-2 text-xs font-semibold text-[#003fb1] transition-colors hover:bg-[#003fb1]/10"
                >
                  Ürüne Git
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </Link>
              ) : null}
            </div>
            <div className="min-h-0 flex-1">
              <MessageThread conversationId={activeConversationId} showHeader={false} />
            </div>
            <MessageInput
              conversationId={activeConversationId}
              canSendQuote={false}
              compact
              onOpenQuoteModal={() => undefined}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Bir konuşma seçin</h2>
              <p className="mt-2 text-sm text-slate-500">Mesajları ve teklif yönetimini görüntülemek için soldan bir konuşma seçebilirsiniz.</p>
            </div>
          </div>
        )}
      </section>

      <OfferManagementPanel
        conversationId={activeConversationId}
        productListingId={activeConversation?.productListingId ?? null}
        productName={activeConversation?.productName ?? null}
      />
    </div>
  );
}
