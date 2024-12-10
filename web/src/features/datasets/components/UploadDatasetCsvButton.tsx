import { UploadIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useState } from "react";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { ActionButton } from "@/src/components/ActionButton";
import { type CsvPreviewResult } from "@/src/features/datasets/lib/csvHelpers";
import { PreviewCsvImport } from "@/src/features/datasets/components/PreviewCsvImport";
import { UploadDatasetCsv } from "@/src/features/datasets/components/UploadDatasetCsv";

export const UploadDatasetCsvButton = (props: {
  projectId: string;
  datasetId: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CsvPreviewResult | null>(null);
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "datasets:CUD",
  });
  const capture = usePostHogClientCapture();

  return (
    <Dialog open={hasAccess && open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton
          variant="outline"
          className={props.className}
          disabled={!hasAccess}
          hasAccess={hasAccess}
          onClick={() => capture("dataset_item:new_form_open")}
          icon={<UploadIcon className="h-4 w-4" aria-hidden="true" />}
        >
          Upload CSV
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="max-h-[80dvh] max-w-[80dvw]">
        <DialogHeader>
          <DialogTitle>Upload CSV</DialogTitle>
        </DialogHeader>
        {preview ? (
          <PreviewCsvImport
            preview={preview}
            projectId={props.projectId}
            datasetId={props.datasetId}
            setPreview={setPreview}
            setOpen={setOpen}
          />
        ) : (
          <UploadDatasetCsv
            projectId={props.projectId}
            datasetId={props.datasetId}
            setPreview={setPreview}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
