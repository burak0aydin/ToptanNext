import type {
  SupplierApplicationDocumentType,
} from '@toptannext/types';
import type { SupplierApplicationRecord } from './supplier-application.api';

const REQUIRED_DOCUMENT_TYPES: SupplierApplicationDocumentType[] = [
  'TAX_CERTIFICATE',
  'SIGNATURE_CIRCULAR',
  'TRADE_REGISTRY_GAZETTE',
  'ACTIVITY_CERTIFICATE',
];

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isStepOneCompleted(application: SupplierApplicationRecord): boolean {
  return (
    hasText(application.companyName)
    && hasText(application.companyType)
    && hasText(application.vknOrTckn)
    && hasText(application.taxOffice)
    && hasText(application.mersisNo)
    && hasText(application.activitySector)
    && hasText(application.city)
    && hasText(application.district)
  );
}

export function isStepTwoCompleted(application: SupplierApplicationRecord): boolean {
  const hasWarehouseAddress = application.warehouseSameAsHeadquarters
    ? hasText(application.headquartersAddress)
    : hasText(application.warehouseAddress);

  return (
    hasText(application.companyIban)
    && hasText(application.kepAddress)
    && application.isEInvoiceTaxpayer !== null
    && hasText(application.businessPhone)
    && hasText(application.headquartersAddress)
    && application.warehouseSameAsHeadquarters !== null
    && hasWarehouseAddress
    && hasText(application.contactFirstName)
    && hasText(application.contactLastName)
    && hasText(application.contactRole)
    && hasText(application.contactPhone)
    && hasText(application.contactEmail)
  );
}

export function isStepThreeCompleted(application: SupplierApplicationRecord): boolean {
  const uploadedTypes = new Set(application.documents.map((document) => document.documentType));
  const hasAllRequiredDocuments = REQUIRED_DOCUMENT_TYPES.every((type) => uploadedTypes.has(type));

  return (
    hasAllRequiredDocuments
    && application.approvedSupplierAgreement
    && application.approvedKvkkAgreement
  );
}

export function shouldRedirectSupplierApplicationToResult(
  application: SupplierApplicationRecord,
): boolean {
  if (application.reviewStatus === 'APPROVED') {
    return true;
  }

  if (application.reviewStatus === 'PENDING' && isStepThreeCompleted(application)) {
    return true;
  }

  return false;
}
