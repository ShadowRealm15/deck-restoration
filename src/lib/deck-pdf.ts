import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Direct-download PDF export using html-to-image + jsPDF.
 *
 * 1:1 PIXEL PORTRAIT: the off-screen clone renders two rigid wrappers,
 * `#pdf-page-1-wrapper` and `#pdf-page-2-wrapper`, each exactly 794x1123px
 * (A4 portrait). Each wrapper is captured at exactly 794x1123 and drawn
 * full-bleed onto a standard A4 page expressed in millimeters (210x297mm),
 * so the document prints at 100% scale with no manual printer scaling.
 */
const PAGE_W = 794;
const PAGE_H = 1123;
// Standard A4 print dimensions in millimeters.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const BG = "#0d0e11";

const PAGE_IDS = ["pdf-page-1-wrapper", "pdf-page-2-wrapper"];

/**
 * Skip app chrome and every external stylesheet/link node. Remote Google Fonts
 * CSS cannot be read cross-origin (`SecurityError: cssRules`) and html-to-image
 * spends ~20s retrying it, so it is excluded from the capture entirely.
 */
function captureFilter(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return true;
  if (node.classList?.contains("no-print")) return false;
  const tag = node.tagName;
  if (tag === "LINK") return false;
  if (tag === "STYLE" && node.textContent?.includes("http")) return false;
  return true;
}

async function snap(node: HTMLElement): Promise<string> {
  return toPng(node, {
    cacheBust: true,
    backgroundColor: BG,
    pixelRatio: 2,
    width: PAGE_W,
    height: PAGE_H,
    // Fonts are already rendered into the raster; embedding remote CSS is the
    // slow, CORS-failing step, so it is disabled.
    skipFonts: true,
    fontEmbedCSS: "",
    filter: captureFilter,
  });
}

export async function exportDeckToPdf(
  element: HTMLElement,
  filename = "Brand-Strategy-Deck.pdf",
): Promise<void> {
  const page1El = element.querySelector<HTMLElement>("#pdf-page-1-wrapper");
  const page2El = element.querySelector<HTMLElement>("#pdf-page-2-wrapper");
  if (!page1El || !page2El) throw new Error("PDF export wrappers not found");

  // Force a reflow so any pending layout settles before the snapshot.
  void element.offsetHeight;

  // Expand every textarea to fit 100% of its content before the snapshot.
  const textareas = Array.from(element.querySelectorAll("textarea"));
  const previousStyles = textareas.map((ta) => ta.style.cssText);
  for (const ta of textareas) {
    ta.style.setProperty("height", "auto", "important");
    ta.style.setProperty("height", `${ta.scrollHeight}px`, "important");
    ta.style.setProperty("overflow", "hidden", "important");
    ta.style.setProperty("max-height", "none", "important");
  }

  let dataUrl1: string;
  let dataUrl2: string;
  try {
    // Both pages captured simultaneously — identical layout state, faster export.
    [dataUrl1, dataUrl2] = await Promise.all([snap(page1El), snap(page2El)]);
  } finally {
    textareas.forEach((ta, i) => {
      ta.style.cssText = previousStyles[i] ?? "";
    });
  }

  // Standard A4 millimeter dimensions (210mm x 297mm) so the generated
  // document fits 100% automatically on A4 print paper — no manual scaling.
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Pages scaled perfectly to A4 print bounds.
  pdf.addImage(dataUrl1, "PNG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, "", "FAST");
  pdf.addPage("a4", "portrait");
  pdf.addImage(dataUrl2, "PNG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, "", "FAST");

  pdf.save(filename);
}
