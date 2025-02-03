"use client";

import { SessionControl } from "@audentic/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentDBConfig } from "@/agentBuilder/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FormQuestion } from "@/agentBuilder/processForm";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormAgent({
  agentId,
  agent,
}: {
  agentId: string;
  agent: AgentDBConfig;
}) {
  const [schema, setSchema] = useState<z.ZodObject<any> | null>(null);
  const [formItems, setFormItems] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
  });

  useEffect(() => {
    const loadForm = async () => {
      try {
        if (!agent.settings?.isFormAgent || !agent.settings?.formSchema?.url) {
          throw new Error("Agent is not configured for Form filling");
        }
        const { zodSchema, formItems } = agent.settings.formSchema;
        setSchema(zodSchema);
        setFormItems(formItems);

        // Set default values based on field types
        const defaults = formItems.reduce(
          (acc: Record<string, any>, item: FormQuestion) => {
            switch (item.type) {
              case "CHECKBOX":
                acc[item.id] = [];
                break;
              case "NUMBER":
                acc[item.id] = null;
                break;
              case "DATE":
                acc[item.id] = "";
                break;
              case "TIME":
                acc[item.id] = "";
                break;
              default:
                acc[item.id] = "";
            }
            return acc;
          },
          {}
        );

        form.reset(defaults);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
        console.error("Error loading form:", error);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [agent.settings?.formUrl]);

  const onSubmit = async (data: any) => {
    try {
      // Handle form submission
      console.log("Form submitted:", data);
      // Add your submission logic here
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading form...</div>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  return (
    <div className="h-screen w-full p-6">
      <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg">
        <CardHeader className="items-center justify-between border-b">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(210,29%,16%)] to-[hsl(210,29%,36%)]">
            {agent.name} - Voice Form
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-w-2xl mx-auto">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {formItems.map((item) =>
                  item.type !== "INFO" ? (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={item.id}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {item.title}
                            {item.required && " *"}
                          </FormLabel>
                          <FormControl>
                            {(() => {
                              switch (item.type) {
                                case "TEXTAREA":
                                  return (
                                    <Textarea
                                      placeholder={
                                        item.placeholder ||
                                        `Enter ${item.title.toLowerCase()}`
                                      }
                                      {...field}
                                    />
                                  );
                                case "MULTIPLE_CHOICE":
                                case "DROPDOWN":
                                  return (
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={
                                            item.placeholder ||
                                            `Select ${item.title.toLowerCase()}`
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {item.options?.map((option) => (
                                          <SelectItem
                                            key={option}
                                            value={option}
                                          >
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  );
                                case "CHECKBOX":
                                  return (
                                    <div className="flex flex-col gap-2">
                                      {item.options?.map((option) => (
                                        <div
                                          key={option}
                                          className="flex items-center gap-2"
                                        >
                                          <Checkbox
                                            checked={field.value?.includes(
                                              option
                                            )}
                                            onCheckedChange={(checked) => {
                                              const newValue = checked
                                                ? [
                                                    ...(field.value || []),
                                                    option,
                                                  ]
                                                : field.value?.filter(
                                                    (v: string) => v !== option
                                                  );
                                              field.onChange(newValue);
                                            }}
                                          />
                                          <label>{option}</label>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                case "DATE":
                                  return (
                                    <Input
                                      type="date"
                                      min={item.validation?.minDate}
                                      max={item.validation?.maxDate}
                                      {...field}
                                    />
                                  );
                                case "TIME":
                                  return (
                                    <Input
                                      type="time"
                                      min={item.validation?.minTime}
                                      max={item.validation?.maxTime}
                                      {...field}
                                    />
                                  );
                                case "NUMBER":
                                  return (
                                    <Input
                                      type="number"
                                      min={item.validation?.minNumber}
                                      max={item.validation?.maxNumber}
                                      placeholder={
                                        item.placeholder ||
                                        `Enter ${item.title.toLowerCase()}`
                                      }
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(e.target.valueAsNumber)
                                      }
                                    />
                                  );
                                case "EMAIL":
                                  return (
                                    <Input
                                      type="email"
                                      placeholder={
                                        item.placeholder || "email@example.com"
                                      }
                                      {...field}
                                    />
                                  );
                                case "URL":
                                  return (
                                    <Input
                                      type="url"
                                      placeholder={
                                        item.placeholder ||
                                        "https://example.com"
                                      }
                                      {...field}
                                    />
                                  );
                                default:
                                  return (
                                    <Input
                                      placeholder={
                                        item.placeholder ||
                                        `Enter ${item.title.toLowerCase()}`
                                      }
                                      {...field}
                                    />
                                  );
                              }
                            })()}
                          </FormControl>
                          {item.description && (
                            <FormDescription>
                              {item.description}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div key={item.id} className="prose dark:prose-invert">
                      <h3>{item.title}</h3>
                      {item.description && <p>{item.description}</p>}
                    </div>
                  )
                )}
                <Button type="submit" className="w-full">
                  Submit
                </Button>
              </form>
            </Form>
          </div>
          <div className="fixed bottom-10 right-10">
            <SessionControl
              agentId={agentId}
              transcript={true}
              maxOutputTokens={8192}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
