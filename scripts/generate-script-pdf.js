const fs = require('fs');
const path = require('path');

function createMultiPagePdf(pages) {
  const escapePdf = (str) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  
  let objects = [];
  let objIndex = 1;

  const catalogObjNum = objIndex++;
  const pagesObjNum = objIndex++;
  const fontObjNum = objIndex++;
  const fontBoldObjNum = objIndex++;

  const pageObjNums = [];
  const contentObjNums = [];

  for (let i = 0; i < pages.length; i++) {
    pageObjNums.push(objIndex++);
    contentObjNums.push(objIndex++);
  }

  let pdfBody = '';
  const offsets = [];

  function recordObj(num, content) {
    offsets[num] = Buffer.byteLength(pdfBody, 'utf-8');
    pdfBody += `${num} 0 obj\n${content}\nendobj\n`;
  }

  pdfBody += '%PDF-1.4\n';

  // Catalog
  recordObj(catalogObjNum, `<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>`);

  // Pages
  const kidsStr = pageObjNums.map(n => `${n} 0 R`).join(' ');
  recordObj(pagesObjNum, `<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>`);

  // Fonts
  recordObj(fontObjNum, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  recordObj(fontBoldObjNum, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

  // Page and Content objects
  for (let i = 0; i < pages.length; i++) {
    const pageNum = pageObjNums[i];
    const contentNum = contentObjNums[i];
    const lines = pages[i];

    recordObj(pageNum, `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjNum} 0 R /F2 ${fontBoldObjNum} 0 R >> >> /Contents ${contentNum} 0 R >>`);

    let stream = `BT\n`;
    let currentY = 740;

    for (const line of lines) {
      if (line.type === 'title') {
        stream += `/F2 16 Tf\n50 ${currentY} Td\n(${escapePdf(line.text)}) Tj\n`;
        currentY -= 22;
        stream += `0 -22 Td\n`;
      } else if (line.type === 'heading') {
        stream += `/F2 12 Tf\n0 -8 Td\n(${escapePdf(line.text)}) Tj\n`;
        currentY -= 20;
        stream += `0 -20 Td\n`;
      } else if (line.type === 'action') {
        stream += `/F2 10 Tf\n(${escapePdf('[ACTION] ' + line.text)}) Tj\n`;
        currentY -= 14;
        stream += `0 -14 Td\n`;
      } else if (line.type === 'say') {
        stream += `/F1 9 Tf\n(${escapePdf('[SAY] "' + line.text + '"')}) Tj\n`;
        currentY -= 13;
        stream += `0 -13 Td\n`;
      } else if (line.type === 'bullet') {
        stream += `/F1 9 Tf\n(${escapePdf('   - ' + line.text)}) Tj\n`;
        currentY -= 12;
        stream += `0 -12 Td\n`;
      } else if (line.type === 'space') {
        currentY -= 8;
        stream += `0 -8 Td\n`;
      }
    }
    stream += `ET\n`;

    const streamLen = Buffer.byteLength(stream, 'utf-8');
    recordObj(contentNum, `<< /Length ${streamLen} >>\nstream\n${stream}endstream`);
  }

  const startXref = Buffer.byteLength(pdfBody, 'utf-8');
  let xref = `xref\n0 ${objIndex}\n0000000000 65535 f \n`;

  for (let i = 1; i < objIndex; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    xref += `${off} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objIndex} /Root ${catalogObjNum} 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return Buffer.from(pdfBody + xref + trailer, 'utf-8');
}

const page1 = [
  { type: 'title', text: 'LexLens: Video Walkthrough Master Script' },
  { type: 'bullet', text: 'Live Demo URL: https://lexlens-one.vercel.app' },
  { type: 'bullet', text: 'Target Duration: 2.5 - 3.0 Minutes' },
  { type: 'space' },
  { type: 'heading', text: 'Part 1: Introduction (0:00 - 0:25)' },
  { type: 'action', text: 'Open https://lexlens-one.vercel.app homepage in fullscreen.' },
  { type: 'say', text: 'Hello everyone! This is LexLens - a GenAI-powered legal document assistant designed to help people' },
  { type: 'say', text: 'understand, compare, and navigate complex contracts before signing.' },
  { type: 'say', text: 'Legal text is intentionally dense and intimidating. LexLens gives you a lawyer-eye view of your document,' },
  { type: 'say', text: 'highlighting risks, answering questions with verifiable proof, and preparing you for action.' },
  { type: 'space' },
  { type: 'heading', text: 'Part 2: Uploading a PDF & Clause X-Ray (0:25 - 1:00)' },
  { type: 'action', text: 'Click "Analyze a Document", drag and drop 1_Residential_Lease_Agreement.pdf into workspace.' },
  { type: 'action', text: 'Show document loaded with Bates stamps (C1, C2, C3) and right-side X-Ray analysis panel.' },
  { type: 'say', text: 'Let us upload a residential lease agreement in PDF format. Everything happens with zero-retention privacy:' },
  { type: 'say', text: 'the PDF is parsed 100% inside your browser using Web Workers, so raw files never leave your device.' },
  { type: 'say', text: 'LexLens segments the contract into addressable clauses with Bates stamp IDs like C1, C2, and C3.' },
  { type: 'say', text: 'Notice our Perspective selector: contracts are asymmetric. LexLens evaluates risk specifically from your role.' },
  { type: 'say', text: 'On the right, X-Ray marginalia breaks down clauses into plain English and flags risk levels.' },
];

const page2 = [
  { type: 'heading', text: 'Part 3: Grounded Q&A with Verifiable Citations (1:00 - 1:35)' },
  { type: 'action', text: 'Click "Ask" tab, type: "What is the rent and when is it due?", submit question.' },
  { type: 'action', text: 'Click citation badge C3 to show auto-scrolling and highlighting in the left document.' },
  { type: 'say', text: 'Now let us ask a question: What is the rent and when is it due?' },
  { type: 'say', text: 'Unlike standard chatbots that make things up, LexLens enforces a strict fail-closed citation contract.' },
  { type: 'say', text: 'Every answer is backed by a verbatim quote verified against the source text.' },
  { type: 'say', text: 'Clicking any citation pill instantly scrolls to and highlights the exact clause in the document.' },
  { type: 'say', text: 'And if a user enters a crisis situation, LexLens surfaces immediate legal-aid referral banners.' },
  { type: 'space' },
  { type: 'heading', text: 'Part 4: Contract Comparison & Redline (1:35 - 2:05)' },
  { type: 'action', text: 'Click "Compare" in top navigation, click "Load Sample" to load Draft V1 vs Draft V2.' },
  { type: 'action', text: 'Show word-level diff (green additions, red strikethroughs) and "Top Changes That Matter".' },
  { type: 'say', text: 'Next, let us look at Compare. When you receive an updated draft of a contract, LexLens aligns' },
  { type: 'say', text: 'matching clauses across revisions and runs a word-level Myers diff.' },
  { type: 'say', text: 'More importantly, it surfaces the changes that actually matter - instantly alerting you if rent jumped,' },
  { type: 'say', text: 'if late fees tripled, or if notice periods were shortened.' },
];

const page3 = [
  { type: 'heading', text: 'Part 5: Action Checklist, Calendar Sync & Lawyer Brief (2:05 - 2:40)' },
  { type: 'action', text: 'Return to /workspace, open "Actions" tab, show Obligations Checklist with checkboxes.' },
  { type: 'action', text: 'Click "Export .ics" to download calendar reminders. Click "Lawyer Brief" in top navigation.' },
  { type: 'action', text: 'Scroll through the 2-page printable consultation brief.' },
  { type: 'say', text: 'Finally, LexLens turns contracts into actionable next steps.' },
  { type: 'say', text: 'Under the Actions tab, it extracts an interactive Obligations Checklist with deadlines and owners.' },
  { type: 'say', text: 'Clicking Export .ics downloads a calendar file so you never miss a 30-day notice window.' },
  { type: 'say', text: 'And if you decide to consult an attorney, Lawyer Brief generates a structured, printable brief' },
  { type: 'say', text: 'with key liabilities and targeted questions to save you billable consultation time.' },
  { type: 'space' },
  { type: 'heading', text: 'Part 6: Conclusion (2:40 - 2:55)' },
  { type: 'action', text: 'Click the LexLens logo to return to the landing page.' },
  { type: 'say', text: 'LexLens bridges the gap between opaque legalese and everyday people - empowering you to know what you sign.' },
  { type: 'say', text: 'It is built with Next.js, React 19, and Groq Cloud, verified with over 200 automated tests,' },
  { type: 'say', text: 'and live right now at lexlens-one.vercel.app. Thank you!' },
];

const pdfBuf = createMultiPagePdf([page1, page2, page3]);
const outPath = path.join(__dirname, '..', 'sample_documents', 'Video_Walkthrough_Script.pdf');
fs.writeFileSync(outPath, pdfBuf);
console.log('Video_Walkthrough_Script.pdf created successfully at:', outPath);
