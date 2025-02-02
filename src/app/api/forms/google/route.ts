import { google } from "googleapis";
import { NextResponse } from "next/server";
import { FormQuestion } from "@/agentBuilder/processForm";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const { formUrl } = await request.json();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const forms = google.forms({
      version: "v1",
      auth: oauth2Client,
    });

    const formId = extractFormIdFromUrl(formUrl);
    const response = await forms.forms.get({ formId });

    const formItems: FormQuestion[] =
      response.data.items?.map((item) => ({
        id: item.itemId || "",
        title: item.title || "Untitled Question",
        type: getQuestionType(item.questionItem?.question),
        required: item.questionItem?.question?.required || false,
        options: item.questionItem?.question?.choiceQuestion?.options?.map(
          (o) => o.value || ""
        ),
      })) || [];

    const zodSchema = generateZodSchema(formItems);

    return NextResponse.json({ zodSchema, formItems });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form data" },
      { status: 500 }
    );
  }
}

function getQuestionType(question?: any): FormQuestion["type"] {
  if (!question) return "UNKNOWN";

  if (question.textQuestion) return "TEXT";
  if (question.choiceQuestion) {
    return question.choiceQuestion?.type === "CHECKBOX"
      ? "CHECKBOX"
      : "MULTIPLE_CHOICE";
  }
  if (question.dateQuestion) return "DATE";
  if (question.dropdownQuestion) return "DROPDOWN";

  return "UNKNOWN";
}

function extractFormIdFromUrl(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url;
}

function generateZodSchema(formItems: FormQuestion[]) {
  const schemaObject = formItems.reduce(
    (acc: Record<string, z.ZodTypeAny>, item) => {
      let fieldSchema: z.ZodTypeAny = z.string();

      switch (item.type) {
        case "MULTIPLE_CHOICE":
        case "DROPDOWN":
          fieldSchema = z.enum([
            item.options?.[0] || "Option 1",
            ...(item.options?.slice(1) || []),
          ]);
          break;
        case "CHECKBOX":
          fieldSchema = z.array(z.string()).min(1);
          break;
        case "DATE":
          fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
          break;
      }

      if (item.required) {
        fieldSchema = fieldSchema.refine((val) => val?.length > 0, {
          message: `${item.title} is required`,
        });
      }

      acc[item.id] = fieldSchema;
      return acc;
    },
    {}
  );

  return z.object(schemaObject);
}
