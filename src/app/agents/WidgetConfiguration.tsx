import { useState, useEffect } from "react";
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
import { AgentDBConfig } from "@/types/agent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, PhoneOff } from "lucide-react";
import {
  WidgetBuilderConfiguration,
  defaultWidgetConfig,
} from "@/types/widget";

// Define the WidgetSettings interface
interface WidgetSettings {
  agentId: string;
  config: WidgetBuilderConfiguration;
}

// Add props interface for the Widget component
interface WidgetProps {
  agent: AgentDBConfig;
  widgetConfig: WidgetBuilderConfiguration;
  onConfigChange: (config: WidgetBuilderConfiguration) => void;
}

const ConnectionButton = ({
  isConnected,
  isConnecting,
  onToggle,
  buttonText,
  primaryColor,
  buttonTextColor,
  borderRadius,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  onToggle: () => void;
  buttonText: string;
  primaryColor: string;
  buttonTextColor: string;
  borderRadius: string;
}) => (
  <button
    onClick={onToggle}
    className="flex items-center justify-center gap-2 py-3 px-6 rounded-full w-full text-sm"
    style={{
      backgroundColor: isConnected ? "#FFFFFF" : primaryColor || "#000000",
      color: isConnected ? "#FF4444" : buttonTextColor || "#FFFFFF",
      borderRadius: `${Math.min(Number(borderRadius || 12) * 2, 24)}px`,
      border: isConnected ? "1px solid #FF4444" : "none",
    }}
  >
    {isConnected ? (
      <>
        <PhoneOff size={20} />
        <span>End call</span>
      </>
    ) : (
      <>
        <Phone size={20} />
        <span>{isConnecting ? "Connecting..." : buttonText}</span>
      </>
    )}
  </button>
);

export function Widget({ agent, widgetConfig, onConfigChange }: WidgetProps) {
  // Add state for validation warnings
  const [widthWarning, setWidthWarning] = useState<string | null>(null);
  const [heightWarning, setHeightWarning] = useState<string | null>(null);

  // Create state for widget settings with default values
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    agentId: agent.id,
    config: widgetConfig || defaultWidgetConfig,
  });

  // Update local state when props change
  useEffect(() => {
    setWidgetSettings({
      agentId: agent.id,
      config: widgetConfig || defaultWidgetConfig,
    });
  }, [agent.id, widgetConfig]);

  // Create the handleSettingChange function
  const handleSettingChange = (settingType: string, newSettings: any) => {
    if (settingType === "widget") {
      // Handle showBackgroundCard changes - reset warnings and clear irrelevant fields
      if ("showBackgroundCard" in newSettings) {
        if (!newSettings.showBackgroundCard) {
          // When disabling background card, clear fields that aren't relevant
          // Keep only: buttonText, primaryColor, buttonTextColor, borderRadius
          setWidthWarning(null);
          setHeightWarning(null);

          const relevantConfig = {
            showBackgroundCard: false,
            buttonText: widgetSettings.config.buttonText,
            primaryColor: widgetSettings.config.primaryColor,
            buttonTextColor: widgetSettings.config.buttonTextColor,
            borderRadius: widgetSettings.config.borderRadius,
          };

          setWidgetSettings({
            agentId: agent.id,
            config: relevantConfig,
          });

          // Notify parent component of the change
          onConfigChange(relevantConfig);
          return;
        } else {
          // When enabling background card, restore default values for card-specific fields
          const cardEnabledConfig = {
            ...widgetSettings.config,
            showBackgroundCard: true,
            title: widgetSettings.config.title || defaultWidgetConfig.title,
            backgroundColor:
              widgetSettings.config.backgroundColor ||
              defaultWidgetConfig.backgroundColor,
            textColor:
              widgetSettings.config.textColor || defaultWidgetConfig.textColor,
            width: widgetSettings.config.width || defaultWidgetConfig.width,
            height: widgetSettings.config.height || defaultWidgetConfig.height,
          };

          // Validate current dimensions
          const widthValue = parseInt(cardEnabledConfig.width || "0");
          if (widthValue < 200) {
            setWidthWarning(
              "Width should be at least 200px when background card is shown"
            );
          }

          const heightValue = parseInt(cardEnabledConfig.height || "0");
          if (heightValue < 110) {
            setHeightWarning(
              "Height should be at least 110px when background card is shown"
            );
          }

          setWidgetSettings({
            agentId: agent.id,
            config: cardEnabledConfig,
          });

          // Notify parent component of the change
          onConfigChange(cardEnabledConfig);
          return;
        }
      }

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
        if (heightValue < 110) {
          setHeightWarning(
            "Height should be at least 110px when background card is shown"
          );
        } else {
          setHeightWarning(null);
        }
      } else if ("height" in newSettings && !newSettings.height) {
        setHeightWarning(null);
      }

      const updatedConfig = {
        ...widgetSettings.config,
        ...newSettings,
      };

      // Update the local state
      setWidgetSettings({
        agentId: agent.id,
        config: updatedConfig,
      });

      // Notify parent component of the change
      onConfigChange(updatedConfig);
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
                className="text-sm font-small cursor-pointer flex-1"
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
                      min="110"
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

          <div className="flex flex-col space-y-6">
            <div className="border rounded-md p-6 bg-gray-50 dark:bg-gray-900 flex flex-col items-center">
              <div className="text-center mb-6 text-sm text-muted-foreground">
                Widget Preview
              </div>

              <div className="mb-6">
                {widgetSettings.config.showBackgroundCard !== false ? (
                  <div
                    className="relative rounded-lg shadow-lg overflow-hidden flex flex-col"
                    style={{
                      backgroundColor:
                        widgetSettings.config.backgroundColor || "#FFFFFF",
                      borderRadius: `${
                        widgetSettings.config.borderRadius || 12
                      }px`,
                      width: `${widgetSettings.config.width || 200}px`,
                      height: `${widgetSettings.config.height || 110}px`,
                    }}
                  >
                    <div className="flex flex-col justify-center items-center h-full p-6">
                      {(widgetSettings.config.title ?? "") !== "" && (
                        <h3
                          className="text-sm font-medium mb-3"
                          style={{
                            color: widgetSettings.config.textColor || "#666666",
                          }}
                        >
                          {widgetSettings.config.title}
                        </h3>
                      )}

                      <ConnectionButton
                        isConnected={false}
                        isConnecting={false}
                        onToggle={() => {}}
                        buttonText={
                          widgetSettings.config.buttonText || "Voice Agent"
                        }
                        primaryColor={
                          widgetSettings.config.primaryColor || "#000000"
                        }
                        buttonTextColor={
                          widgetSettings.config.buttonTextColor || "#FFFFFF"
                        }
                        borderRadius={
                          widgetSettings.config.borderRadius || "12"
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <ConnectionButton
                    isConnected={false}
                    isConnecting={false}
                    onToggle={() => {}}
                    buttonText={
                      widgetSettings.config.buttonText || "Voice Agent"
                    }
                    primaryColor={
                      widgetSettings.config.primaryColor || "#000000"
                    }
                    buttonTextColor={
                      widgetSettings.config.buttonTextColor || "#FFFFFF"
                    }
                    borderRadius={widgetSettings.config.borderRadius || "12"}
                  />
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {widgetSettings.config.showBackgroundCard !== false
                  ? `Widget with background card (${
                      widgetSettings.config.width || 200
                    }px × ${widgetSettings.config.height || 110}px)`
                  : "Button-only widget"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
