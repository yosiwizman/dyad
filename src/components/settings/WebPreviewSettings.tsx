import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useRole } from "@/contexts/RoleContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { isWebPreviewMode } from "@/lib/platform/bridge";

export function WebPreviewSettings() {
  const { settings, updateSettings } = useSettings();
  const { role } = useRole();
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState<string>("");
  const [brokerUrlInput, setBrokerUrlInput] = useState("");

  const isAdmin = role === "admin";
  const isWebPreview = isWebPreviewMode();
  const currentBrokerUrl = settings?.llmProxyUrl || "";

  // Only show in web preview mode
  if (!isWebPreview) {
    return null;
  }

  const handleTestConnection = async () => {
    const urlToTest = brokerUrlInput.trim() || currentBrokerUrl;
    if (!urlToTest) {
      setTestStatus("error");
      setTestMessage("Please enter a broker URL first");
      return;
    }

    setTestStatus("testing");
    setTestMessage("");

    try {
      const response = await fetch(`${urlToTest}/api/v1/chat/completions`, {
        method: "OPTIONS",
        headers: {
          Origin: window.location.origin,
        },
      });

      if (response.status === 204) {
        const corsHeader = response.headers.get("Access-Control-Allow-Origin");
        if (corsHeader) {
          setTestStatus("success");
          setTestMessage("Connection successful! Broker is reachable.");
        } else {
          setTestStatus("error");
          setTestMessage("Broker responded but CORS headers are missing");
        }
      } else {
        setTestStatus("error");
        setTestMessage(`Connection failed with status ${response.status}`);
      }
    } catch (error) {
      setTestStatus("error");
      setTestMessage(
        error instanceof Error ? error.message : "Unable to reach the broker",
      );
    }
  };

  const handleSaveBrokerUrl = async () => {
    const newUrl = brokerUrlInput.trim();
    if (!newUrl) return;

    try {
      await updateSettings({ llmProxyUrl: newUrl });
      setBrokerUrlInput("");
      setTestMessage("");
      setTestStatus("idle");
    } catch (error) {
      console.error("Failed to save broker URL:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="llm-proxy-url">
          LLM Proxy URL {!isAdmin && "(Admin Only)"}
        </Label>
        {isAdmin ? (
          <div className="space-y-2">
            <Input
              id="llm-proxy-url"
              type="url"
              placeholder={
                currentBrokerUrl || "https://your-worker.workers.dev"
              }
              value={brokerUrlInput}
              onChange={(e) => setBrokerUrlInput(e.target.value)}
              className="font-mono text-sm"
            />
            {brokerUrlInput && (
              <Button onClick={handleSaveBrokerUrl} size="sm" variant="outline">
                Save URL
              </Button>
            )}
            {!brokerUrlInput && currentBrokerUrl && (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Current: {currentBrokerUrl}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono p-2 bg-gray-100 dark:bg-gray-900 rounded">
            {currentBrokerUrl || "Not configured"}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleTestConnection}
          disabled={testStatus === "testing"}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          {testStatus === "testing" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>

        {testStatus === "success" && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{testMessage}</span>
          </div>
        )}

        {testStatus === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            <span>{testMessage}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          The LLM Proxy enables AI chat in the web preview without exposing API
          keys.
        </p>
        <p>
          The proxy must support CORS and the{" "}
          <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
            /api/v1/chat/completions
          </code>{" "}
          endpoint.
        </p>
      </div>
    </div>
  );
}
