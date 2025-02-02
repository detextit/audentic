import { AgentConfig, Tool } from "./types";
import { FormQuestion } from "./processForm";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
enum FormFields {}

export const createFormFieldEnum = (
  formItems: FormQuestion[]
): typeof FormFields => {
  const enumObj: Record<string, string> = {};
  formItems.forEach((item) => {
    // Convert field title to SCREAMING_SNAKE_CASE for enum key
    const enumKey = item.title
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
    enumObj[enumKey] = item.id;
  });
  return enumObj as typeof FormFields;
};

export interface FormToolState {
  formFields: typeof FormFields;
  formItems: FormQuestion[];
  formState: Record<string, any>;
  zodSchema: any;
}

export function createFormToolLogic(formState: FormToolState) {
  return {
    set_form_field: `async function set_form_field(params) {
      const formFields = ${JSON.stringify(formState.formFields)};
      const formItems = ${JSON.stringify(formState.formItems)};
      let formState = ${JSON.stringify(formState.formState)};

      try {
        // Get the actual field ID from the enum mapping
        const actualFieldId = formFields[params.fieldId];

        const field = formItems.find(
          (item) => item.id === actualFieldId
        );

        if (!field) {
          return {
            success: false,
            message: \`Field \${params.fieldId} not found\`,
          };
        }

        let parsedValue = params.value;

        // Parse and validate based on field type
        switch (field.type) {
          case "NUMBER":
            parsedValue = Number(params.value);
            if (isNaN(parsedValue)) {
              return {
                success: false,
                message: "Invalid number format",
              };
            }
            break;

          case "CHECKBOX":
            parsedValue = params.value.split(",").map((v) => v.trim());
            if (!field.options?.some((opt) => parsedValue.includes(opt))) {
              return {
                success: false,
                message: "Invalid checkbox options",
                validOptions: field.options,
              };
            }
            break;

          case "MULTIPLE_CHOICE":
          case "DROPDOWN":
            if (!field.options?.includes(params.value)) {
              return {
                success: false,
                message: "Invalid option selected",
                validOptions: field.options,
              };
            }
            break;

          case "DATE":
            if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(params.value)) {
              return {
                success: false,
                message: "Invalid date format (use YYYY-MM-DD)",
              };
            }
            break;

          case "TIME":
            if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(params.value)) {
              return {
                success: false,
                message: "Invalid time format (use HH:MM)",
              };
            }
            break;
        }

        // Update form state with actual field ID
        formState[actualFieldId] = parsedValue;

        return {
          success: true,
          value: parsedValue,
          fieldName: field.title,
          formState: formState,
          message: \`Successfully set \${field.title} to \${params.value}\`,
        };
      } catch (error) {
        console.error("Error in set_form_field:", error);
        return {
          success: false,
          message: "Internal error processing form field",
        };
      }
    }`,
  };
}

export function injectFormTools(
  agentDef: AgentConfig,
  formFields: typeof FormFields
): AgentConfig {
  const formFieldTool: Tool = {
    type: "function",
    name: "set_form_field",
    description: `Sets the value of a form field.
    - Use this tool to fill out form fields
    - Handles different field types (text, email, number, etc.)
    - Validates input against field requirements
    - Returns validation results and current field value`,
    parameters: {
      type: "object",
      properties: {
        fieldId: {
          type: "string",
          enum: Object.keys(formFields),
          description: "The name of the form field to set",
        },
        value: {
          type: "string",
          description: "Value to set in the field",
        },
      },
      required: ["fieldId", "value"],
    },
  } as Tool;

  if (!agentDef.tools) {
    agentDef.tools = [];
  }
  agentDef.tools.push(formFieldTool);
  return agentDef;
}
