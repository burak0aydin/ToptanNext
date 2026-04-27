import type { LogisticsApplicationDocumentType } from './logistics-application.api';
import type { LogisticsApplicationRecord } from './logistics-application.api';

const REQUIRED_DOCUMENT_TYPES: LogisticsApplicationDocumentType[] = [
  'TAX_CERTIFICATE',
  'SIGNATURE_CIRCULAR',
  'TRADE_REGISTRY_GAZETTE',
  'ACTIVITY_CERTIFICATE',
  'TRANSPORT_LICENSE',
];

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isStepOneCompleted(application: LogisticsApplicationRecord): boolean {
  return (
    hasText(application.companyName)
    && hasText(application.companyType)
    && hasText(application.vknOrTckn)
    && hasText(application.taxOffice)
    && hasText(application.mersisNo)
    && hasText(application.city)
    && hasText(application.district)
    && hasText(application.logisticsAuthorizationDocumentType)
    && application.mainServiceTypes.length > 0
  );
}

export function isStepTwoCompleted(application: LogisticsApplicationRecord): boolean {
  return (
    hasText(application.companyIban)
    && hasText(application.kepAddress)
    && application.isEInvoiceTaxpayer !== null
    && hasText(application.businessPhone)
    && hasText(application.headquartersAddress)
    && application.serviceRegions.length > 0
    && application.fleetCapacity !== null
    && hasText(application.contactFirstName)
    && hasText(application.contactLastName)
    && hasText(application.contactRole)
    && hasText(application.contactPhone)
    && hasText(application.contactEmail)
  );
}

export function isStepThreeCompleted(application: LogisticsApplicationRecord): boolean {
  const uploadedTypes = new Set(application.documents.map((document) => document.documentType));
  const hasAllRequiredDocuments = REQUIRED_DOCUMENT_TYPES.every((type) => uploadedTypes.has(type));

  return (
    hasAllRequiredDocuments
    && application.approvedSupplierAgreement
    && application.approvedKvkkAgreement
  );
}

export function shouldRedirectLogisticsApplicationToResult(
  application: LogisticsApplicationRecord,
): boolean {
  if (application.reviewStatus === 'APPROVED') {
    return true;
  }

  if (application.reviewStatus === 'PENDING' && isStepThreeCompleted(application)) {
    return true;
  }

  return false;
}
