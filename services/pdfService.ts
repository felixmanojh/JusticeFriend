import jsPDF from 'jspdf';
import { ComplaintData } from "../types";

/**
 * Formats a YYYY-MM-DD date string to DD-MM-YYYY
 */
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}-${month}-${year}`;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

export const generateComplaintPDF = (data: ComplaintData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  let yPos = 20;
  const lineHeight = 6;

  // Helper to add text with safe page breaking
  const addText = (text: string, fontSize: number = 12, fontStyle: string = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    
    // Split text into lines that fit the width
    const lines = doc.splitTextToSize(text, maxLineWidth);
    
    lines.forEach((line: string) => {
      // Check if this single line fits on the page
      if (yPos + lineHeight > 280) {
        doc.addPage();
        yPos = 20;
      }
      
      const xPos = align === 'center' ? pageWidth / 2 : (align === 'right' ? pageWidth - margin : margin);
      doc.text(line, xPos, yPos, { align: align });
      yPos += lineHeight;
    });

    // Add a small paragraph spacing after the block
    yPos += 4;
  };

  const addSpace = (amount: number = 10) => {
    if (yPos + amount > 280) {
        doc.addPage();
        yPos = 20;
    } else {
        yPos += amount;
    }
  };

  // --- Title Section ---
  addText("BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION", 14, 'bold', 'center');
  addText(`AT ${data.complainant.city.toUpperCase()}`, 14, 'bold', 'center');
  addSpace(10);

  // --- Parties ---
  addText("IN THE MATTER OF:", 12, 'bold', 'left');
  addSpace(5);
  addText(`${data.complainant.name}`, 12, 'bold');
  addText(`S/o, D/o, W/o: ${data.complainant.fatherName}`);
  addText(`R/o: ${data.complainant.address}, ${data.complainant.city}, ${data.complainant.state} - ${data.complainant.pincode}`);
  addText(`Mobile: ${data.complainant.mobile}`);
  if (data.complainant.email) addText(`Email: ${data.complainant.email}`);
  addSpace(5);
  addText("... COMPLAINANT", 12, 'bold', 'right');
  
  addSpace(5);
  addText("VERSUS", 12, 'bold', 'center');
  addSpace(5);

  addText(`${data.oppositeParty.name}`, 12, 'bold');
  addText(`Address: ${data.oppositeParty.address}, ${data.oppositeParty.city}, ${data.oppositeParty.state} - ${data.oppositeParty.pincode}`);
  addSpace(5);
  addText("... OPPOSITE PARTY / RESPONDENT", 12, 'bold', 'right');

  addSpace(10);

  // --- Subject ---
  addText(`COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019`, 12, 'bold', 'center');
  addSpace(10);

  addText("RESPECTFULLY SHOWETH:", 12, 'bold');
  addSpace(5);

  // --- Body ---
  // Jurisdiction (Boilerplate)
  addText(`1. That this Hon'ble Commission has the territorial jurisdiction to entertain this complaint as the cause of action arose within ${data.complainant.city} and the Complainant resides within the limits of this Commission.`);
  
  // Facts (AI Generated)
  if (data.generatedFacts) {
    const facts = String(data.generatedFacts).replace(/\*\*/g, ""); 
    addText(facts);
  } else {
    addText("2. Facts of the case could not be generated. Please edit manually.");
  }

  addSpace(5);
  
  // Cause of Action (Boilerplate)
  addText("That the above acts of the Opposite Party amount to 'Deficiency of Service' and 'Unfair Trade Practice' under the Consumer Protection Act, 2019, causing mental agony, harassment, and financial loss to the Complainant.");

  addSpace(5);
  addText("PRAYER:", 12, 'bold');
  
  // Prayer (AI Generated)
  if (data.generatedPrayer) {
    const prayer = String(data.generatedPrayer).replace(/\*\*/g, "");
    addText(prayer);
  }

  addText("Any other relief that this Hon'ble Commission may deem fit in the interest of justice.");

  addSpace(20);
  
  // --- Verification ---
  addText("VERIFICATION", 12, 'bold', 'center');
  addText(`Verified at ${data.complainant.city} on this ____ day of ________, 20__, that the contents of the above complaint are true and correct to the best of my knowledge and belief and nothing material has been concealed therefrom.`);
  
  addSpace(20);
  addText("_______________________", 12, 'normal', 'right');
  addText("(Signature of Complainant)", 12, 'normal', 'right');
  addText(`${data.complainant.name}`, 12, 'bold', 'right');

  // Save
  doc.save(`${data.complainant.name.replace(/\s+/g, '_')}_Consumer_Complaint.pdf`);
};

export const generateLegalNoticePDF = (data: ComplaintData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  let yPos = 20;
  const lineHeight = 6;

  const addText = (text: string, fontSize: number = 12, fontStyle: string = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    
    const lines = doc.splitTextToSize(text, maxLineWidth);
    
    lines.forEach((line: string) => {
      if (yPos + lineHeight > 280) {
        doc.addPage();
        yPos = 20;
      }
      const xPos = align === 'center' ? pageWidth / 2 : (align === 'right' ? pageWidth - margin : margin);
      doc.text(line, xPos, yPos, { align: align });
      yPos += lineHeight;
    });
    
    yPos += 4; 
  };

  const addSpace = (amount: number = 10) => {
    if (yPos + amount > 280) {
        doc.addPage();
        yPos = 20;
    } else {
        yPos += amount;
    }
  };

  // HEADER
  addText("LEGAL NOTICE", 16, 'bold', 'center');
  addText("(By Registered Post / Speed Post / Email)", 10, 'normal', 'center');
  addSpace(15);

  // DATE
  const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  addText(`Date: ${dateStr}`, 12, 'bold', 'right');
  addSpace(10);

  // FROM
  addText("FROM:", 12, 'bold');
  addText(`${data.complainant.name}`);
  addText(`R/o: ${data.complainant.address}, ${data.complainant.city} - ${data.complainant.pincode}`);
  addText(`Mobile: ${data.complainant.mobile}`);
  if (data.complainant.email) addText(`Email: ${data.complainant.email}`);
  addSpace(10);

  // TO
  addText("TO:", 12, 'bold');
  addText(`${data.oppositeParty.name}`);
  addText(`${data.oppositeParty.address}`);
  addText(`${data.oppositeParty.city}, ${data.oppositeParty.state} - ${data.oppositeParty.pincode}`);
  addSpace(15);

  // SUBJECT
  addText(`SUBJECT: LEGAL NOTICE FOR DEFICIENCY IN SERVICE AND UNFAIR TRADE PRACTICE REGARDING - ${data.transaction.productDescription.toUpperCase()}`, 12, 'bold');
  addSpace(10);

  // BODY
  addText("Sir/Madam,", 12, 'normal');
  addSpace(5);
  addText("I am the Complainant in the above-mentioned matter. I hereby serve you this Legal Notice to bring to your attention the following facts:", 12, 'normal');
  addSpace(5);

  // FACTS (AI)
  if (data.generatedFacts) {
    const facts = String(data.generatedFacts).replace(/\*\*/g, "");
    addText(facts);
  } else {
    addText("Facts could not be generated.");
  }

  addSpace(5);
  addText("That despite my repeated requests and approaches, you have failed to resolve my genuine grievance, thereby causing me mental agony, harassment, and financial loss.");
  addSpace(5);

  addText("I THEREFORE CALL UPON YOU to immediately within 15 (Fifteen) days from the receipt of this notice:", 12, 'bold');
  addSpace(5);

  // PRAYER (AI) - Repurposed as Demands
  if (data.generatedPrayer) {
    const prayer = String(data.generatedPrayer).replace(/\*\*/g, "");
    addText(prayer);
  }

  addSpace(10);
  addText("TAKE FURTHER NOTICE that if you fail to comply with the above demands within the stipulated period, I shall be constrained to initiate appropriate legal proceedings against you in the Competent Court / Consumer Commission at your risk, cost, and consequences.", 12, 'bold');
  
  addSpace(20);
  addText("_______________________", 12, 'normal', 'right');
  addText("(Signature)", 12, 'normal', 'right');
  addText(`${data.complainant.name}`, 12, 'bold', 'right');

  doc.save(`${data.complainant.name.replace(/\s+/g, '_')}_Legal_Notice.pdf`);
};