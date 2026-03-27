"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Cloud,
  Mail,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  TestTube,
  Box,
  RefreshCw,
} from "lucide-react";

interface Integration {
  id: string;
  type: string;
  name: string;
  config: string;
  enabled: boolean;
  lastSyncAt: string | null;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = React.useState<Integration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [testResult, setTestResult] = React.useState<{ type: string; success: boolean; message: string } | null>(null);
  const [testing, setTesting] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  const [cloudflareConfig, setCloudflareConfig] = React.useState({
    accountId: "",
    apiToken: "",
  });

  const [iterableConfig, setIterableConfig] = React.useState({
    apiKey: "",
    projectId: "",
  });

  const [marketoConfig, setMarketoConfig] = React.useState({
    clientId: "",
    clientSecret: "",
    munchkinId: "",
  });

  const [contentfulConfig, setContentfulConfig] = React.useState({
    spaceId: "",
    accessToken: "",
    managementToken: "",
    environment: "master",
  });

  React.useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((data: Integration[]) => {
        setIntegrations(data);
        for (const int of data) {
          const config = JSON.parse(int.config || "{}");
          if (int.type === "cloudflare") {
            setCloudflareConfig({
              accountId: config.accountId || "",
              apiToken: config.apiToken || "",
            });
          } else if (int.type === "iterable") {
            setIterableConfig({
              apiKey: config.apiKey || "",
              projectId: config.projectId || "",
            });
          } else if (int.type === "marketo") {
            setMarketoConfig({
              clientId: config.clientId || "",
              clientSecret: config.clientSecret || "",
              munchkinId: config.munchkinId || "",
            });
          } else if (int.type === "contentful") {
            setContentfulConfig({
              spaceId: config.spaceId || "",
              accessToken: config.accessToken || "",
              managementToken: config.managementToken || "",
              environment: config.environment || "master",
            });
          }
        }
        setLoading(false);
      });
  }, []);

  const getIntegration = (type: string) => integrations.find((i) => i.type === type);

  const handleSave = async (type: string, name: string, config: Record<string, string>) => {
    setSaving(type);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, config, enabled: true }),
      });
      if (res.ok) {
        const saved = await res.json();
        setIntegrations((prev) => {
          const existing = prev.findIndex((i) => i.type === type);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = saved;
            return updated;
          }
          return [...prev, saved];
        });

        // Also update .env hints for Cloudflare
        if (type === "cloudflare") {
          setTestResult({
            type,
            success: true,
            message: "Saved! Remember to also set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your .env file for server-side translations.",
          });
        } else {
          setTestResult({ type, success: true, message: "Configuration saved successfully!" });
        }
      }
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (type: string) => {
    setTesting(type);
    setTestResult(null);
    try {
      const body: Record<string, string> = { type };
      if (type === "iterable") {
        body.apiKey = iterableConfig.apiKey;
      } else if (type === "marketo") {
        Object.assign(body, marketoConfig);
      } else if (type === "contentful") {
        body.spaceId = contentfulConfig.spaceId;
        body.accessToken = contentfulConfig.accessToken;
      }

      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setTestResult({ type, ...data });
    } catch {
      setTestResult({ type, success: false, message: "Connection test failed" });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect translation services and content platforms
        </p>
      </div>

      <Tabs defaultValue="cloudflare" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cloudflare" className="gap-2">
            <Cloud className="h-4 w-4" />
            Cloudflare Workers AI
          </TabsTrigger>
          <TabsTrigger value="iterable" className="gap-2">
            <Mail className="h-4 w-4" />
            Iterable
          </TabsTrigger>
          <TabsTrigger value="marketo" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Marketo
          </TabsTrigger>
          <TabsTrigger value="contentful" className="gap-2">
            <Box className="h-4 w-4" />
            Contentful
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cloudflare">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Cloudflare Workers AI
                  </CardTitle>
                  <CardDescription>
                    Machine translation powered by Cloudflare Workers AI (Meta M2M-100 model)
                  </CardDescription>
                </div>
                {getIntegration("cloudflare")?.enabled && (
                  <Badge variant="success">Connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Account ID</label>
                <Input
                  value={cloudflareConfig.accountId}
                  onChange={(e) =>
                    setCloudflareConfig((p) => ({ ...p, accountId: e.target.value }))
                  }
                  placeholder="Your Cloudflare Account ID"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">API Token</label>
                <Input
                  type="password"
                  value={cloudflareConfig.apiToken}
                  onChange={(e) =>
                    setCloudflareConfig((p) => ({ ...p, apiToken: e.target.value }))
                  }
                  placeholder="Your Cloudflare API Token"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a token with Workers AI permissions at dash.cloudflare.com
                </p>
              </div>

              {testResult?.type === "cloudflare" && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    testResult.success
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleSave("cloudflare", "Cloudflare Workers AI", cloudflareConfig)
                  }
                  disabled={saving === "cloudflare"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving === "cloudflare" ? "Saving..." : "Save Configuration"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTest("cloudflare")}
                  disabled={testing === "cloudflare"}
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {testing === "cloudflare" ? "Testing..." : "Test Connection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iterable">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Iterable
                  </CardTitle>
                  <CardDescription>
                    Connect to Iterable to manage email template translations
                  </CardDescription>
                </div>
                {getIntegration("iterable")?.enabled && (
                  <Badge variant="success">Connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  value={iterableConfig.apiKey}
                  onChange={(e) =>
                    setIterableConfig((p) => ({ ...p, apiKey: e.target.value }))
                  }
                  placeholder="Your Iterable API Key"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Found in Iterable under Integrations &gt; API Keys
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Project ID (optional)</label>
                <Input
                  value={iterableConfig.projectId}
                  onChange={(e) =>
                    setIterableConfig((p) => ({ ...p, projectId: e.target.value }))
                  }
                  placeholder="Iterable Project ID"
                  className="mt-1"
                />
              </div>

              {testResult?.type === "iterable" && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    testResult.success
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave("iterable", "Iterable", iterableConfig)}
                  disabled={saving === "iterable"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving === "iterable" ? "Saving..." : "Save Configuration"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTest("iterable")}
                  disabled={testing === "iterable" || !iterableConfig.apiKey}
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {testing === "iterable" ? "Testing..." : "Test Connection"}
                </Button>
              </div>

              <div className="rounded-md bg-muted p-4">
                <h4 className="font-medium text-sm mb-2">How Iterable Integration Works</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Create a project with content type &quot;Iterable Email&quot;</li>
                  <li>Add your email template strings (subject lines, body copy, CTAs)</li>
                  <li>Use auto-translate or manually translate content</li>
                  <li>Export approved translations to update Iterable templates via API</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketo">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Marketo
                  </CardTitle>
                  <CardDescription>
                    Connect to Marketo to manage email and landing page translations
                  </CardDescription>
                </div>
                {getIntegration("marketo")?.enabled && (
                  <Badge variant="success">Connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Munchkin ID</label>
                <Input
                  value={marketoConfig.munchkinId}
                  onChange={(e) =>
                    setMarketoConfig((p) => ({ ...p, munchkinId: e.target.value }))
                  }
                  placeholder="e.g., 123-ABC-456"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Found in Marketo under Admin &gt; Integration &gt; Munchkin
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Client ID</label>
                <Input
                  value={marketoConfig.clientId}
                  onChange={(e) =>
                    setMarketoConfig((p) => ({ ...p, clientId: e.target.value }))
                  }
                  placeholder="LaunchPoint API Client ID"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Client Secret</label>
                <Input
                  type="password"
                  value={marketoConfig.clientSecret}
                  onChange={(e) =>
                    setMarketoConfig((p) => ({ ...p, clientSecret: e.target.value }))
                  }
                  placeholder="LaunchPoint API Client Secret"
                  className="mt-1"
                />
              </div>

              {testResult?.type === "marketo" && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    testResult.success
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave("marketo", "Marketo", marketoConfig)}
                  disabled={saving === "marketo"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving === "marketo" ? "Saving..." : "Save Configuration"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTest("marketo")}
                  disabled={
                    testing === "marketo" ||
                    !marketoConfig.clientId ||
                    !marketoConfig.clientSecret ||
                    !marketoConfig.munchkinId
                  }
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {testing === "marketo" ? "Testing..." : "Test Connection"}
                </Button>
              </div>

              <div className="rounded-md bg-muted p-4">
                <h4 className="font-medium text-sm mb-2">How Marketo Integration Works</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Create a project with content type &quot;Marketo Email&quot;</li>
                  <li>Add email/landing page content strings to translate</li>
                  <li>Use auto-translate or manually translate content</li>
                  <li>Export approved translations to update Marketo assets via API</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contentful">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="h-5 w-5" />
                    Contentful
                  </CardTitle>
                  <CardDescription>
                    Connect to Contentful to import and translate space entries
                  </CardDescription>
                </div>
                {getIntegration("contentful")?.enabled && (
                  <Badge variant="success">Connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Space ID</label>
                <Input
                  value={contentfulConfig.spaceId}
                  onChange={(e) =>
                    setContentfulConfig((p) => ({ ...p, spaceId: e.target.value }))
                  }
                  placeholder="Your Contentful Space ID"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Found in Contentful under Settings &gt; General settings
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Content Delivery API Access Token</label>
                <Input
                  type="password"
                  value={contentfulConfig.accessToken}
                  onChange={(e) =>
                    setContentfulConfig((p) => ({ ...p, accessToken: e.target.value }))
                  }
                  placeholder="Content Delivery API access token"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Found under Settings &gt; API keys &gt; Content Delivery API - access token
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Content Management API Token (optional)</label>
                <Input
                  type="password"
                  value={contentfulConfig.managementToken}
                  onChange={(e) =>
                    setContentfulConfig((p) => ({ ...p, managementToken: e.target.value }))
                  }
                  placeholder="Content Management API token (for writing translations back)"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Required to push approved translations back to Contentful
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Environment</label>
                <Input
                  value={contentfulConfig.environment}
                  onChange={(e) =>
                    setContentfulConfig((p) => ({ ...p, environment: e.target.value }))
                  }
                  placeholder="master"
                  className="mt-1"
                />
              </div>

              {testResult?.type === "contentful" && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    testResult.success
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleSave("contentful", "Contentful", contentfulConfig)
                  }
                  disabled={saving === "contentful"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving === "contentful" ? "Saving..." : "Save Configuration"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTest("contentful")}
                  disabled={
                    testing === "contentful" ||
                    !contentfulConfig.spaceId ||
                    !contentfulConfig.accessToken
                  }
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {testing === "contentful" ? "Testing..." : "Test Connection"}
                </Button>
              </div>

              <div className="rounded-md bg-muted p-4">
                <h4 className="font-medium text-sm mb-2">How Contentful Integration Works</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Connect your Contentful space using the credentials above</li>
                  <li>Create a project with content type &quot;Contentful&quot;</li>
                  <li>Browse and import entries from the Contentful Content Browser</li>
                  <li>Localized text fields are imported as translation strings</li>
                  <li>Translate using auto-translate or manual translation</li>
                  <li>Optionally push approved translations back to Contentful (requires CMA token)</li>
                </ol>
              </div>

              {getIntegration("contentful")?.enabled && (
                <div className="border-t pt-4">
                  <a href="/contentful">
                    <Button variant="outline" className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Open Contentful Content Browser
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
