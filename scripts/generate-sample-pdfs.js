const fs = require('fs');
const path = require('path');

function createPdfBuffer(title, lines) {
  // Sanitize strings for PDF literal string format
  const escapePdf = (str) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  
  let streamContent = `BT\n/F1 14 Tf\n50 750 Td\n(${escapePdf(title)}) Tj\nET\n`;
  streamContent += `BT\n/F1 10 Tf\n50 720 Td\n14 TL\n`;

  for (const line of lines) {
    if (line.trim().length === 0) {
      streamContent += `T*\n`;
    } else {
      streamContent += `(${escapePdf(line.trim())}) '\n`;
    }
  }
  streamContent += `ET\n`;

  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}

const sampleDir = path.join(__dirname, '..', 'sample_documents');
const leaseContent = fs.readFileSync(path.join(sampleDir, '1_Residential_Lease_Agreement.txt'), 'utf-8');
const leaseLines = leaseContent.split('\n');

const pdfBuffer = createPdfBuffer('RESIDENTIAL LEASE AGREEMENT', leaseLines.slice(2));
fs.writeFileSync(path.join(sampleDir, '1_Residential_Lease_Agreement.pdf'), pdfBuffer);

const empContent = fs.readFileSync(path.join(sampleDir, '2_Employment_Offer_Letter.txt'), 'utf-8');
const empLines = empContent.split('\n');
const empPdf = createPdfBuffer('EMPLOYMENT OFFER LETTER', empLines.slice(2));
fs.writeFileSync(path.join(sampleDir, '2_Employment_Offer_Letter.pdf'), empPdf);

console.log('Sample PDFs generated successfully in sample_documents/');
