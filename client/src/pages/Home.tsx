import React, { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { CyberButton } from "@/components/CyberButton";
import { StatsCard } from "@/components/StatsCard";
import { useCreateHistory } from "@/hooks/use-history";
import { api } from "@shared/routes";
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  Download, 
  Play, 
  Square,
  Globe,
  Settings,
  Database
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface ChartData {
  time: string;
  requests: number;
  bandwidth: number; // in MB
}

// Helper to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function Home() {
  // Basic login prompt
  useEffect(() => {
    const allowedPassword = "rajmaskey"; // Change this to your desired password
    let entered = false;
    while (!entered) {
      const input = window.prompt("Enter password to access this site:");
      if (input === allowedPassword) {
        entered = true;
      } else if (input === null) {
        // User cancelled prompt, redirect or block
        window.location.href = "https://www.google.com";
        return;
      } else {
        window.alert("Incorrect password. Please try again.");
      }
    }
  }, []);
  
  // Config State
  const [targetUrl, setTargetUrl] = useState("");
  const [concurrency, setConcurrency] = useState(5);
  const [duration, setDuration] = useState(30); // seconds, 0 for infinite
  const [useProxies, setUseProxies] = useState(false);
  const [proxies, setProxies] = useState<string[]>([]);
  const [proxyIndex, setProxyIndex] = useState(0);

  // Running State
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Stats State (Refs for performance during loop)
  const statsRef = useRef({
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    totalBytes: 0,
    startTime: 0,
    rateLimitCount: 0, // Track 429 errors
    corsErrorCount: 0, // Track CORS errors
  });
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [corsErrorCount, setCorsErrorCount] = useState(0);

  // Visualization State
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [realtimeStats, setRealtimeStats] = useState({
    rps: 0,
    bw: 0, // MB/s
    total: 0,
    errors: 0,
    bytes: 0
  });

  // Tools
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const createHistory = useCreateHistory();

  // Load self-test defaults
  useEffect(() => {
    const origin = window.location.origin;
    setTargetUrl(`${origin}${api.speedtest.download.path}?size=524288`); // 512KB default
  }, []);

  // Load proxies from file instead of fetching from API
  useEffect(() => {
    if (useProxies) {
      fetch('/proxies_cleaned.txt')
        .then(res => res.text())
        .then(text => {
          // Parse proxies, ignore empty lines and comments
          const list = text.split('\n').map(p => p.trim()).filter(p => p && !p.startsWith('//'));
          setProxies(list);
          setProxyIndex(0);
        });
    }
  }, [useProxies]);

  const stopTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);

    // Save history
    const finalDuration = Math.round((Date.now() - statsRef.current.startTime) / 1000);
    if (statsRef.current.totalRequests > 0) {
      createHistory.mutate({
        targetUrl,
        method: "GET",
        concurrency,
        durationSeconds: finalDuration,
        totalRequests: statsRef.current.totalRequests,
        successCount: statsRef.current.successCount,
        errorCount: statsRef.current.errorCount,
        totalBytes: statsRef.current.totalBytes,
      });
      toast({
        title: "Mission Complete",
        description: `Logged ${statsRef.current.totalRequests} requests.`,
      });
    }
  };

  const runWorker = async (signal: AbortSignal) => {
    while (!signal.aborted) {
      // Check duration limit
      if (duration > 0) {
        const elapsed = (Date.now() - statsRef.current.startTime) / 1000;
        if (elapsed >= duration) break;
      }

      try {
        let fetchOptions: RequestInit = { signal, cache: "no-store", mode: 'cors' };
        let proxyUrl = targetUrl;
        if (useProxies && proxies.length > 0) {
          const proxy = proxies[proxyIndex % proxies.length];
          setProxyIndex(i => (i + 1) % proxies.length);
          // Use proxy from list, format: IP:PORT or socks4://IP:PORT
          if (proxy.startsWith('socks4://')) {
            // Socks proxies not supported natively in browser fetch
            // Optionally, skip or show error
            continue;
          } else {
            // HTTP proxy: use a public proxy API or your own proxy server
            // Example: use a proxy API endpoint that accepts target and proxy
            proxyUrl = `/api/proxy?target=${encodeURIComponent(targetUrl)}&proxy=${encodeURIComponent(proxy)}`;
          }
        }
        const response = await fetch(proxyUrl, fetchOptions);
        
        // Read body to calculate size
        const blob = await response.blob();
        const size = blob.size;
        const end = performance.now();

        if (response.status === 429) {
          statsRef.current.rateLimitCount++;
          setRateLimitCount(statsRef.current.rateLimitCount);
          // Optional: simple backoff for 429
          await new Promise(res => setTimeout(res, 1000)); // Wait 1s before retry
          continue;
        }

        if (response.ok) {
          statsRef.current.successCount++;
          statsRef.current.totalBytes += size;
        } else {
          statsRef.current.errorCount++;
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Detect CORS error (TypeError with message 'Failed to fetch')
          if (err instanceof TypeError && err.message && err.message.match(/fetch|network/i)) {
            statsRef.current.corsErrorCount++;
            setCorsErrorCount(statsRef.current.corsErrorCount);
          } else {
            statsRef.current.errorCount++;
          }
        }
      } finally {
        statsRef.current.totalRequests++;
      }
    }
  };

  const startTest = async () => {
    // Reset stats
    statsRef.current = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      totalBytes: 0,
      startTime: Date.now(),
      rateLimitCount: 0,
      corsErrorCount: 0,
    };
    setRateLimitCount(0);
    setCorsErrorCount(0);
    setChartData([]);
    setRealtimeStats({ rps: 0, bw: 0, total: 0, errors: 0, bytes: 0 });
    setElapsedTime(0);
    setIsRunning(true);

    // Setup workers
    abortControllerRef.current = new AbortController();
    const workers = Array.from({ length: concurrency }).map(() => 
      runWorker(abortControllerRef.current!.signal)
    );

    // Start timer loop for UI updates
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - statsRef.current.startTime) / 1000;
      setElapsedTime(elapsedSec);

      if (elapsedSec > 0) {
        const currentRps = Math.round(statsRef.current.totalRequests / elapsedSec);
        const currentBw = (statsRef.current.totalBytes / 1024 / 1024) / elapsedSec; // MB/s
        
        setRealtimeStats({
          rps: currentRps,
          bw: currentBw,
          total: statsRef.current.totalRequests,
          errors: statsRef.current.errorCount,
          bytes: statsRef.current.totalBytes
        });

        setChartData(prev => {
          const newData = [...prev, {
            time: elapsedSec.toFixed(1) + 's',
            requests: currentRps,
            bandwidth: parseFloat(currentBw.toFixed(2))
          }];
          return newData.slice(-30); // Keep last 30 data points
        });
      }

      // Auto-stop if duration reached
      if (duration > 0 && elapsedSec >= duration) {
        clearInterval(intervalId);
        stopTest(); // Will handle promise cancellation
      }
    }, 500); // Update UI every 500ms

    try {
      await Promise.all(workers);
    } catch (err) {
      // Ignore abort errors
    } finally {
      clearInterval(intervalId);
      if (abortControllerRef.current) stopTest();
    }
  };

  const setSelfTest = (sizeBytes: number) => {
    const origin = window.location.origin;
    setTargetUrl(`${origin}${api.speedtest.download.path}?size=${sizeBytes}`);
    toast({ description: "Target set to self-test endpoint." });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="scanline" />
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CONTROL PANEL */}
          <div className="lg:col-span-1 space-y-6">
            <div className="cyber-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="text-primary w-5 h-5" />
                <h2 className="text-xl font-bold">Config</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Target URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input 
                      className="cyber-input w-full pl-10 pr-4 py-2 rounded-none text-sm"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://example.com/file.zip"
                      disabled={isRunning}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setSelfTest(1024 * 1024)} // 1MB
                      className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 uppercase tracking-wider transition-colors disabled:opacity-50"
                      disabled={isRunning}
                    >
                      Self-Test (1MB)
                    </button>
                    <button 
                      onClick={() => setSelfTest(5 * 1024 * 1024)} // 5MB
                      className="text-[10px] bg-accent/10 hover:bg-accent/20 text-accent px-2 py-1 uppercase tracking-wider transition-colors disabled:opacity-50"
                      disabled={isRunning}
                    >
                      Self-Test (5MB)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Concurrency</label>
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      className="cyber-input w-full px-4 py-2 rounded-none text-sm"
                      value={concurrency}
                      onChange={(e) => setConcurrency(Number(e.target.value))}
                      disabled={isRunning}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Duration (s)</label>
                    <input 
                      type="number"
                      min="0"
                      className="cyber-input w-full px-4 py-2 rounded-none text-sm"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      disabled={isRunning}
                    />
                    <div className="text-[10px] text-muted-foreground text-right">0 = Infinite</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Switch checked={useProxies} onCheckedChange={setUseProxies} id="proxy-switch" />
                  <label htmlFor="proxy-switch" className="text-xs uppercase text-muted-foreground font-bold tracking-wider cursor-pointer">Use Proxies</label>
                  <span className="text-xs text-muted-foreground ml-2">(from proxyscrape.com)</span>
                </div>

                <div className="pt-4">
                  {!isRunning ? (
                    <CyberButton 
                      className="w-full" 
                      onClick={startTest}
                      variant="primary"
                    >
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Initiate Attack
                    </CyberButton>
                  ) : (
                    <CyberButton 
                      className="w-full animate-pulse" 
                      onClick={stopTest}
                      variant="destructive"
                    >
                      <Square className="w-4 h-4 mr-2 fill-current" />
                      Abort Mission
                    </CyberButton>
                  )}
                </div>
              </div>
            </div>

            {/* STATUS ALERT */}
            <AnimatePresence>
              {realtimeStats.errors > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-destructive/10 border border-destructive/50 p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-destructive font-bold text-sm">Errors Detected</h4>
                    <p className="text-xs text-destructive/80 mt-1">
                      {realtimeStats.errors} requests failed. Check CORS settings or target availability.
                    </p>
                  </div>
                </motion.div>
              )}
              {rateLimitCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-warning/10 border border-warning/50 p-4 flex items-start gap-3 mt-2"
                >
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-warning font-bold text-sm">Rate Limiting Detected</h4>
                    <p className="text-xs text-warning/80 mt-1">
                      {rateLimitCount} requests were rate limited (HTTP 429). Lower concurrency or use more proxies to avoid this.
                    </p>
                  </div>
                </motion.div>
              )}
              {corsErrorCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-orange-100 border border-orange-300 p-4 flex items-start gap-3 mt-2"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-orange-500 font-bold text-sm">CORS Error Detected</h4>
                    <p className="text-xs text-orange-700 mt-1">
                      {corsErrorCount} requests failed due to CORS policy. The target server does not allow cross-origin requests from your browser. <br />
                      <span className="font-semibold">Solution:</span> Use a CORS proxy, run the test from a backend/server, or contact the server admin to enable CORS.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* REALTIME DASHBOARD */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard 
                label="Req / Sec" 
                value={realtimeStats.rps} 
                icon={Zap} 
                color="primary"
              />
              <StatsCard 
                label="Bandwidth" 
                value={realtimeStats.bw.toFixed(1)} 
                subValue="MB/s"
                icon={Activity} 
                color="secondary"
              />
              <StatsCard 
                label="Total Data" 
                value={formatBytes(realtimeStats.bytes)} 
                icon={Database} 
                color="accent"
              />
              <StatsCard 
                label="Total Req" 
                value={realtimeStats.total} 
                icon={Download} 
                color={realtimeStats.errors > 0 ? "destructive" : "primary"}
              />
            </div>

            <div className="cyber-card p-6 h-[400px]">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Network Telemetry
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    tick={{fontSize: 12, fontFamily: 'var(--font-mono)'}}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--secondary))" 
                    tick={{fontSize: 12, fontFamily: 'var(--font-mono)'}}
                    label={{ value: 'MB/s', angle: -90, position: 'insideLeft', fill: 'hsl(var(--secondary))', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="hsl(var(--primary))"
                    tick={{fontSize: 12, fontFamily: 'var(--font-mono)'}}
                    label={{ value: 'RPS', angle: 90, position: 'insideRight', fill: 'hsl(var(--primary))', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'var(--font-mono)' }}
                    itemStyle={{ fontSize: 12 }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="bandwidth" 
                    name="Bandwidth (MB/s)"
                    stroke="hsl(var(--secondary))" 
                    fillOpacity={1} 
                    fill="url(#colorBw)" 
                    isAnimationActive={false}
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="requests" 
                    name="Req/Sec"
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRps)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
