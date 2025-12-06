import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, RotateCcw, FileText } from 'lucide-react';

interface EligibilityCheckProps {
  onComplete: () => void;
}

type EligibilityStatus = 'GREEN' | 'AMBER' | 'RED';

interface Question {
  id: string;
  text: string;
  subtext: string;
  requiredForGreen: boolean; // if false, No = RED. If true, No = AMBER/Warning
  isFatal: boolean; // If true, No = RED (Stop)
  warningMsg?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'personal',
    text: "Did you buy this for personal use?",
    subtext: "If you bought it for resale or commercial profit, select No.",
    requiredForGreen: true,
    isFatal: true,
    warningMsg: "The Consumer Protection Act generally excludes goods bought for commercial purposes or resale."
  },
  {
    id: 'paid',
    text: "Did you pay for it (or promise to pay)?",
    subtext: "Free services (without any charge) are usually not covered.",
    requiredForGreen: true,
    isFatal: true,
    warningMsg: "Complaints regarding completely free services are generally not maintainable under the Act."
  },
  {
    id: 'time',
    text: "Did the issue happen within the last 2 years?",
    subtext: "There is a 2-year time limit for filing complaints.",
    requiredForGreen: true,
    isFatal: false,
    warningMsg: "You are outside the standard time limit. You can still file, but you must include a 'Condonation of Delay' application explaining why it is late."
  },
  {
    id: 'notice',
    text: "Have you contacted the company to fix it?",
    subtext: "Courts prefer if you have tried to resolve it amicably first.",
    requiredForGreen: false, // It's okay if not, just amber
    isFatal: false,
    warningMsg: "It is highly recommended to send a formal complaint or legal notice before approaching the court to show you tried."
  },
  {
    id: 'proof',
    text: "Do you have proof of purchase?",
    subtext: "Bill, Invoice, Screenshot, Email, or Bank Statement.",
    requiredForGreen: true,
    isFatal: false,
    warningMsg: "Without proof of purchase, it is very difficult to prove you are a consumer. Try to find bank statements or emails."
  }
];

const EligibilityCheck: React.FC<EligibilityCheckProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isRed, setIsRed] = useState(false);
  const [redReason, setRedReason] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answerYes: boolean) => {
    const question = QUESTIONS[currentQuestionIndex];

    if (!answerYes) {
      if (question.isFatal) {
        setIsRed(true);
        setRedReason(question.warningMsg || "Not suitable for consumer court.");
        setShowResult(true);
        return;
      } else {
        if (question.warningMsg) {
          setWarnings([...warnings, question.warningMsg]);
        }
      }
    }

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResult(true);
    }
  };

  const getStatus = (): EligibilityStatus => {
    if (isRed) return 'RED';
    if (warnings.length > 0) return 'AMBER';
    return 'GREEN';
  };

  const renderResult = () => {
    const status = getStatus();
    const needsNotice = warnings.some(w => w.includes("legal notice"));

    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center">
          {status === 'GREEN' && <div className="p-4 bg-green-100 rounded-full"><CheckCircle className="w-12 h-12 text-green-600" /></div>}
          {status === 'AMBER' && <div className="p-4 bg-orange-100 rounded-full"><AlertTriangle className="w-12 h-12 text-orange-600" /></div>}
          {status === 'RED' && <div className="p-4 bg-red-100 rounded-full"><XCircle className="w-12 h-12 text-red-600" /></div>}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {status === 'GREEN' && "Good to Go!"}
            {status === 'AMBER' && "Proceed with Caution"}
            {status === 'RED' && "Not Recommended"}
          </h2>
          <p className="text-slate-600">
            {status === 'GREEN' && "Your case appears to meet the basic criteria for a consumer complaint."}
            {status === 'AMBER' && "You can file a complaint, but there are some weaknesses in your case:"}
            {status === 'RED' && "Based on your answers, this case may not be maintainable in consumer court."}
          </p>
        </div>

        {status === 'AMBER' && (
          <div className="bg-orange-50 text-left p-4 rounded-lg border border-orange-200 space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className="flex gap-2 items-start text-sm text-orange-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {status === 'RED' && (
          <div className="bg-red-50 text-left p-4 rounded-lg border border-red-200">
             <div className="flex gap-2 items-start text-sm text-red-800">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{redReason}</span>
              </div>
          </div>
        )}

        {/* Reassurance about Legal Notice */}
        {status !== 'RED' && needsNotice && (
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left flex gap-3 items-start">
             <div className="bg-blue-100 p-1.5 rounded-full shrink-0">
               <FileText className="w-4 h-4 text-blue-600" />
             </div>
             <div>
               <p className="text-sm font-bold text-blue-900">Don't have a Legal Notice yet?</p>
               <p className="text-sm text-blue-800 mt-1">
                 Don't worry! Click the button below to enter your details, and we will generate a formal <strong>Legal Notice</strong> for you to send first.
               </p>
             </div>
           </div>
        )}

        <div className="pt-4 flex flex-col gap-3">
          {status !== 'RED' ? (
            <button 
              onClick={onComplete}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-6 rounded-lg shadow-md flex items-center justify-center gap-2"
            >
              Start Drafting {needsNotice ? "(Notice & Complaint)" : "Complaint"} <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={onComplete}
              className="w-full bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2"
            >
              I understand, Proceed Anyway
            </button>
          )}
          
          <button 
            onClick={() => window.location.reload()}
            className="text-slate-500 text-sm hover:underline flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Check Eligibility Again
          </button>
        </div>
      </div>
    );
  };

  if (showResult) {
    return renderResult();
  }

  const question = QUESTIONS[currentQuestionIndex];

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Eligibility Check</span>
        <h2 className="text-xl font-bold text-slate-800">{question.text}</h2>
        <p className="text-slate-500 text-sm">{question.subtext}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => handleAnswer(true)}
          className="flex items-center justify-between p-5 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <span className="font-semibold text-slate-700 group-hover:text-blue-700">Yes</span>
          <CheckCircle className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
        </button>
        
        <button 
          onClick={() => handleAnswer(false)}
          className="flex items-center justify-between p-5 border rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
        >
          <span className="font-semibold text-slate-700 group-hover:text-red-700">No</span>
          <XCircle className="w-5 h-5 text-slate-300 group-hover:text-red-500" />
        </button>
      </div>

      <div className="flex justify-center gap-1 mt-8">
        {QUESTIONS.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all ${
              idx === currentQuestionIndex ? 'w-8 bg-blue-600' : 
              idx < currentQuestionIndex ? 'w-2 bg-blue-200' : 'w-2 bg-slate-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default EligibilityCheck;