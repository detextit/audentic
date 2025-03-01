import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AgentDBConfig } from "@/agentBuilder/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define the WidgetConfiguration interface
interface WidgetConfiguration {
  showBackgroundCard?: boolean;
  title?: string;
  backgroundColor?: string;
  textColor?: string;
  width?: string;
  height?: string;
  buttonText?: string;
  primaryColor?: string;
  buttonTextColor?: string;
  borderRadius?: string;
}

// Define the WidgetSettings interface
interface WidgetSettings {
  agentId: string;
  config: WidgetConfiguration;
}

export function WidgetConfiguration({ agent }: { agent: AgentDBConfig }) {
  // Add state for validation warnings
  const [widthWarning, setWidthWarning] = useState<string | null>(null);
  const [heightWarning, setHeightWarning] = useState<string | null>(null);

  // Create state for widget settings
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    agentId: agent.id,
    config: {
      showBackgroundCard: true,
      title: "Need Help?",
      backgroundColor: "#FFFFFF",
      textColor: "#666666",
      width: "300",
      height: "150",
      buttonText: "Voice Agent",
      primaryColor: "#000000",
      buttonTextColor: "#FFFFFF",
      borderRadius: "12",
    },
  });

  // Create the handleSettingChange function
  const handleSettingChange = (settingType: string, newSettings: any) => {
    if (settingType === "widget") {
      // Handle width validation
      if ("width" in newSettings && widgetSettings.config.showBackgroundCard) {
        const widthValue = parseInt(newSettings.width);
        if (widthValue < 200) {
          setWidthWarning(
            "Width should be at least 200px when background card is shown"
          );
        } else {
          setWidthWarning(null);
        }
      }

      // Handle height validation
      if (
        "height" in newSettings &&
        newSettings.height &&
        widgetSettings.config.showBackgroundCard
      ) {
        const heightValue = parseInt(newSettings.height);
        if (heightValue < 150) {
          setHeightWarning(
            "Height should be at least 150px when background card is shown"
          );
        } else {
          setHeightWarning(null);
        }
      } else if ("height" in newSettings && !newSettings.height) {
        setHeightWarning(null);
      }

      // Handle showBackgroundCard changes - reset warnings if needed
      if ("showBackgroundCard" in newSettings) {
        if (!newSettings.showBackgroundCard) {
          setWidthWarning(null);
          setHeightWarning(null);
        } else {
          // Validate current dimensions
          if (widgetSettings.config.width) {
            const widthValue = parseInt(widgetSettings.config.width);
            if (widthValue < 200) {
              setWidthWarning(
                "Width should be at least 200px when background card is shown"
              );
            }
          }

          if (widgetSettings.config.height) {
            const heightValue = parseInt(widgetSettings.config.height);
            if (heightValue < 150) {
              setHeightWarning(
                "Height should be at least 150px when background card is shown"
              );
            }
          }
        }
      }

      const updatedWidgetSettings: WidgetSettings = {
        agentId: agent.id,
        config: {
          ...widgetSettings.config,
          ...newSettings,
        },
      };

      // Update the state with the new settings
      setWidgetSettings(updatedWidgetSettings);

      console.log("Widget settings updated:", updatedWidgetSettings);

      // Here you would typically call an API to persist these changes
    }
  };

  return (
    <Card className="overflow-hidden border border-border/40 shadow-sm hover:shadow transition-shadow">
      <CardHeader className="p-4 pb-2 bg-muted/20">
        <CardTitle className="text-base">Widget Appearance</CardTitle>
        <CardDescription className="text-xs">
          Customize how your agent widget appears on your website
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
              <Label
                htmlFor="showBackgroundCard"
                className="text-sm font-medium cursor-pointer flex-1"
              >
                Show background card
                <p className="text-xs text-muted-foreground mt-0.5">
                  Display a card with title above the call button
                </p>
              </Label>
              <Switch
                id="showBackgroundCard"
                checked={widgetSettings.config.showBackgroundCard !== false}
                onCheckedChange={(checked) => {
                  handleSettingChange("widget", {
                    showBackgroundCard: checked,
                  });
                }}
              />
            </div>

            {widgetSettings.config.showBackgroundCard !== false && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="widgetTitle" className="text-sm font-medium">
                    Widget Title
                  </Label>
                  <Input
                    id="widgetTitle"
                    placeholder="Need help?"
                    value={widgetSettings.config.title ?? ""}
                    onChange={(e) => {
                      handleSettingChange("widget", {
                        title: e.target.value,
                      });
                    }}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="backgroundColor"
                    className="text-sm font-medium"
                  >
                    Background Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={widgetSettings.config.backgroundColor || "#FFFFFF"}
                      onChange={(e) => {
                        handleSettingChange("widget", {
                          backgroundColor: e.target.value,
                        });
                      }}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={widgetSettings.config.backgroundColor || "#FFFFFF"}
                      onChange={(e) => {
                        handleSettingChange("widget", {
                          backgroundColor: e.target.value,
                        });
                      }}
                      className="h-9 text-sm"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor" className="text-sm font-medium">
                    Text Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={widgetSettings.config.textColor || "#666666"}
                      onChange={(e) => {
                        handleSettingChange("widget", {
                          textColor: e.target.value,
                        });
                      }}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={widgetSettings.config.textColor || "#666666"}
                      onChange={(e) => {
                        handleSettingChange("widget", {
                          textColor: e.target.value,
                        });
                      }}
                      className="h-9 text-sm"
                      placeholder="#666666"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="widgetWidth"
                      className="text-sm font-medium"
                    >
                      Width (px)
                    </Label>
                    <Input
                      id="widgetWidth"
                      type="number"
                      min="200"
                      placeholder="Width"
                      value={widgetSettings.config.width}
                      onChange={(e) => {
                        handleSettingChange("widget", {
                          width: e.target.value,
                        });
                      }}
                      className={`h-9 text-sm ${
                        widthWarning ? "border-red-500" : ""
                      }`}
                    />
                    {widthWarning && (
                      <Alert variant="destructive" className="py-2 mt-1">
                        <AlertDescription className="text-xs">
                          {widthWarning}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="widgetHeight"
                      className="text-sm font-medium"
                    >
                      Height (px)
                    </Label>
                    <Input
                      id="widgetHeight"
                      type="number"
                      min="150"
                      placeholder="Height"
                      value={widgetSettings.config.height}
                      onChange={(e) => {
                        handleSettingChange("widget", {
                          height: e.target.value,
                        });
                      }}
                      className={`h-9 text-sm ${
                        heightWarning ? "border-red-500" : ""
                      }`}
                    />
                    {heightWarning && (
                      <Alert variant="destructive" className="py-2 mt-1">
                        <AlertDescription className="text-xs">
                          {heightWarning}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="buttonText" className="text-sm font-medium">
                Button Text
              </Label>
              <Input
                id="buttonText"
                placeholder="Text to display on button"
                value={widgetSettings.config.buttonText ?? ""}
                onChange={(e) => {
                  handleSettingChange("widget", {
                    buttonText: e.target.value,
                  });
                }}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor" className="text-sm font-medium">
                Button Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={widgetSettings.config.primaryColor || "#000000"}
                  onChange={(e) => {
                    handleSettingChange("widget", {
                      primaryColor: e.target.value,
                    });
                  }}
                  className="w-12 h-9 p-1"
                />
                <Input
                  value={widgetSettings.config.primaryColor || "#000000"}
                  onChange={(e) => {
                    handleSettingChange("widget", {
                      primaryColor: e.target.value,
                    });
                  }}
                  className="h-9 text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonTextColor" className="text-sm font-medium">
                Button Text Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="buttonTextColor"
                  type="color"
                  value={widgetSettings.config.buttonTextColor || "#FFFFFF"}
                  onChange={(e) => {
                    handleSettingChange("widget", {
                      buttonTextColor: e.target.value,
                    });
                  }}
                  className="w-12 h-9 p-1"
                />
                <Input
                  value={widgetSettings.config.buttonTextColor || "#FFFFFF"}
                  onChange={(e) => {
                    handleSettingChange("widget", {
                      buttonTextColor: e.target.value,
                    });
                  }}
                  className="h-9 text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borderRadius" className="text-sm font-medium">
                Border Radius
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="borderRadius"
                  type="range"
                  min="0"
                  max="24"
                  value={widgetSettings.config.borderRadius || "12"}
                  onChange={(e) => {
                    handleSettingChange("widget", {
                      borderRadius: e.target.value,
                    });
                  }}
                  className="flex-1"
                />
                <span className="text-sm w-8 text-center">
                  {widgetSettings.config.borderRadius || "12"}px
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border rounded-md p-6 bg-gray-50 dark:bg-gray-900">
            <div className="text-center mb-8 text-sm text-muted-foreground">
              Widget Preview
            </div>

            {widgetSettings.config.showBackgroundCard !== false ? (
              <div
                className="relative rounded-lg shadow-lg overflow-hidden"
                style={{
                  backgroundColor:
                    widgetSettings.config.backgroundColor || "#FFFFFF",
                  borderRadius: `${widgetSettings.config.borderRadius || 12}px`,
                  width: `${widgetSettings.config.width || 300}px`,
                  height: `${widgetSettings.config.height || 150}px`,
                }}
              >
                <div
                  className={`p-6 text-center ${
                    (widgetSettings.config.title ?? "") === ""
                      ? "flex items-center justify-center h-full"
                      : ""
                  }`}
                >
                  {(widgetSettings.config.title ?? "") !== "" && (
                    <h3
                      className="text-lg font-medium mb-6"
                      style={{
                        color: widgetSettings.config.textColor || "#666666",
                      }}
                    >
                      {widgetSettings.config.title}
                    </h3>
                  )}

                  <button
                    className="flex items-center justify-center gap-2 py-3 px-6 rounded-full w-full"
                    style={{
                      backgroundColor:
                        widgetSettings.config.primaryColor || "#000000",
                      color: widgetSettings.config.buttonTextColor || "#FFFFFF",
                      borderRadius: `${Math.min(
                        Number(widgetSettings.config.borderRadius || 12) * 2,
                        24
                      )}px`,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {(widgetSettings.config.buttonText ?? "") !== ""
                      ? widgetSettings.config.buttonText
                      : ""}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex items-center justify-center gap-2 rounded-full shadow-lg px-6 py-3"
                style={{
                  backgroundColor:
                    widgetSettings.config.primaryColor || "#000000",
                  color: widgetSettings.config.buttonTextColor || "#FFFFFF",
                  borderRadius: `${Math.min(
                    Number(widgetSettings.config.borderRadius || 12) * 2,
                    24
                  )}px`,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                {(widgetSettings.config.buttonText ?? "") !== ""
                  ? widgetSettings.config.buttonText
                  : ""}
              </button>
            )}

            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                {widgetSettings.config.showBackgroundCard !== false
                  ? `Widget with background card (${
                      widgetSettings.config.width || 300
                    }px × ${widgetSettings.config.height || 150}px)`
                  : "Button-only widget"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
