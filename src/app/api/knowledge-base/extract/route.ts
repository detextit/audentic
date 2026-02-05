import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Responses } from "openai/resources/responses/responses";
import { knowledgeBaseMetaPrompt } from "@/agentBuilder/metaPrompts";
import { createLogger } from "@/utils/logger";

const logger = createLogger("KB Extract API");

const openai = new OpenAI();
const KB_MODEL = "gpt-4.1";

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

async function fileToInputImage(file: File) {
  const buffer = await file.arrayBuffer();
  const base64Image = Buffer.from(buffer).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64Image}`;

  return {
    type: "input_image" as const,
    image_url: dataUrl,
    detail: "auto" as const,
  };
}

async function fileToInputFile(file: File) {
  const buffer = await file.arrayBuffer();
  const base64File = Buffer.from(buffer).toString("base64");

  return {
    type: "input_file" as const,
    file_data: base64File,
    filename: file.name,
  };
}

async function extractWithOpenAI(content: Responses.ResponseInputContent[]) {
  const response = await openai.responses.create({
    model: KB_MODEL,
    temperature: 0,
    max_output_tokens: 4096,
    input: [
      {
        role: "developer",
        content: [{ type: "input_text", text: knowledgeBaseMetaPrompt }],
      },
      {
        role: "user",
        content,
      },
    ],
  });

  if (!response.output_text) {
    throw new Error("No extracted content returned from OpenAI");
  }

  return response.output_text;
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
        // For text-based files, send text directly to the model
        const textContent = await file.text();
        content = await extractWithOpenAI([
          { type: "input_text", text: textContent },
        ]);
      } else if (isPdfFile(fileType, fileName)) {
        const fileInput = await fileToInputFile(file);
        content = await extractWithOpenAI([
          { type: "input_text", text: "Extract the document content." },
          fileInput,
        ]);
      } else if (isImageFile(fileType, fileName)) {
        const imageInput = await fileToInputImage(file);
        content = await extractWithOpenAI([
          { type: "input_text", text: "Extract the text from this image." },
          imageInput,
        ]);
      } else {
        const fileInput = await fileToInputFile(file);
        content = await extractWithOpenAI([
          { type: "input_text", text: "Extract the document content." },
          fileInput,
        ]);
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

        textContent = await extractWithOpenAI([
          { type: "input_text", text: `HTML page: ${html}` },
        ]);
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
