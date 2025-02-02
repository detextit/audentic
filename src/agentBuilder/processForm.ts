export interface FormQuestion {
  id: string;
  title: string;
  type:
    | "TEXT"
    | "MULTIPLE_CHOICE"
    | "CHECKBOX"
    | "DATE"
    | "DROPDOWN"
    | "UNKNOWN";
  required: boolean;
  options?: string[];
}

export async function fetchFormSchema(formUrl: string, formType?: "google") {
  const response = await fetch(`/api/forms/${formType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ formUrl }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch form data");
  }

  return response.json();
}
