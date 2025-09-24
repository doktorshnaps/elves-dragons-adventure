import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Database, Globe } from 'lucide-react';
import { getCurrentEnvironment, getSupabaseConfig, isDevelopment, isProduction } from '@/config/environment';

export const EnvironmentSwitcher = () => {
  const [currentEnv, setCurrentEnv] = useState(getCurrentEnvironment());
  const config = getSupabaseConfig();

  const refreshEnvironment = () => {
    setCurrentEnv(getCurrentEnvironment());
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Environment Status
        </CardTitle>
        <CardDescription>
          Current database environment and configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Environment:</span>
          <Badge variant={isDevelopment() ? "secondary" : "default"}>
            {currentEnv.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">Supabase URL:</span>
          </div>
          <div className="text-xs text-muted-foreground break-all">
            {config.url}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Key Prefix:</div>
          <div className="text-xs text-muted-foreground">
            {config.anonKey.substring(0, 20)}...
          </div>
        </div>

        {isDevelopment() && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-800">
              <div className="font-medium">Development Mode</div>
              <div>Changes affect the development database</div>
            </div>
          </div>
        )}

        {isProduction() && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-xs text-red-800">
              <div className="font-medium">Production Mode</div>
              <div>Changes affect live player data!</div>
            </div>
          </div>
        )}

        <Button 
          onClick={refreshEnvironment} 
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
};