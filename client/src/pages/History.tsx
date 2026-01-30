import React from "react";
import { Navigation } from "@/components/Navigation";
import { useHistory, useClearHistory } from "@/hooks/use-history";
import { CyberButton } from "@/components/CyberButton";
import { Trash2, History as HistoryIcon, Wifi, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function History() {
  const { data: history, isLoading } = useHistory();
  const clearHistory = useClearHistory();

  return (
    <div className="min-h-screen pb-20">
      <div className="scanline" />
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <HistoryIcon className="w-8 h-8 text-primary" />
              Mission Logs
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              Archives of previous network stress tests.
            </p>
          </div>
          
          <CyberButton 
            variant="destructive" 
            size="sm"
            onClick={() => clearHistory.mutate()}
            disabled={!history?.length || clearHistory.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Purge Archives
          </CyberButton>
        </div>

        <div className="cyber-card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse font-mono">
              [LOADING ENCRYPTED DATA...]
            </div>
          ) : !history?.length ? (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <Wifi className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-mono">No logs found in the mainframe.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-white/5">
                    <th className="p-4 uppercase tracking-wider text-xs text-muted-foreground font-bold">Time</th>
                    <th className="p-4 uppercase tracking-wider text-xs text-muted-foreground font-bold">Target</th>
                    <th className="p-4 uppercase tracking-wider text-xs text-muted-foreground font-bold">Duration</th>
                    <th className="p-4 uppercase tracking-wider text-xs text-muted-foreground font-bold text-right">Requests</th>
                    <th className="p-4 uppercase tracking-wider text-xs text-muted-foreground font-bold text-right">Data</th>
                    <th className="p-4 uppercase tracking-wider text-xs text-muted-foreground font-bold text-center">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {history.map((run) => {
                    // Calculate health
                    const errorRate = run.totalRequests > 0 
                      ? (run.errorCount / run.totalRequests) * 100 
                      : 0;
                    
                    return (
                      <tr key={run.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {run.createdAt ? format(new Date(run.createdAt), "MMM d, HH:mm:ss") : "-"}
                        </td>
                        <td className="p-4 max-w-xs truncate text-primary group-hover:text-primary/80 transition-colors" title={run.targetUrl}>
                          {run.targetUrl}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {run.durationSeconds}s
                        </td>
                        <td className="p-4 text-right tabular-nums">
                          {run.totalRequests.toLocaleString()}
                        </td>
                        <td className="p-4 text-right tabular-nums text-accent">
                          {formatBytes(run.totalBytes)}
                        </td>
                        <td className="p-4 text-center">
                          {errorRate > 0 ? (
                            <span className="inline-flex items-center gap-1 text-destructive bg-destructive/10 px-2 py-0.5 rounded text-xs border border-destructive/20">
                              <AlertTriangle className="w-3 h-3" />
                              {errorRate.toFixed(1)}% ERR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded text-xs border border-primary/20">
                              100% OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
