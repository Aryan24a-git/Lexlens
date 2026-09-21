import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, "../tests/fixtures");

// Extract clauses following the exact core segmentation specification
function extractClauses(content, fileName) {
  const normalized = content.replace(/\r\n|\r/g, "\n").trim();
  const lines = normalized.split("\n");
  const headingIndices = [];
  let currentOffset = 0;

  const headingPatterns = [
    /^\s*(\d+(\.\d+)*)[.\s\-\)]+\s*([A-Za-z0-9&/'" \-–—]{2,80})$/,
    /^\s*(ARTICLE|Article|SECTION|Section|CLAUSE|Clause)\s+([0-9IVXLCDM]+|[A-Z])([:.\s\-]+(.*))?$/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      for (const pattern of headingPatterns) {
        if (pattern.test(line)) {
          headingIndices.push({
            charOffset: currentOffset,
            heading: line,
          });
          break;
        }
      }
    }
    currentOffset += lines[i].length + 1;
  }

  const rawSegments = [];
  // Preamble before first heading
  if (headingIndices.length > 0 && headingIndices[0].charOffset > 0) {
    const preambleText = normalized.slice(0, headingIndices[0].charOffset).trim();
    if (preambleText.length > 0) {
      rawSegments.push({
        heading: "Preamble",
        startOffset: 0,
        endOffset: headingIndices[0].charOffset,
        text: preambleText,
      });
    }
  }

  for (let i = 0; i < headingIndices.length; i++) {
    const curr = headingIndices[i];
    const next = headingIndices[i + 1];
    const start = curr.charOffset;
    const end = next ? next.charOffset : normalized.length;
    const segmentText = normalized.slice(start, end).trim();

    rawSegments.push({
      heading: curr.heading,
      startOffset: start,
      endOffset: end,
      text: segmentText,
    });
  }

  // Merge tiny fragments (< 50 chars)
  const mergedSegments = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const curr = rawSegments[i];
    if (curr.text.length < 50 && i + 1 < rawSegments.length) {
      const next = rawSegments[i + 1];
      next.startOffset = curr.startOffset;
      if (!next.heading && curr.heading) {
        next.heading = curr.heading;
      }
      next.text = normalized.slice(next.startOffset, next.endOffset).trim();
      continue;
    }
    mergedSegments.push(curr);
  }

  const clauses = [];
  for (let i = 0; i < mergedSegments.length; i++) {
    const seg = mergedSegments[i];
    const rawSlice = normalized.slice(seg.startOffset, seg.endOffset);
    const leadingWs = rawSlice.length - rawSlice.trimStart().length;
    const trailingWs = rawSlice.length - rawSlice.trimEnd().length;

    const startOffset = seg.startOffset + leadingWs;
    const endOffset = seg.endOffset - trailingWs;
    const text = normalized.slice(startOffset, endOffset);

    clauses.push({
      id: `C${i + 1}`,
      index: i + 1,
      heading: seg.heading,
      startOffset,
      endOffset,
      text,
    });
  }

  return {
    fileName,
    clauseCount: clauses.length,
    clauses,
  };
}

const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith(".txt"));

for (const file of files) {
  const filePath = path.join(fixturesDir, file);
  const content = fs.readFileSync(filePath, "utf-8");
  const goldenData = extractClauses(content, file);

  const goldenPath = path.join(fixturesDir, file.replace(/\.txt$/, ".golden.json"));
  fs.writeFileSync(goldenPath, JSON.stringify(goldenData, null, 2), "utf-8");
  console.log(`Generated ${goldenPath} with ${goldenData.clauseCount} clauses`);
}
