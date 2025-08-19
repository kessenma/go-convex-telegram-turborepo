"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useModelSelectionStore } from "../../stores/use-model-selection-store";
import { Card } from "../ui/card";

interface ModelStatus {
  name: string;
  display_name: string;
  status: string;
  is_loaded: boolean;
  is_current: boolean;
  provider: string;
  priority: number;
}

interface ModelSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelsStatus: Record<string, ModelStatus>;
  currentModel?: string;
}

export const ModelSelectionModal = ({
  open,
  onOpenChange,
  modelsStatus,
  currentModel
}: ModelSelectionModalProps) => {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false);
  const { setSelectedModel } = useModelSelectionStore();

  // Convert modelsStatus object to array and sort by priority
  const allModels = Object.values(modelsStatus).sort((a, b) => a.priority - b.priority);
  
  // Filter for downloaded models only for the default selection
  const downloadedModels = allModels.filter(model => model.is_loaded || model.status === 'loaded');

  const handleUpdateDefault = async () => {
    if (!selectedModelId) {
      toast.error("Please select a model first");
      return;
    }

    setIsUpdatingDefault(true);
    try {
      await setSelectedModel(selectedModelId);
      toast.success(`Default model updated to ${selectedModelId}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating default model:', error);
      toast.error("Failed to update default model");
    } finally {
      setIsUpdatingDefault(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[800px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>Select Default Model</SheetTitle>
          <SheetDescription>
            Choose from your downloaded models to set as the default
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="mb-4">
            <h3 className="mb-2 text-lg font-semibold">Current Default Model</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current: <span className="font-medium">{currentModel || 'None selected'}</span>
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Available Models (Downloaded)</h4>
            <div className="grid gap-3">
              {downloadedModels.map((model) => {
                const isSelected = selectedModelId === model.name;
                const isCurrent = model.name === currentModel;
                const isAvailable = model.is_loaded || model.status === 'loaded';
                
                const modelCard = (
                  <Card
                    key={model.name}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950/20'
                        : isAvailable
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        : 'bg-gray-100 opacity-50 cursor-not-allowed dark:bg-gray-800'
                    } ${
                      isCurrent ? 'bg-green-50 border-green-500 dark:bg-green-950/20' : ''}`}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedModelId(isSelected ? null : model.name);
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex gap-2 items-center">
                          <h3 className="font-medium">{model.display_name}</h3>
                          {isCurrent && (
                            <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full dark:text-green-300 dark:bg-green-900">
                              Current
                            </span>
                          )}
                          {isSelected && (
                            <span className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-full dark:text-blue-300 dark:bg-blue-900">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Status: {model.status} | Provider: {model.provider}
                        </p>
                      </div>
                      <div className="ml-4">
                        {isAvailable ? (
                          <div className="flex justify-center items-center w-6 h-6 bg-green-100 rounded-full dark:bg-green-900">
                            <div className="w-3 h-3 bg-green-600 rounded-full dark:bg-green-400" />
                          </div>
                        ) : (
                          <div className="flex justify-center items-center w-6 h-6 bg-gray-100 rounded-full dark:bg-gray-700">
                            <div className="w-3 h-3 bg-gray-400 rounded-full dark:bg-gray-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
                
                return modelCard;
              })}
            </div>
            
            <div className="flex justify-end pt-4 space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                  setSelectedModelId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDefault}
                disabled={isUpdatingDefault || !selectedModelId || selectedModelId === currentModel}
              >
                {isUpdatingDefault && (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                )}
                {isUpdatingDefault ? "Updating..." : "Update Default Model"}
              </Button>
            </div>
          </div>
        </div>
       </SheetContent>
     </Sheet>
  );
};
