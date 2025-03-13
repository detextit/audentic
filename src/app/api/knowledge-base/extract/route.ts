import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";
import { knowledgeBaseMetaPrompt } from "@/agentBuilder/metaPrompts";
import { createLogger } from "@/utils/logger";

const logger = createLogger("KB Extract API");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    candidateCount: 1,
    maxOutputTokens: 8192,
    temperature: 0.0,
  },
});

// Initialize Mistral AI
const mistralClient = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
});

// Helper function to check if file is text-based
function isTextBasedFile(mimeType: string, fileName: string): boolean {
  // Check common text MIME types
  if (mimeType.startsWith("text/")) return true;
  if (mimeType === "application/json") return true;
  if (mimeType === "application/javascript") return true;
  if (mimeType === "application/typescript") return true;
  if (mimeType === "application/xml") return true;
  if (mimeType === "application/x-yaml") return true;

  // Check file extensions for common text files
  const textExtensions = new Set([
    ".txt",
    ".md",
    ".markdown",
    ".json",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".css",
    ".scss",
    ".less",
    ".html",
    ".htm",
    ".xml",
    ".yaml",
    ".yml",
    ".csv",
    ".log",
    ".conf",
    ".config",
    ".ini",
    ".sh",
    ".bash",
    ".zsh",
    ".py",
    ".rb",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".cs",
    ".php",
    ".sql",
  ]);

  const extension = fileName.toLowerCase().match(/\.[^.]*$/)?.[0];
  return extension ? textExtensions.has(extension) : false;
}

// Helper function to check if file is a PDF
function isPdfFile(mimeType: string, fileName: string): boolean {
  if (mimeType === "application/pdf") return true;
  const extension = fileName.toLowerCase().match(/\.[^.]*$/)?.[0];
  return extension === ".pdf";
}

// Helper function to check if file is an image
function isImageFile(mimeType: string, fileName: string): boolean {
  if (mimeType.startsWith("image/")) return true;
  const imageExtensions = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".tiff",
    ".tif",
  ]);
  const extension = fileName.toLowerCase().match(/\.[^.]*$/)?.[0];
  return extension ? imageExtensions.has(extension) : false;
}

// Constants for file upload limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
// const ALLOWED_FILE_TYPES = new Set([
//   // Text files
//   "text/plain",
//   "text/markdown",
//   "text/csv",
//   //   "text/html",
//   //   "text/css",
//   "text/javascript",
//   "text/typescript",
//   "application/json",
//   //   "application/xml",
//   "application/x-yaml",
//   // PDFs
//   "application/pdf",
//   // Microsoft Office formats
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   "application/vnd.ms-excel",
//   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// ]);

// Helper function to convert file to GenerativePart for Gemini
async function fileToGenerativePart(file: File) {
  const buffer = await file.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString("base64"),
      mimeType: file.type,
    },
  };
}

// Helper function to process PDF with Mistral OCR
async function processPdfWithMistralOcr(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload the PDF file
    const uploadedPdf = await mistralClient.files.upload({
      file: {
        fileName: file.name,
        content: fileBuffer,
      },
      purpose: "ocr" as any,
    });

    // Get a signed URL for the uploaded file
    const signedUrl = await mistralClient.files.getSignedUrl({
      fileId: uploadedPdf.id,
    });

    // Process the PDF using the signed URL
    const ocrResponse = await mistralClient.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: signedUrl.url,
      },
    });

    // Extract the markdown content from the first page
    let extractedText = "";
    if (ocrResponse.pages && ocrResponse.pages.length > 0) {
      extractedText = ocrResponse.pages
        .map((page) => page.markdown || "")
        .join("\n\n");
    }

    return extractedText;
  } catch (error) {
    logger.error("Error processing PDF with Mistral OCR:", error);
    throw new Error("Failed to process PDF with Mistral OCR");
  }
}

// Helper function to process image with Mistral OCR
async function processImageWithMistralOcr(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    const ocrResponse = await mistralClient.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        imageUrl: dataUrl,
      },
    });

    // Extract the markdown content from the first page
    let extractedText = "";
    if (ocrResponse.pages && ocrResponse.pages.length > 0) {
      extractedText = ocrResponse.pages
        .map((page) => page.markdown || "")
        .join("\n\n");
    }

    return extractedText;
  } catch (error) {
    logger.error("Error processing image with Mistral OCR:", error);
    throw new Error("Failed to process image with Mistral OCR");
  }
}

export const maxDuration = 60; // This is the time in seconds that this function is allowed to execute within. Setting it to 30s.

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let type: string;
    let content: string;
    let fileName: string = "";
    let fileType: string = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      type = formData.get("type") as string;
      const file = formData.get("content") as File;

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds 10MB limit" },
          { status: 400 }
        );
      }

      fileName = file.name;
      fileType = file.type;

      if (isTextBasedFile(fileType, fileName)) {
        // For text-based files, just read the text content
        content = await file.text();
      } else if (isPdfFile(fileType, fileName)) {
        // For PDFs, use Mistral OCR
        content = await processPdfWithMistralOcr(file);
      } else if (isImageFile(fileType, fileName)) {
        // For images, use Mistral OCR
        content = await processImageWithMistralOcr(file);
      } else {
        // For other formats, use Gemini's built-in processing
        const generativePart = await fileToGenerativePart(file);
        const result = await model.generateContent([
          knowledgeBaseMetaPrompt,
          generativePart,
        ]);
        content = result.response.text();
      }
    } else {
      const body = await request.json();
      type = body.type;
      content = body.content;
    }

    if (!type || !content) {
      return NextResponse.json(
        { error: "Missing type or content" },
        { status: 400 }
      );
    }

    let textContent: string;
    let title: string;

    if (type === "url") {
      // Validate URL
      try {
        new URL(content);
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }

      // Fetch URL content with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      try {
        const response = await fetch(content, { signal: controller.signal });
        clearTimeout(timeout);
        const html = await response.text();
        const url = new URL(content);
        title = url.hostname + url.pathname;

        const prompt = `${knowledgeBaseMetaPrompt}\n\n HTML page: ${html}`;
        const result = await model.generateContent(prompt);
        textContent = result.response.text();
      } catch (error: any) {
        if (error.name === "AbortError") {
          return NextResponse.json(
            { error: "URL fetch timeout" },
            { status: 408 }
          );
        }
        throw error;
      }
    } else if (type === "file") {
      title = fileName;
      textContent = content;
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "url" or "file"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      title,
      content: textContent,
    });
  } catch (error) {
    logger.error("Error processing content:", error);
    return NextResponse.json(
      { error: "Failed to process content" },
      { status: 500 }
    );
  }
}
