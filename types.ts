export enum AppStep {
  ELIGIBILITY = 0,
  DISCLAIMER = 1,
  COMPLAINANT_DETAILS = 2,
  OPPOSITE_PARTY_DETAILS = 3,
  TRANSACTION_DETAILS = 4,
  GRIEVANCE_NARRATIVE = 5,
  RELIEF_SOUGHT = 6,
  REVIEW_AND_GENERATE = 7,
  DOWNLOAD = 8
}

export interface Complainant {
  name: string;
  fatherName: string; // Required for legal filings in India (S/o, W/o, D/o)
  address: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
  email: string;
}

export interface OppositeParty {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Transaction {
  invoiceNumber: string;
  date: string;
  amount: string;
  productDescription: string;
  paymentMethod: string;
}

export interface ComplaintData {
  complainant: Complainant;
  oppositeParty: OppositeParty;
  transaction: Transaction;
  grievanceRaw: string; // The user's rough notes
  reliefRaw: string; // What they want (refund, compensation)
  generatedFacts?: string; // AI generated legal text
  generatedPrayer?: string; // AI generated prayer clause
}

export const INITIAL_COMPLAINT_DATA: ComplaintData = {
  complainant: {
    name: '', fatherName: '', address: '', city: '', state: '', pincode: '', mobile: '', email: ''
  },
  oppositeParty: {
    name: '', address: '', city: '', state: '', pincode: ''
  },
  transaction: {
    invoiceNumber: '', date: '', amount: '', productDescription: '', paymentMethod: ''
  },
  grievanceRaw: '',
  reliefRaw: ''
};