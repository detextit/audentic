import { z } from "zod";

interface FormMetadata {
  title: string;
  description?: string;
  confirmationMessage?: string;
}

export interface FormQuestion {
  id: string;
  title: string;
  description?: string;
  type:
    | "TEXT"
    | "TEXTAREA"
    | "EMAIL"
    | "PHONE"
    | "MULTIPLE_CHOICE"
    | "DROPDOWN"
    | "CHECKBOX"
    | "DATE"
    | "TIME"
    | "NUMBER"
    | "URL"
    | "INFO"
    | "UNKNOWN";
  required: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    message?: string;
    min?: number;
    max?: number;
    minDate?: string;
    maxDate?: string;
    minTime?: string;
    maxTime?: string;
    minNumber?: number;
    maxNumber?: number;
  };
  placeholder?: string;
  helpText?: string;
}

export async function fetchFormSchema(formUrl: string) {
  try {
    const formUrlWithView = formUrl.includes("/viewform")
      ? formUrl
      : `${formUrl}/viewform`;

    const response = await fetch("/api/form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: formUrlWithView }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch form: ${response.statusText}`);
    }

    const { html } = await response.json();

    // Extract FB_PUBLIC_LOAD_DATA_
    const fbDataMatch = html.match(/FB_PUBLIC_LOAD_DATA_ = ([\s\S]*?);/);
    if (!fbDataMatch) {
      throw new Error("Could not find form data in the HTML");
    }

    let fbData;
    try {
      // Clean the JSON string before parsing
      const jsonStr = fbDataMatch[1].replace(/[\u0000-\u001F]/g, "");
      fbData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Raw data:", fbDataMatch[1]);
      throw new Error(
        `Failed to parse form data: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`
      );
    }

    // Validate the expected structure
    if (!Array.isArray(fbData) || !fbData[1] || !Array.isArray(fbData[1][1])) {
      throw new Error("Invalid form data structure");
    }

    // Extract form metadata
    const formMetadata: FormMetadata = {
      title: fbData[1][8] || "Untitled Form",
      description: fbData[1][0] || undefined,
      confirmationMessage: fbData[1][2]?.[0] || undefined,
    };

    // Form fields are in fbData[1][1]
    const fields = fbData[1][1];
    const formItems: FormQuestion[] = [];

    fields.forEach((field: any) => {
      try {
        console.log("field", field);
        const [
          id,
          title,
          description,
          type,
          validation,
          ,
          ,
          required,
          helpText,
        ] = field;

        let questionType: FormQuestion["type"] = "TEXT";
        let validationRules: FormQuestion["validation"] = {};
        let options: string[] | undefined;

        // Fix required field handling - Google Forms uses 1 for required fields
        const isRequired = required === 1;

        // Enhanced type mapping
        switch (type) {
          case 0: // Short answer
            if (validation?.[0]?.[3]) {
              const rules = validation[0][3];
              rules.forEach((rule: any) => {
                switch (rule[0]) {
                  case 2: // Email
                    questionType = "EMAIL";
                    break;
                  case 3: // Number
                    questionType = "NUMBER";
                    validationRules.minNumber = rule[1];
                    validationRules.maxNumber = rule[2];
                    break;
                  case 4: // URL
                    questionType = "URL";
                    break;
                  case 6: // Phone
                    questionType = "PHONE";
                    break;
                }
              });
            }
            break;
          case 1: // Paragraph
            questionType = "TEXTAREA";
            break;
          case 2: // Multiple choice
            questionType = "MULTIPLE_CHOICE";
            options = validation?.[0]?.[0]?.map((opt: any) => opt[0]) || [];
            break;
          case 3: // Dropdown
            questionType = "DROPDOWN";
            options = validation?.[0]?.[0]?.map((opt: any) => opt[0]) || [];
            break;
          case 4: // Checkboxes
            questionType = "CHECKBOX";
            options = validation?.[0]?.[0]?.map((opt: any) => opt[0]) || [];
            break;
          case 7: // Date
            questionType = "DATE";
            if (validation?.[0]?.[3]) {
              validationRules.minDate = validation[0][3][0];
              validationRules.maxDate = validation[0][3][1];
            }
            break;
          case 8: // Time
            questionType = "TIME";
            if (validation?.[0]?.[3]) {
              validationRules.minTime = validation[0][3][0];
              validationRules.maxTime = validation[0][3][1];
            }
            break;
          case 9: // Info text
            questionType = "INFO";
            break;
          default:
            questionType = "UNKNOWN";
        }

        // Extract validation rules
        if (validation?.[0]) {
          const [validationData] = validation;

          // Additional validation rules
          if (validationData[3]) {
            validationData[3].forEach((rule: any) => {
              switch (rule[0]) {
                case 1: // Pattern
                  validationRules.pattern = rule[1];
                  validationRules.message = rule[2];
                  break;
                case 2: // Min length
                  validationRules.min = rule[1];
                  break;
                case 3: // Max length
                  validationRules.max = rule[1];
                  break;
              }
            });
          }
        }

        formItems.push({
          id: id.toString(),
          title,
          description,
          type: questionType,
          required: isRequired, // Use the corrected required value
          options,
          validation:
            Object.keys(validationRules).length > 0
              ? validationRules
              : undefined,
          helpText,
          placeholder: `Enter ${title.toLowerCase()}`,
        });
      } catch (fieldError) {
        console.warn(`Failed to process field:`, field, fieldError);
      }
    });

    // Generate Zod schema
    const zodSchema = generateZodSchema(formItems);

    return {
      metadata: formMetadata,
      formItems,
      zodSchema,
    };
  } catch (error) {
    console.error("Form processing error:", error);
    throw new Error(
      `Failed to parse form: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

function generateZodSchema(formItems: FormQuestion[]) {
  const schemaObject = formItems.reduce(
    (acc: Record<string, z.ZodTypeAny>, item) => {
      let fieldSchema: z.ZodTypeAny;

      switch (item.type) {
        case "EMAIL":
          fieldSchema = z
            .string()
            .email(item.validation?.message || "Invalid email address");
          break;
        case "PHONE":
          fieldSchema = z
            .string()
            .regex(
              /^\+?[\d\s-()]+$/,
              item.validation?.message || "Invalid phone number"
            );
          break;
        case "NUMBER":
          fieldSchema = z.number();
          if (item.validation?.minNumber !== undefined) {
            fieldSchema = (fieldSchema as z.ZodNumber).min(
              item.validation.minNumber,
              `Minimum ${item.validation.minNumber} required`
            );
          }
          if (item.validation?.maxNumber !== undefined) {
            fieldSchema = (fieldSchema as z.ZodNumber).max(
              item.validation.maxNumber,
              `Maximum ${item.validation.maxNumber} allowed`
            );
          }
          break;
        case "URL":
          fieldSchema = z
            .string()
            .url(item.validation?.message || "Invalid URL");
          break;
        case "MULTIPLE_CHOICE":
        case "DROPDOWN":
          if (!item.options?.length) {
            fieldSchema = z.string();
          } else {
            fieldSchema = z.enum([item.options[0], ...item.options.slice(1)]);
          }
          break;
        case "CHECKBOX":
          fieldSchema = z
            .array(z.string())
            .min(
              item.required ? 1 : 0,
              item.validation?.message || "Select at least one option"
            );
          break;
        case "DATE":
          fieldSchema = z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
            .refine((date) => {
              if (!item.validation?.minDate) return true;
              return new Date(date) >= new Date(item.validation.minDate);
            }, `Date must be after ${item.validation?.minDate}`)
            .refine((date) => {
              if (!item.validation?.maxDate) return true;
              return new Date(date) <= new Date(item.validation.maxDate);
            }, `Date must be before ${item.validation?.maxDate}`);
          break;
        case "TIME":
          fieldSchema = z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format");
          break;
        case "INFO":
          // Info fields don't need validation
          return acc;
        case "TEXTAREA":
        case "TEXT":
        default:
          fieldSchema = z.string();
          if (item.validation?.min) {
            fieldSchema = (fieldSchema as z.ZodString).min(
              item.validation.min,
              `Minimum ${item.validation.min} characters required`
            );
          }
          if (item.validation?.max) {
            fieldSchema = (fieldSchema as z.ZodString).max(
              item.validation.max,
              `Maximum ${item.validation.max} characters allowed`
            );
          }
          if (item.validation?.pattern) {
            fieldSchema = (fieldSchema as z.ZodString).regex(
              new RegExp(item.validation.pattern),
              item.validation.message || "Invalid format"
            );
          }
      }

      // Handle required fields
      if (item.required) {
        fieldSchema = fieldSchema.refine(
          (val) => {
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === "string") return val.trim().length > 0;
            if (typeof val === "number") return true; // Numbers are always valid if present
            return val !== undefined && val !== null;
          },
          {
            message: `${item.title} is required`,
          }
        );
        acc[item.id] = fieldSchema;
      } else {
        acc[item.id] = fieldSchema.optional();
      }

      return acc;
    },
    {}
  );

  return z.object(schemaObject);
}
