import React from 'react';
import StepWizard from './components/StepWizard';
import { ShieldCheck, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Justice Friend</h1>
              <p className="text-xs text-slate-500 font-medium">Consumer Complaint Generator</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            <BookOpen className="w-3 h-3" />
            <span>Based on Consumer Protection Act, 2019</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:py-8">
        <div className="md:grid md:grid-cols-12 md:gap-8">
          
          {/* Sidebar / Info (Desktop only) */}
          <div className="hidden md:block md:col-span-4 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4">How it works</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p className="text-sm text-slate-600">Enter details of the purchase and the issue.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p className="text-sm text-slate-600">Our AI converts your story into legal "Facts" & "Prayer".</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <p className="text-sm text-slate-600">Download the PDF, sign it, and file it.</p>
                </li>
              </ul>
            </div>

            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="font-bold text-orange-900 mb-2">Cost: Free</h3>
              <p className="text-sm text-orange-800">
                This tool is free to use. Filing fees in consumer courts vary but are generally nominal (often free for claims under ₹5 Lakhs).
              </p>
            </div>
          </div>

          {/* Wizard Container */}
          <div className="col-span-12 md:col-span-8 lg:col-span-7">
            <StepWizard />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm mb-2">
            Built for the Indian Aam Aadmi.
          </p>
          <p className="text-slate-300 text-xs">
            Not legal advice. Use at your own discretion.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;