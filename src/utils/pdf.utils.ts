/**
 * Utility functions for PDF text extraction
 */

/**
 * Extracts text content from a PDF file
 * @param file - The PDF file to extract text from
 * @returns Promise that resolves to the extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Only run in browser environment
    if (typeof window === "undefined") {
      throw new Error("PDF extraction is only available in the browser");
    }

    // Dynamically import pdfjs-dist to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");

    // Set up the worker for pdfjs using a CDN
    // Using unpkg as it's reliable and supports ES modules
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true, // Better text extraction
    });
    const pdf = await loadingTask.promise;

    const numPages = pdf.numPages;
    const textParts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items from the page
      const pageText = textContent.items
        .map((item) => {
          if ("str" in item && item.str) {
            return item.str;
          }
          return "";
        })
        .join(" ");

      if (pageText.trim()) {
        textParts.push(`Page ${pageNum}:\n${pageText.trim()}`);
      }
    }

    return textParts.join("\n\n");
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
