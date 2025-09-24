import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfirmationDialog } from "../../types";

interface ConfirmationModalProps {
  dialog: ConfirmationDialog;
  onClose: () => void;
}

export function ConfirmationModal({ dialog, onClose }: ConfirmationModalProps) {
  const handleConfirm = () => {
    dialog.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    dialog.onCancel();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      data-testid="confirmation-modal"
    >
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg" data-testid="confirmation-title">
                {dialog.title}
              </CardTitle>
              <CardDescription data-testid="confirmation-description">
                {dialog.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm text-foreground" data-testid="confirmation-details">
              {dialog.details}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCancel}
              data-testid="button-cancel-confirmation"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              data-testid="button-confirm-action"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
