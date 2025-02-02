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
import { FormQuestion } from "@/agentBuilder/processForm";

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

  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
  });

  useEffect(() => {
    const loadForm = async () => {
      try {
        if (!agent.settings?.formUrl) {
          throw new Error("Agent is not configured for Form filling");
        }
        const { zodSchema, formItems } = agent.settings.formContent;
        setSchema(zodSchema);
        setFormItems(formItems);

        // Set default values
        const defaults = formItems.reduce(
          (acc: Record<string, any>, item: FormQuestion) => {
            acc[item.id] = item.type === "CHECKBOX" ? [] : "";
            return acc;
          },
          {}
        );

        form.reset(defaults);
      } catch (error) {
        console.error("Error loading form:", error);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading form...</div>;

  return (
    <div className="h-screen w-full p-6">
      <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg">
        <CardHeader className="items-center justify-between border-b">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(210,29%,16%)] to-[hsl(210,29%,36%)]">
            {agent.name} - Voice Form
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)] relative">
          <div className="absolute inset-0 overflow-auto p-4">
            <div className="border rounded-lg p-4 min-h-full">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(console.log)}
                  className="space-y-6"
                >
                  {formItems.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={item.id}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {item.title}
                            {item.required && "*"}
                          </FormLabel>
                          <FormControl>
                            {item.type === "MULTIPLE_CHOICE" ||
                            item.type === "DROPDOWN" ? (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={`Select ${item.title.toLowerCase()}`}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : item.type === "CHECKBOX" ? (
                              <div className="flex flex-col gap-2">
                                {item.options?.map((option) => (
                                  <div
                                    key={option}
                                    className="flex items-center gap-2"
                                  >
                                    <Checkbox
                                      checked={field.value?.includes(option)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...field.value, option]
                                          : field.value.filter(
                                              (v: string) => v !== option
                                            );
                                        field.onChange(newValue);
                                      }}
                                    />
                                    <label>{option}</label>
                                  </div>
                                ))}
                              </div>
                            ) : item.type === "DATE" ? (
                              <Input type="date" {...field} />
                            ) : (
                              <Input
                                placeholder={`Enter ${item.title.toLowerCase()}`}
                                {...field}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <Button type="submit" className="w-full">
                    Submit
                  </Button>
                </form>
              </Form>
            </div>
          </div>
          <div className="fixed bottom-10 right-10">
            <SessionControl agentId={agentId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
