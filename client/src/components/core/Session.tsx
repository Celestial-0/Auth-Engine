import { Activity } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Shield } from "lucide-react";

export function Session() {
  const { client, loading, setLoading, setResponse, config } = useAuth();

  const handleGetSession = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const result = await client.getSession();
      setResponse(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Retrieve the current session information using cookies.
      </p>
      <Button
        onClick={handleGetSession}
        disabled={loading || !config.applicationName}
        className="w-full"
      >
        {loading ? (
          <>
            <Spinner className="mr-2" />
            Loading...
          </>
        ) : (
          <>
            <Shield className="mr-2 size-4" />
            Get Session
          </>
        )}
      </Button>

      <Activity mode={!config.applicationName ? "visible" : "hidden"}>
        <div className="p-4 bg-muted border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            ⚠️ Please set an application name in the configuration above
          </p>
        </div>
      </Activity>
    </div>
  );
}
