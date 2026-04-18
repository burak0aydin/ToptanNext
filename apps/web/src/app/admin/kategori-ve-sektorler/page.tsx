"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api";
import { AdminPageHeader } from "../_components/AdminPageHeader";

type AdminCategoryNode = {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children: AdminCategoryNode[];
};

type AdminSectorItem = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

type CategoryFormState = {
  name: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
};

type SectorFormState = {
  name: string;
  sortOrder: string;
  isActive: boolean;
};

type FeedbackState = {
  tone: "success" | "error";
  message: string;
};

type CategoryOption = {
  id: string;
  label: string;
  level: number;
};

type CategoryMoveContext = {
  siblings: AdminCategoryNode[];
  index: number;
  parentId: string | null;
};

type CategoryDragState = {
  id: string;
  parentId: string | null;
};

const CATEGORY_QUERY_KEY = ["admin", "categories", "tree"] as const;
const SECTOR_QUERY_KEY = ["admin", "sectors", "all"] as const;

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  name: "",
  parentId: "",
  sortOrder: "",
  isActive: true,
};

const EMPTY_SECTOR_FORM: SectorFormState = {
  name: "",
  sortOrder: "",
  isActive: true,
};

async function fetchAdminCategoryTree(): Promise<AdminCategoryNode[]> {
  return requestJson<AdminCategoryNode[]>("/categories/admin/tree", {
    auth: true,
  });
}

async function fetchAdminSectors(): Promise<AdminSectorItem[]> {
  return requestJson<AdminSectorItem[]>("/sectors/admin", {
    auth: true,
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "İşlem sırasında beklenmeyen bir hata oluştu.";
}

function parseOptionalSortOrder(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const numeric = Number.parseInt(trimmed, 10);
  if (Number.isNaN(numeric) || numeric < 0) {
    return 0;
  }

  return numeric;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const cloned = [...items];
  const [movedItem] = cloned.splice(fromIndex, 1);
  cloned.splice(toIndex, 0, movedItem);
  return cloned;
}

function toReorderItems(ids: string[]) {
  return ids.map((id, index) => ({
    id,
    sortOrder: index,
  }));
}

function flattenCategoryOptions(nodes: AdminCategoryNode[]): CategoryOption[] {
  const result: CategoryOption[] = [];

  const traverse = (items: AdminCategoryNode[]) => {
    items.forEach((item) => {
      const prefix = item.level === 1 ? "" : item.level === 2 ? "— " : "—— ";
      result.push({
        id: item.id,
        label: `${prefix}${item.name}`,
        level: item.level,
      });

      if (item.children.length > 0) {
        traverse(item.children);
      }
    });
  };

  traverse(nodes);
  return result;
}

function findCategoryNodeById(
  nodes: AdminCategoryNode[],
  id: string,
): AdminCategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const nested = findCategoryNodeById(node.children, id);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function collectCategoryIds(node: AdminCategoryNode, bucket: Set<string>): void {
  bucket.add(node.id);

  node.children.forEach((child) => {
    collectCategoryIds(child, bucket);
  });
}

function collectCollapsibleCategoryIds(
  nodes: AdminCategoryNode[],
  bucket: Set<string>,
): void {
  nodes.forEach((node) => {
    if (node.children.length > 0) {
      bucket.add(node.id);
      collectCollapsibleCategoryIds(node.children, bucket);
    }
  });
}

function findCategoryMoveContext(
  nodes: AdminCategoryNode[],
  categoryId: string,
): CategoryMoveContext | null {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];

    if (node.id === categoryId) {
      return {
        siblings: nodes,
        index,
        parentId: node.parentId,
      };
    }

    const nestedContext = findCategoryMoveContext(node.children, categoryId);
    if (nestedContext) {
      return nestedContext;
    }
  }

  return null;
}

function getLevelLabel(level: number): string {
  if (level === 1) {
    return "Ana Kategori";
  }

  if (level === 2) {
    return "Alt Kategori";
  }

  return "Alt Alt Kategori";
}

function getLevelContainerClass(level: number, isActive: boolean): string {
  if (!isActive) {
    return "border-2 border-rose-300 bg-gradient-to-r from-rose-50/95 to-white";
  }

  if (level === 1) {
    return "border-2 border-sky-300 bg-gradient-to-r from-sky-50/95 to-white";
  }

  if (level === 2) {
    return "border-2 border-violet-300 bg-gradient-to-r from-violet-50/95 to-white";
  }

  return "border-2 border-amber-300 bg-gradient-to-r from-amber-50/95 to-white";
}

function getLevelBadgeClass(level: number): string {
  if (level === 1) {
    return "bg-sky-100 text-sky-800 ring-1 ring-sky-200";
  }

  if (level === 2) {
    return "bg-violet-100 text-violet-800 ring-1 ring-violet-200";
  }

  return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
}

export default function AdminCategoryAndSectorManagementPage() {
  const queryClient = useQueryClient();

  const {
    data: categoryTree = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: CATEGORY_QUERY_KEY,
    queryFn: fetchAdminCategoryTree,
  });

  const {
    data: sectors = [],
    isLoading: isSectorsLoading,
    isError: isSectorsError,
  } = useQuery({
    queryKey: SECTOR_QUERY_KEY,
    queryFn: fetchAdminSectors,
  });

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [categoryFeedback, setCategoryFeedback] = useState<FeedbackState | null>(null);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [categoryActionLoadingId, setCategoryActionLoadingId] = useState<string | null>(
    null,
  );

  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [sectorForm, setSectorForm] = useState<SectorFormState>(EMPTY_SECTOR_FORM);
  const [sectorFeedback, setSectorFeedback] = useState<FeedbackState | null>(null);
  const [isSectorSubmitting, setIsSectorSubmitting] = useState(false);
  const [sectorActionLoadingId, setSectorActionLoadingId] = useState<string | null>(
    null,
  );

  const [isCategoryListCollapsed, setIsCategoryListCollapsed] = useState(false);
  const [isSectorListCollapsed, setIsSectorListCollapsed] = useState(false);
  const [isCategoryFormCollapsed, setIsCategoryFormCollapsed] = useState(true);
  const [isSectorFormCollapsed, setIsSectorFormCollapsed] = useState(true);
  const [hasInitializedCategoryCollapse, setHasInitializedCategoryCollapse] =
    useState(false);
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<string>>(new Set());

  const [draggingCategory, setDraggingCategory] = useState<CategoryDragState | null>(
    null,
  );
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

  const [draggingSectorId, setDraggingSectorId] = useState<string | null>(null);
  const [dragOverSectorId, setDragOverSectorId] = useState<string | null>(null);

  const flatCategoryOptions = useMemo(
    () => flattenCategoryOptions(categoryTree),
    [categoryTree],
  );

  const editingCategory = useMemo(() => {
    if (!editingCategoryId) {
      return null;
    }

    return findCategoryNodeById(categoryTree, editingCategoryId);
  }, [categoryTree, editingCategoryId]);

  const blockedParentIds = useMemo(() => {
    if (!editingCategory) {
      return new Set<string>();
    }

    const ids = new Set<string>();
    collectCategoryIds(editingCategory, ids);
    return ids;
  }, [editingCategory]);

  const parentOptions = useMemo(() => {
    return flatCategoryOptions.filter(
      (option) => option.level < 3 && !blockedParentIds.has(option.id),
    );
  }, [flatCategoryOptions, blockedParentIds]);

  useEffect(() => {
    const collapsibleIds = new Set<string>();
    collectCollapsibleCategoryIds(categoryTree, collapsibleIds);

    setCollapsedCategoryIds((current) => {
      if (!hasInitializedCategoryCollapse) {
        return collapsibleIds;
      }

      const next = new Set<string>();
      current.forEach((id) => {
        if (collapsibleIds.has(id)) {
          next.add(id);
        }
      });

      return next;
    });

    if (!hasInitializedCategoryCollapse) {
      setHasInitializedCategoryCollapse(true);
    }
  }, [categoryTree, hasInitializedCategoryCollapse]);

  const refreshCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ["nav", "categories"] });
  };

  const refreshSectors = async () => {
    await queryClient.invalidateQueries({ queryKey: SECTOR_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ["nav", "sectors"] });
    await queryClient.invalidateQueries({ queryKey: ["home", "featured-sectors"] });
  };

  const startCreateCategory = (parentId: string | null = null) => {
    setEditingCategoryId(null);
    setCategoryFeedback(null);
    setIsCategoryFormCollapsed(false);
    setCategoryForm({
      ...EMPTY_CATEGORY_FORM,
      parentId: parentId ?? "",
    });
  };

  const startEditCategory = (node: AdminCategoryNode) => {
    setEditingCategoryId(node.id);
    setCategoryFeedback(null);
    setIsCategoryFormCollapsed(false);
    setCategoryForm({
      name: node.name,
      parentId: node.parentId ?? "",
      sortOrder: String(node.sortOrder),
      isActive: node.isActive,
    });
  };

  const handleCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategoryFeedback(null);

    const normalizedName = categoryForm.name.trim();
    if (normalizedName.length === 0) {
      setCategoryFeedback({
        tone: "error",
        message: "Kategori adı boş olamaz.",
      });
      return;
    }

    setIsCategorySubmitting(true);

    try {
      const payload = {
        name: normalizedName,
        parentId: categoryForm.parentId || null,
        sortOrder: parseOptionalSortOrder(categoryForm.sortOrder),
        isActive: categoryForm.isActive,
      };

      if (editingCategoryId) {
        await requestJson(`/categories/${editingCategoryId}`, {
          method: "PUT",
          body: payload,
          auth: true,
        });

        setCategoryFeedback({
          tone: "success",
          message: "Kategori başarıyla güncellendi.",
        });
      } else {
        await requestJson("/categories", {
          method: "POST",
          body: payload,
          auth: true,
        });

        setCategoryFeedback({
          tone: "success",
          message: "Kategori başarıyla oluşturuldu.",
        });

        setCategoryForm((current) => ({
          ...current,
          name: "",
          sortOrder: "",
          isActive: true,
        }));
      }

      await refreshCategories();
    } catch (error) {
      setCategoryFeedback({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (node: AdminCategoryNode) => {
    const approved = window.confirm(
      `${node.name} kategorisini silmek istediğinize emin misiniz?`,
    );

    if (!approved) {
      return;
    }

    setCategoryActionLoadingId(node.id);
    setCategoryFeedback(null);

    try {
      await requestJson(`/categories/${node.id}`, {
        method: "DELETE",
        auth: true,
      });

      setCategoryFeedback({
        tone: "success",
        message: "Kategori başarıyla silindi.",
      });

      if (editingCategoryId === node.id) {
        setEditingCategoryId(null);
        setCategoryForm(EMPTY_CATEGORY_FORM);
      }

      await refreshCategories();
    } catch (error) {
      setCategoryFeedback({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setCategoryActionLoadingId(null);
    }
  };

  const handleToggleCategoryActive = async (node: AdminCategoryNode) => {
    setCategoryActionLoadingId(node.id);
    setCategoryFeedback(null);

    try {
      const payload: {
        name: string;
        sortOrder: number;
        isActive: boolean;
        parentId?: string;
      } = {
        name: node.name,
        sortOrder: node.sortOrder,
        isActive: !node.isActive,
      };

      if (node.parentId) {
        payload.parentId = node.parentId;
      }

      await requestJson(`/categories/${node.id}`, {
        method: "PUT",
        auth: true,
        body: payload,
      });

      setCategoryFeedback({
        tone: "success",
        message: node.isActive
          ? "Kategori pasife alındı ve menü sırası otomatik güncellendi."
          : "Kategori aktife alındı ve menü sırası otomatik güncellendi.",
      });

      await refreshCategories();
    } catch (error) {
      setCategoryFeedback({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setCategoryActionLoadingId(null);
    }
  };

  const persistCategoryReorder = async (
    siblings: AdminCategoryNode[],
    orderedIds: string[],
    loadingId: string,
  ) => {
    setCategoryActionLoadingId(loadingId);
    setCategoryFeedback(null);

    try {
      if (orderedIds.length !== siblings.length) {
        throw new Error("Kategori sıralama verisi geçersiz.");
      }

      await requestJson("/categories/admin/reorder", {
        method: "PUT",
        auth: true,
        body: {
          items: toReorderItems(orderedIds),
        },
      });

      await refreshCategories();
    } catch (error) {
      setCategoryFeedback({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setCategoryActionLoadingId(null);
    }
  };

  const moveCategory = async (categoryId: string, direction: -1 | 1) => {
    const context = findCategoryMoveContext(categoryTree, categoryId);
    if (!context) {
      return;
    }

    const targetIndex = context.index + direction;
    if (targetIndex < 0 || targetIndex >= context.siblings.length) {
      return;
    }

    const ordered = moveItem(
      context.siblings.map((item) => item.id),
      context.index,
      targetIndex,
    );

    await persistCategoryReorder(context.siblings, ordered, categoryId);
  };

  const handleCategoryDragStart = (
    event: React.DragEvent<HTMLElement>,
    node: AdminCategoryNode,
  ) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", node.id);

    setDraggingCategory({
      id: node.id,
      parentId: node.parentId,
    });
  };

  const handleCategoryDrop = async (
    siblings: AdminCategoryNode[],
    targetId: string,
    targetParentId: string | null,
  ) => {
    if (!draggingCategory) {
      return;
    }

    const { id: draggedId, parentId: draggedParentId } = draggingCategory;
    if (draggedParentId !== targetParentId || draggedId === targetId) {
      setDraggingCategory(null);
      setDragOverCategoryId(null);
      return;
    }

    const siblingIds = siblings.map((item) => item.id);
    const fromIndex = siblingIds.indexOf(draggedId);
    const toIndex = siblingIds.indexOf(targetId);

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggingCategory(null);
      setDragOverCategoryId(null);
      return;
    }

    const ordered = moveItem(siblingIds, fromIndex, toIndex);

    setDraggingCategory(null);
    setDragOverCategoryId(null);
    await persistCategoryReorder(siblings, ordered, draggedId);
  };

  const toggleCategoryChildren = (categoryId: string) => {
    setCollapsedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  };

  const startCreateSector = () => {
    setEditingSectorId(null);
    setSectorFeedback(null);
    setIsSectorFormCollapsed(false);
    setSectorForm(EMPTY_SECTOR_FORM);
  };

  const startEditSector = (sector: AdminSectorItem) => {
    setEditingSectorId(sector.id);
    setSectorFeedback(null);
    setIsSectorFormCollapsed(false);
    setSectorForm({
      name: sector.name,
      sortOrder: String(sector.sortOrder),
      isActive: sector.isActive,
    });
  };

  const handleSectorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSectorFeedback(null);

    const normalizedName = sectorForm.name.trim();
    if (normalizedName.length === 0) {
      setSectorFeedback({
        tone: "error",
        message: "Sektör adı boş olamaz.",
      });
      return;
    }

    setIsSectorSubmitting(true);

    try {
      const payload = {
        name: normalizedName,
        sortOrder: parseOptionalSortOrder(sectorForm.sortOrder),
        isActive: sectorForm.isActive,
      };

      if (editingSectorId) {
        await requestJson(`/sectors/${editingSectorId}`, {
          method: "PUT",
          auth: true,
          body: payload,
        });

        setSectorFeedback({
          tone: "success",
          message: "Sektör başarıyla güncellendi.",
        });
      } else {
        await requestJson("/sectors", {
          method: "POST",
          auth: true,
          body: payload,
        });

        setSectorFeedback({
          tone: "success",
          message: "Sektör başarıyla oluşturuldu.",
        });

        setSectorForm(EMPTY_SECTOR_FORM);
      }

      await refreshSectors();
    } catch (error) {
      setSectorFeedback({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSectorSubmitting(false);
    }
  };

  const handleDeleteSector = async (sector: AdminSectorItem) => {
    const approved = window.confirm(
      `${sector.name} sektörünü silmek istediğinize emin misiniz?`,
    );

    if (!approved) {
      return;
    }

    setSectorActionLoadingId(sector.id);
    setSectorFeedback(null);

    try {
      await requestJson(`/sectors/${sector.id}`, {
        method: "DELETE",
        auth: true,
      });

      setSectorFeedback({
        tone: "success",
        message: "Sektör başarıyla silindi.",
      });

      if (editingSectorId === sector.id) {
        setEditingSectorId(null);
        setSectorForm(EMPTY_SECTOR_FORM);
      }

      await refreshSectors();
    } catch (error) {
      setSectorFeedback({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setSectorActionLoadingId(null);
    }
  };

  const handleToggleSectorActive = async (sector: AdminSectorItem) => {
    setSectorActionLoadingId(sector.id);
    setSectorFeedback(null);

    try {
      await requestJson(`/sectors/${sector.id}`, {
        method: "PUT",
        auth: true,
        body: {
          name: sector.name,
          sortOrder: sector.sortOrder,
          isActive: !sector.isActive,
        },
      });

      setSectorFeedback({
        tone: "success",
        message: sector.isActive
          ? "Sektör pasife alındı ve menü sırası otomatik güncellendi."
          : "Sektör aktife alındı ve menü sırası otomatik güncellendi.",
      });

      await refreshSectors();
    } catch (error) {
      setSectorFeedback({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setSectorActionLoadingId(null);
    }
  };

  const persistSectorReorder = async (orderedIds: string[], loadingId: string) => {
    setSectorActionLoadingId(loadingId);
    setSectorFeedback(null);

    try {
      await requestJson("/sectors/admin/reorder", {
        method: "PUT",
        auth: true,
        body: {
          items: toReorderItems(orderedIds),
        },
      });

      await refreshSectors();
    } catch (error) {
      setSectorFeedback({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setSectorActionLoadingId(null);
    }
  };

  const moveSector = async (sectorId: string, direction: -1 | 1) => {
    const currentIndex = sectors.findIndex((sector) => sector.id === sectorId);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sectors.length) {
      return;
    }

    const ordered = moveItem(
      sectors.map((item) => item.id),
      currentIndex,
      targetIndex,
    );

    await persistSectorReorder(ordered, sectorId);
  };

  const handleSectorDragStart = (
    event: React.DragEvent<HTMLElement>,
    sectorId: string,
  ) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", sectorId);
    setDraggingSectorId(sectorId);
  };

  const handleSectorDrop = async (targetId: string) => {
    if (!draggingSectorId || draggingSectorId === targetId) {
      setDraggingSectorId(null);
      setDragOverSectorId(null);
      return;
    }

    const ids = sectors.map((sector) => sector.id);
    const fromIndex = ids.indexOf(draggingSectorId);
    const toIndex = ids.indexOf(targetId);

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggingSectorId(null);
      setDragOverSectorId(null);
      return;
    }

    const ordered = moveItem(ids, fromIndex, toIndex);
    const movedId = draggingSectorId;

    setDraggingSectorId(null);
    setDragOverSectorId(null);
    await persistSectorReorder(ordered, movedId);
  };

  const renderCategoryNodes = (nodes: AdminCategoryNode[], depth = 0) => {
    return (
      <div className="space-y-3">
        {nodes.map((node, index) => {
          const depthClass =
            depth === 0 ? "ml-0" : depth === 1 ? "ml-4 sm:ml-8" : "ml-8 sm:ml-16";
          const isCollapsed = collapsedCategoryIds.has(node.id);
          const isLoading = categoryActionLoadingId === node.id;
          const canMoveUp = index > 0;
          const canMoveDown = index < nodes.length - 1;
          const levelContainerClass = getLevelContainerClass(node.level, node.isActive);

          return (
            <article
              key={node.id}
              className={`${depthClass} rounded-xl border p-4 shadow-sm transition-all ${levelContainerClass} ${
                dragOverCategoryId === node.id
                  ? "border-primary ring-2 ring-primary/20"
                  : ""
              }`}
              draggable
              onDragEnd={(event) => {
                event.stopPropagation();
                setDraggingCategory(null);
                setDragOverCategoryId(null);
              }}
              onDragOver={(event) => {
                event.stopPropagation();
                if (!draggingCategory || draggingCategory.parentId !== node.parentId) {
                  return;
                }

                event.preventDefault();
                setDragOverCategoryId(node.id);
              }}
              onDragStart={(event) => handleCategoryDragStart(event, node)}
              onDrop={async (event) => {
                event.stopPropagation();
                event.preventDefault();
                await handleCategoryDrop(nodes, node.id, node.parentId);
              }}
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {node.children.length > 0 ? (
                      <button
                        className="rounded-md border border-outline-variant bg-white px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant hover:bg-slate-50"
                        onClick={() => toggleCategoryChildren(node.id)}
                        type="button"
                      >
                        {isCollapsed ? "Aç" : "Kapat"}
                      </button>
                    ) : null}

                    {node.children.length > 0 ? (
                      <button
                        className="text-sm font-bold text-on-surface underline-offset-2 hover:underline"
                        onClick={() => toggleCategoryChildren(node.id)}
                        type="button"
                      >
                        {node.name}
                      </button>
                    ) : (
                      <h3 className="text-sm font-bold text-on-surface">{node.name}</h3>
                    )}

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getLevelBadgeClass(node.level)}`}
                    >
                      {getLevelLabel(node.level)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        node.isActive
                          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                      }`}
                    >
                      {node.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-700">
                    Slug: {node.slug} | Menü sırası: {node.sortOrder}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canMoveUp || isLoading}
                    onClick={() => moveCategory(node.id, -1)}
                    type="button"
                  >
                    Yukarı
                  </button>
                  <button
                    className="rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canMoveDown || isLoading}
                    onClick={() => moveCategory(node.id, 1)}
                    type="button"
                  >
                    Aşağı
                  </button>
                  {node.level < 3 ? (
                    <button
                      className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                      onClick={() => startCreateCategory(node.id)}
                      type="button"
                    >
                      Alt Ekle
                    </button>
                  ) : null}
                  <button
                    className="rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-slate-50"
                    onClick={() => startEditCategory(node)}
                    type="button"
                  >
                    Düzenle
                  </button>
                  <button
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      node.isActive
                        ? "border border-orange-600 bg-orange-500 text-white hover:bg-orange-600"
                        : "border border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600"
                    }`}
                    disabled={isLoading}
                    onClick={() => handleToggleCategoryActive(node)}
                    type="button"
                  >
                    {node.isActive ? "Pasife Al" : "Aktife Al"}
                  </button>
                  <button
                    className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                    disabled={isLoading}
                    onClick={() => handleDeleteCategory(node)}
                    type="button"
                  >
                    Sil
                  </button>
                </div>
              </div>

              {node.children.length > 0 && !isCollapsed ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {renderCategoryNodes(node.children, depth + 1)}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 text-slate-900">
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              onClick={() => startCreateCategory(null)}
              type="button"
            >
              Yeni Ana Kategori
            </button>
            <button
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              onClick={startCreateSector}
              type="button"
            >
              Yeni Sektör
            </button>
          </div>
        }
        description="Kategori ve sektörleri veritabanından yönetin. Sıralama otomatik olarak çakışmasız ve boşluksuz korunur."
        title="Kategori ve Sektörler"
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <section className="self-start overflow-hidden rounded-xl border-2 border-sky-300 bg-gradient-to-br from-sky-100/95 to-white shadow-sm xl:col-span-2">
          <button
            className="flex w-full items-start justify-between gap-3 border-b border-sky-200 px-6 py-4 text-left hover:bg-white/60"
            onClick={() => setIsCategoryListCollapsed((current) => !current)}
            type="button"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Kategori Ağacı</h3>
              <p className="text-sm font-medium text-slate-700">
                Sürükle bırak veya yukarı-aşağı ile sıralayın. Her düğüm açılıp kapanabilir.
              </p>
            </div>
            <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
              {isCategoryListCollapsed ? "Listeyi Aç" : "Listeyi Kapat"}
            </span>
          </button>

          {!isCategoryListCollapsed ? (
            <div className="space-y-3 p-4 sm:p-6">
              {isCategoriesLoading ? (
                <p className="text-sm font-medium text-slate-700">Kategoriler yükleniyor...</p>
              ) : null}

              {isCategoriesError ? (
                <p className="text-sm text-red-600">Kategori verileri yüklenirken hata oluştu.</p>
              ) : null}

              {!isCategoriesLoading && !isCategoriesError && categoryTree.length === 0 ? (
                <p className="text-sm font-medium text-slate-700">Gösterilecek kategori bulunamadı.</p>
              ) : null}

              {!isCategoriesLoading && !isCategoriesError && categoryTree.length > 0
                ? renderCategoryNodes(categoryTree)
                : null}
            </div>
          ) : null}
        </section>

        <section className="self-start overflow-hidden rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-100/90 to-white shadow-sm">
          <button
            className="flex w-full items-start justify-between gap-3 border-b border-indigo-200 px-6 py-4 text-left hover:bg-white/60"
            onClick={() => setIsCategoryFormCollapsed((current) => !current)}
            type="button"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingCategoryId ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Sıra alanını boş bırakabilirsiniz. Sistem otomatik olarak çakışmasız sıralar.
              </p>
            </div>
            <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
              {isCategoryFormCollapsed ? "Formu Aç" : "Formu Kapat"}
            </span>
          </button>

          {!isCategoryFormCollapsed ? (
            <div className="p-6">
              <div className="rounded-xl border-2 border-indigo-200 bg-white/90 p-4">
                <form className="space-y-4" onSubmit={handleCategorySubmit}>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant" htmlFor="category-name">
                Kategori Adı
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                id="category-name"
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Örn: Elektronik ve Teknoloji"
                type="text"
                value={categoryForm.name}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant" htmlFor="category-parent">
                Üst Kategori
              </label>
              <select
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                id="category-parent"
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, parentId: event.target.value }))
                }
                value={categoryForm.parentId}
              >
                <option value="">Ana kategori (üst yok)</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant" htmlFor="category-order">
                Menü Sırası (Opsiyonel)
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                id="category-order"
                min={0}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
                placeholder="Boş bırak: otomatik"
                type="number"
                value={categoryForm.sortOrder}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-on-surface">
              <input
                checked={categoryForm.isActive}
                className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Aktif olarak göster
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCategorySubmitting}
                type="submit"
              >
                {isCategorySubmitting
                  ? "Kaydediliyor..."
                  : editingCategoryId
                    ? "Güncellemeyi Kaydet"
                    : "Kategoriyi Ekle"}
              </button>
              <button
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-slate-50"
                onClick={() => startCreateCategory(null)}
                type="button"
              >
                Temizle
              </button>
            </div>
                </form>
              </div>

              {categoryFeedback ? (
                <p
                  className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                    categoryFeedback.tone === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {categoryFeedback.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <section className="self-start overflow-hidden rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-100/95 to-white shadow-sm xl:col-span-2">
          <button
            className="flex w-full items-start justify-between gap-3 border-b border-emerald-200 px-6 py-4 text-left hover:bg-white/60"
            onClick={() => setIsSectorListCollapsed((current) => !current)}
            type="button"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Sektör Listesi</h3>
              <p className="text-sm font-medium text-slate-700">
                Sürükle bırak, yukarı-aşağı ve tek tık aktif/pasif işlemleri desteklenir.
              </p>
            </div>
            <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
              {isSectorListCollapsed ? "Listeyi Aç" : "Listeyi Kapat"}
            </span>
          </button>

          {!isSectorListCollapsed ? (
            <div className="p-4 sm:p-6">
              {isSectorsLoading ? (
                <p className="text-sm font-medium text-slate-700">Sektörler yükleniyor...</p>
              ) : null}

              {isSectorsError ? (
                <p className="text-sm text-red-600">Sektör verileri yüklenirken hata oluştu.</p>
              ) : null}

              {!isSectorsLoading && !isSectorsError && sectors.length === 0 ? (
                <p className="text-sm font-medium text-slate-700">Gösterilecek sektör bulunamadı.</p>
              ) : null}

              {!isSectorsLoading && !isSectorsError && sectors.length > 0 ? (
                <div className="space-y-3">
                  {sectors.map((sector, index) => {
                    const isLoading = sectorActionLoadingId === sector.id;

                    return (
                      <article
                        key={sector.id}
                        className={`rounded-xl border-2 p-4 shadow-sm transition-all ${
                          sector.isActive
                            ? "border-emerald-300 bg-gradient-to-r from-emerald-50/85 to-white"
                            : "border-rose-300 bg-gradient-to-r from-rose-50/95 to-white"
                        } ${
                          dragOverSectorId === sector.id
                            ? "border-primary ring-2 ring-primary/20"
                            : ""
                        }`}
                        draggable
                        onDragEnd={(event) => {
                          event.stopPropagation();
                          setDraggingSectorId(null);
                          setDragOverSectorId(null);
                        }}
                        onDragOver={(event) => {
                          event.stopPropagation();
                          if (!draggingSectorId) {
                            return;
                          }

                          event.preventDefault();
                          setDragOverSectorId(sector.id);
                        }}
                        onDragStart={(event) => handleSectorDragStart(event, sector.id)}
                        onDrop={async (event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          await handleSectorDrop(sector.id);
                        }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-900">{sector.name}</h4>
                            <p className="text-[11px] font-medium text-slate-700">
                              Slug: {sector.slug} | Menü sırası: {sector.sortOrder}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                sector.isActive
                                  ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                                  : "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                              }`}
                            >
                              {sector.isActive ? "Aktif" : "Pasif"}
                            </span>
                            <button
                              className="rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={index === 0 || isLoading}
                              onClick={() => moveSector(sector.id, -1)}
                              type="button"
                            >
                              Yukarı
                            </button>
                            <button
                              className="rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={index === sectors.length - 1 || isLoading}
                              onClick={() => moveSector(sector.id, 1)}
                              type="button"
                            >
                              Aşağı
                            </button>
                            <button
                              className="rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-slate-50"
                              onClick={() => startEditSector(sector)}
                              type="button"
                            >
                              Düzenle
                            </button>
                            <button
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                                sector.isActive
                                  ? "border border-orange-600 bg-orange-500 text-white hover:bg-orange-600"
                                  : "border border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600"
                              }`}
                              disabled={isLoading}
                              onClick={() => handleToggleSectorActive(sector)}
                              type="button"
                            >
                              {sector.isActive ? "Pasife Al" : "Aktife Al"}
                            </button>
                            <button
                              className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                              disabled={isLoading}
                              onClick={() => handleDeleteSector(sector)}
                              type="button"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="self-start overflow-hidden rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-100/95 to-white shadow-sm">
          <button
            className="flex w-full items-start justify-between gap-3 border-b border-amber-200 px-6 py-4 text-left hover:bg-white/60"
            onClick={() => setIsSectorFormCollapsed((current) => !current)}
            type="button"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingSectorId ? "Sektör Düzenle" : "Yeni Sektör Ekle"}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Sıra alanı boş bırakılırsa sistem sektörü otomatik olarak uygun konuma taşır.
              </p>
            </div>
            <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
              {isSectorFormCollapsed ? "Formu Aç" : "Formu Kapat"}
            </span>
          </button>

          {!isSectorFormCollapsed ? (
            <div className="p-6">
              <div className="rounded-xl border-2 border-amber-200 bg-white/90 p-4">
                <form className="space-y-4" onSubmit={handleSectorSubmit}>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant" htmlFor="sector-name">
                Sektör Adı
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                id="sector-name"
                onChange={(event) =>
                  setSectorForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Örn: Hastaneler"
                type="text"
                value={sectorForm.name}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant" htmlFor="sector-order">
                Menü Sırası (Opsiyonel)
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                id="sector-order"
                min={0}
                onChange={(event) =>
                  setSectorForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
                placeholder="Boş bırak: otomatik"
                type="number"
                value={sectorForm.sortOrder}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-on-surface">
              <input
                checked={sectorForm.isActive}
                className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                onChange={(event) =>
                  setSectorForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Aktif olarak göster
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSectorSubmitting}
                type="submit"
              >
                {isSectorSubmitting
                  ? "Kaydediliyor..."
                  : editingSectorId
                    ? "Güncellemeyi Kaydet"
                    : "Sektörü Ekle"}
              </button>
              <button
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-slate-50"
                onClick={startCreateSector}
                type="button"
              >
                Temizle
              </button>
            </div>
                </form>
              </div>

              {sectorFeedback ? (
                <p
                  className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                    sectorFeedback.tone === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {sectorFeedback.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
