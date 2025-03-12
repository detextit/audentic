import { WidgetConfiguration } from "@audentic/react";

export type WidgetBuilderConfiguration = Partial<WidgetConfiguration>;

// Default widget configuration
export const defaultWidgetConfig: WidgetConfiguration = {
  showBackgroundCard: true,
  title: "Need Help?",
  backgroundColor: "#FFFFFF",
  textColor: "#666666",
  width: "220",
  height: "110",
  buttonText: "Voice Agent",
  primaryColor: "#000000",
  buttonTextColor: "#FFFFFF",
  borderRadius: "12",
};
