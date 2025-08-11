import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export default function InstallPrompt() {
  const { isInstallable, installApp, isInstalled } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  // Debug logging
  console.log('InstallPrompt - isInstallable:', isInstallable, 'isDismissed:', isDismissed, 'isInstalled:', isInstalled);

  if ((!isInstallable || isDismissed) && !import.meta.env.DEV) {
    return null;
  }

  // Show a debug version in development
  if (import.meta.env.DEV && !isInstallable) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md border-2 border-yellow-200 bg-yellow-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <Smartphone className="h-5 w-5 text-yellow-600" />
            </div>
            
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-yellow-900">
                PWA Install (Debug Mode)
              </h3>
              <p className="text-xs text-yellow-700">
                Install prompt not available. Try using Chrome or Edge on desktop, or reload the page.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsDismissed(true)}
                  className="text-yellow-600 hover:bg-yellow-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsDismissed(true);
    }
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md border-2 border-blue-200 bg-blue-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>

          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-semibold text-blue-900">
              Install SendWise
            </h3>
            <p className="text-xs text-blue-700">
              For mobile, quick access and offline access. Download the app
              here.
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                Install
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="text-blue-600 hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
