import React, { useState, useEffect } from 'react';
import { AppStep, ComplaintData, INITIAL_COMPLAINT_DATA } from '../types';
import { draftLegalContent } from '../services/geminiService';
import { generateComplaintPDF, generateLegalNoticePDF } from '../services/pdfService';
import { ArrowLeft, ArrowRight, FileText, CheckCircle, AlertTriangle, Download, Scale, Save } from 'lucide-react';
import EligibilityCheck from './EligibilityCheck';

const StepWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.ELIGIBILITY);
  const [data, setData] = useState<ComplaintData>(INITIAL_COMPLAINT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('justice_friend_draft_data');
      const savedStep = localStorage.getItem('justice_friend_draft_step');
      
      if (savedData) {
        setData(JSON.parse(savedData));
      }
      if (savedStep) {
        // Don't restore purely to "Download" or "Review" without context, default to last editing step if tricky
        // But for simplicity, we restore exactly where they were.
        setCurrentStep(Number(savedStep));
      }
      setIsRestored(true);
    } catch (e) {
      console.error("Failed to restore draft", e);
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (isRestored) {
      localStorage.setItem('justice_friend_draft_data', JSON.stringify(data));
      localStorage.setItem('justice_friend_draft_step', String(currentStep));
    }
  }, [data, currentStep, isRestored]);

  const updateData = (section: keyof ComplaintData, key: string, value: string) => {
    if (typeof data[section] === 'object' && section !== 'generatedFacts' && section !== 'generatedPrayer') {
      setData({
        ...data,
        [section]: {
          ...(data[section] as any),
          [key]: value
        }
      });
    } else {
      setData({ ...data, [section]: value });
    }
    // Clear error when user types
    if (error) setError(null);
  };

  const validateStep = (): boolean => {
    const isNonEnglish = (str: string) => /[^\u0000-\u007F]+/.test(str);

    switch (currentStep) {
      case AppStep.COMPLAINANT_DETAILS:
        if (!data.complainant.name.trim() || !data.complainant.city.trim() || !data.complainant.state.trim() || !data.complainant.mobile.trim()) {
          setError("Please fill in your Name, City, State, and Mobile Number.");
          return false;
        }
        if (isNonEnglish(data.complainant.name) || isNonEnglish(data.complainant.city)) {
           setError("Please use English only. The court PDF system does not support other languages yet.");
           return false;
        }
        break;
      case AppStep.OPPOSITE_PARTY_DETAILS:
        if (!data.oppositeParty.name.trim() || !data.oppositeParty.address.trim()) {
          setError("Please fill in the Company Name and Address.");
          return false;
        }
        break;
      case AppStep.TRANSACTION_DETAILS:
        if (!data.transaction.productDescription.trim() || !data.transaction.amount.trim() || !data.transaction.date.trim()) {
          setError("Please fill in Product Name, Date of Purchase, and Amount.");
          return false;
        }
        // Basic amount validation (allow digits, commas, dots)
        if (!/^[\d,.]+$/.test(data.transaction.amount.trim())) {
          setError("Amount should contain only numbers (e.g. 10000).");
          return false;
        }
        break;
      case AppStep.GRIEVANCE_NARRATIVE:
        if (data.grievanceRaw.trim().length < 20) {
          setError("Please describe the issue in at least a few words (min 20 chars).");
          return false;
        }
        if (isNonEnglish(data.grievanceRaw)) {
          setError("Please write your grievance in English. The PDF generator currently supports English characters only.");
          return false;
        }
        break;
      case AppStep.RELIEF_SOUGHT:
        if (!data.reliefRaw.trim()) {
           setError("Please specify what relief you want (refund, replacement, etc).");
           return false;
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    setError(null);
    
    if (!validateStep()) {
      return;
    }

    if (currentStep === AppStep.RELIEF_SOUGHT) {
      // AI Generation Trigger
      setLoading(true);
      try {
        const draft = await draftLegalContent(data);
        setData(prev => ({
          ...prev,
          generatedFacts: draft.facts,
          generatedPrayer: draft.prayer
        }));
        setCurrentStep(currentStep + 1);
      } catch (e) {
        setError("Failed to draft complaint. Please try again or check your internet.");
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    setError(null);
  };

  const renderDisclaimer = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r">
        <h3 className="flex items-center text-lg font-bold text-orange-800 mb-2">
          <AlertTriangle className="w-5 h-5 mr-2" /> Important Disclaimer
        </h3>
        <p className="text-sm text-orange-700 leading-relaxed">
          Justice Friend is an <strong>information and document preparation tool</strong>. We are NOT a law firm and do not provide legal advice, representation, or opinions.
        </p>
        <p className="text-sm text-orange-700 mt-2 leading-relaxed">
          The generated complaint is based on the information you provide. You are responsible for reviewing it before filing. Consumer disputes can be complex; consider consulting a lawyer for high-value claims.
        </p>
      </div>
      <div className="flex items-start gap-3 p-3 bg-white rounded shadow-sm border border-slate-200">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
        <p className="text-slate-600 text-sm">I understand this tool helps me draft a complaint myself, and I am not hiring a lawyer through this app.</p>
      </div>
    </div>
  );

  const renderComplainantForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Your Details (Complainant)</h2>
      <p className="text-slate-500 text-sm">These details are required by the court to identify you.</p>
      
      <div>
        <input type="text" placeholder="Full Name *" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          value={data.complainant.name} onChange={(e) => updateData('complainant', 'name', e.target.value)} />
      </div>
      
      <input type="text" placeholder="Father's / Husband's Name" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
        value={data.complainant.fatherName} onChange={(e) => updateData('complainant', 'fatherName', e.target.value)} />
      
      <input type="text" placeholder="Full Address (House No, Street)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
        value={data.complainant.address} onChange={(e) => updateData('complainant', 'address', e.target.value)} />
      
      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="City / District *" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          value={data.complainant.city} onChange={(e) => updateData('complainant', 'city', e.target.value)} />
        <input type="text" placeholder="State *" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          value={data.complainant.state} onChange={(e) => updateData('complainant', 'state', e.target.value)} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="Pincode" className="w-full p-3 border rounded-lg outline-none" 
          value={data.complainant.pincode} onChange={(e) => updateData('complainant', 'pincode', e.target.value)} />
        <input type="tel" placeholder="Mobile Number *" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          value={data.complainant.mobile} onChange={(e) => updateData('complainant', 'mobile', e.target.value)} />
      </div>

      <input type="email" placeholder="Email Address (Optional but Recommended)" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          value={data.complainant.email} onChange={(e) => updateData('complainant', 'email', e.target.value)} />
    </div>
  );

  const renderOppositePartyForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Company/Person Details</h2>
      <p className="text-slate-500 text-sm">Who are you complaining against? (Opposite Party)</p>
      
      <input type="text" placeholder="Company Name / Shop Name / Person Name *" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
        value={data.oppositeParty.name} onChange={(e) => updateData('oppositeParty', 'name', e.target.value)} />
      
      <textarea placeholder="Registered Address of Company/Shop *" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24" 
        value={data.oppositeParty.address} onChange={(e) => updateData('oppositeParty', 'address', e.target.value)} />
      
      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="City" className="w-full p-3 border rounded-lg outline-none" 
          value={data.oppositeParty.city} onChange={(e) => updateData('oppositeParty', 'city', e.target.value)} />
        <input type="text" placeholder="State" className="w-full p-3 border rounded-lg outline-none" 
          value={data.oppositeParty.state} onChange={(e) => updateData('oppositeParty', 'state', e.target.value)} />
      </div>
      <input type="text" placeholder="Pincode" className="w-full p-3 border rounded-lg outline-none" 
          value={data.oppositeParty.pincode} onChange={(e) => updateData('oppositeParty', 'pincode', e.target.value)} />
    </div>
  );

  const renderTransactionDetails = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Transaction Details</h2>
      <p className="text-slate-500 text-sm">Details about the purchase or service.</p>
      
      <input type="text" placeholder="Product / Service Name (e.g. Samsung TV, Flight Ticket) *" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
        value={data.transaction.productDescription} onChange={(e) => updateData('transaction', 'productDescription', e.target.value)} />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Date of Purchase *</label>
          <input type="date" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            value={data.transaction.date} onChange={(e) => updateData('transaction', 'date', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Amount Paid (INR) *</label>
          <input type="text" placeholder="10000" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            value={data.transaction.amount} onChange={(e) => updateData('transaction', 'amount', e.target.value)} />
        </div>
      </div>
      
      <input type="text" placeholder="Invoice / Order ID Number" className="w-full p-3 border rounded-lg outline-none" 
        value={data.transaction.invoiceNumber} onChange={(e) => updateData('transaction', 'invoiceNumber', e.target.value)} />
    </div>
  );

  const renderGrievance = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">What happened?</h2>
      <p className="text-slate-500 text-sm">Describe the issue simply.</p>
      
      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span><strong>Important:</strong> Please write in <strong>English Only</strong>. Our PDF generator currently does not support Indian regional languages (Hindi, Marathi, etc.) and they will appear as garbage text.</span>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 mb-2">
        <strong>Tip:</strong> Mention when the defect started, how many times you called them, and their refusal to fix it.
      </div>

      <textarea 
        placeholder="Example: I bought the TV on 1st Jan. It stopped working on 10th Jan. I called support 5 times (Ref No: 12345). A technician came but asked for money. They are now refusing to replace it." 
        className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-48 leading-relaxed" 
        value={data.grievanceRaw} 
        onChange={(e) => updateData('grievanceRaw', '', e.target.value)} 
      />
    </div>
  );

  const renderRelief = () => {
    return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">What do you want?</h2>
      <p className="text-slate-500 text-sm">What outcome will satisfy you?</p>
      
      <textarea 
        placeholder="Example: I want a full refund of Rs. 20,000 along with Rs. 5,000 for mental harassment." 
        className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 leading-relaxed" 
        value={data.reliefRaw} 
        onChange={(e) => updateData('reliefRaw', '', e.target.value)} 
      />
      
      <div className="mt-6 flex flex-col items-center justify-center gap-2">
        <button 
          onClick={handleNext} 
          disabled={loading}
          className={`font-semibold py-4 px-8 rounded-full shadow-lg flex items-center gap-3 transition-all w-full justify-center ${
            loading
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <span className="animate-pulse">Drafting with AI...</span>
          ) : (
            <>
              <Scale className="w-5 h-5" /> Generate Complaint Draft
            </>
          )}
        </button>
      </div>
      <p className="text-center text-xs text-slate-400 mt-2">This usually takes about 5-10 seconds.</p>
    </div>
  )};

  const renderReview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Draft Ready!</h2>
        <p className="text-slate-500">Please review and <strong>edit</strong> the sections below if needed.</p>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="font-bold text-slate-700">Statement of Facts</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Editable</span>
        </div>
        <textarea 
          className="w-full h-64 p-3 border rounded-lg text-sm text-slate-700 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500"
          value={data.generatedFacts}
          onChange={(e) => setData({...data, generatedFacts: e.target.value})}
        />
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
           <h3 className="font-bold text-slate-700">Prayer (Relief Sought)</h3>
           <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Editable</span>
        </div>
        <textarea 
          className="w-full h-40 p-3 border rounded-lg text-sm text-slate-700 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500"
          value={data.generatedPrayer}
          onChange={(e) => setData({...data, generatedPrayer: e.target.value})}
        />
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <button 
          onClick={() => {
            generateComplaintPDF(data);
            setCurrentStep(AppStep.DOWNLOAD);
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-md flex items-center justify-center gap-2"
        >
          <Scale className="w-5 h-5" /> Download Court Complaint
        </button>

        <button 
          onClick={() => {
            generateLegalNoticePDF(data);
            setCurrentStep(AppStep.DOWNLOAD); 
          }}
          className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" /> Download Legal Notice Only
        </button>
      </div>
    </div>
  );

  const renderDownload = () => (
    <div className="text-center space-y-8 py-8">
      <h2 className="text-2xl font-bold text-slate-800">Files Ready</h2>
      <p className="text-slate-600 max-w-sm mx-auto">
        Your documents have been generated.
      </p>
      
      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <button 
          onClick={() => generateComplaintPDF(data)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" /> Download Court Complaint
        </button>
        <button 
          onClick={() => generateLegalNoticePDF(data)}
          className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" /> Download Legal Notice
        </button>
      </div>

      <div className="bg-slate-50 p-6 rounded-lg text-left max-w-sm mx-auto border border-slate-200">
        <h4 className="font-bold text-slate-800 mb-3">Next Steps:</h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
          <li><strong>Legal Notice:</strong> Send via Registered Post. Keep the receipt. Wait 15 days.</li>
          <li><strong>Court Complaint:</strong> If no reply after 15 days, print 3 copies of the complaint, sign it, and file at the District Commission or online at <strong><a href="https://e-jagriti.gov.in/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">e-jagriti.gov.in</a></strong>.</li>
          <li>Attach copy of Invoice, ID Proof, and Proof of Defect.</li>
        </ul>
      </div>

      <button 
        onClick={() => {
           if(confirm("Are you sure? This will clear your current form data.")) {
              localStorage.removeItem('justice_friend_draft_data');
              localStorage.removeItem('justice_friend_draft_step');
              window.location.reload();
           }
        }}
        className="text-blue-600 font-medium hover:underline"
      >
        Start a New Complaint
      </button>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case AppStep.ELIGIBILITY: return <EligibilityCheck onComplete={() => setCurrentStep(AppStep.DISCLAIMER)} />;
      case AppStep.DISCLAIMER: return renderDisclaimer();
      case AppStep.COMPLAINANT_DETAILS: return renderComplainantForm();
      case AppStep.OPPOSITE_PARTY_DETAILS: return renderOppositePartyForm();
      case AppStep.TRANSACTION_DETAILS: return renderTransactionDetails();
      case AppStep.GRIEVANCE_NARRATIVE: return renderGrievance();
      case AppStep.RELIEF_SOUGHT: return renderRelief();
      case AppStep.REVIEW_AND_GENERATE: return renderReview();
      case AppStep.DOWNLOAD: return renderDownload();
      default: return null;
    }
  };

  const getProgress = () => {
    return ((currentStep + 1) / 9) * 100;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white min-h-[85vh] md:min-h-auto md:rounded-2xl md:shadow-xl overflow-hidden flex flex-col">
      {/* Progress Bar */}
      <div className="h-2 bg-slate-100 w-full">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out" 
          style={{ width: `${getProgress()}%` }}
        />
      </div>

      {/* Header for Step */}
      {currentStep !== AppStep.DOWNLOAD && currentStep !== AppStep.REVIEW_AND_GENERATE && currentStep !== AppStep.ELIGIBILITY && (
        <div className="px-6 pt-6 pb-2 flex justify-between items-center">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Step {currentStep} of 8
          </span>
          {isRestored && currentStep > AppStep.DISCLAIMER && (
             <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wider">
               <Save className="w-3 h-3" /> Auto-saved
             </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
        {getStepContent()}
      </div>

      {/* Navigation Footer - Hide on Eligibility, Relief (Generate button is there), Review, Download */}
      {currentStep !== AppStep.ELIGIBILITY && currentStep !== AppStep.RELIEF_SOUGHT && currentStep !== AppStep.REVIEW_AND_GENERATE && currentStep !== AppStep.DOWNLOAD && (
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center sticky bottom-0">
          <button 
            onClick={handleBack} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-slate-600 hover:bg-slate-200`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all active:scale-95"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default StepWizard;