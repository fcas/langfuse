import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ImportCard } from "./ImportCard";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { findDefaultColumn } from "../lib/findDefaultColumn";
import { type DragEndEvent } from "@dnd-kit/core";
import { z } from "zod";
import { useEffect, useState } from "react";
import { type CsvPreviewResult } from "@/src/features/datasets/lib/csvHelpers";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { MediaContentType } from "@/src/features/media/validation";

const CardIdSchema = z.enum(["input", "expected", "metadata", "unmapped"]);
type CardId = z.infer<typeof CardIdSchema>;

function moveColumn(
  fromId: CardId,
  toId: CardId,
  columnName: string,
  sets: {
    input: Set<string>;
    expected: Set<string>;
    metadata: Set<string>;
    unmapped: Set<string>;
  },
  setters: {
    input: (s: Set<string>) => void;
    expected: (s: Set<string>) => void;
    metadata: (s: Set<string>) => void;
    unmapped: (s: Set<string>) => void;
  },
) {
  sets[fromId].delete(columnName);
  setters[fromId](new Set(sets[fromId]));

  sets[toId].add(columnName);
  setters[toId](new Set(sets[toId]));
}

export function PreviewCsvImport({
  preview,
  csvFile,
  projectId,
  datasetId,
  setCsvFile,
  setPreview,
  setOpen,
}: {
  preview: CsvPreviewResult;
  csvFile: File | null;
  projectId: string;
  datasetId: string;
  setCsvFile: (file: File | null) => void;
  setPreview: (preview: CsvPreviewResult | null) => void;
  setOpen?: (open: boolean) => void;
}) {
  const [selectedInputColumn, setSelectedInputColumn] = useState<Set<string>>(
    new Set(),
  );
  const [selectedExpectedColumn, setSelectedExpectedColumn] = useState<
    Set<string>
  >(new Set());
  const [selectedMetadataColumn, setSelectedMetadataColumn] = useState<
    Set<string>
  >(new Set());
  const [excludedColumns, setExcludedColumns] = useState<Set<string>>(
    new Set(),
  );
  const utils = api.useUtils();

  useEffect(() => {
    if (preview) {
      // Only set defaults if no columns are currently selected
      if (
        selectedInputColumn.size === 0 &&
        selectedExpectedColumn.size === 0 &&
        selectedMetadataColumn.size === 0
      ) {
        const defaultInput = new Set([
          findDefaultColumn(preview.columns, "Input", 0),
        ]);
        const defaultExpected = new Set([
          findDefaultColumn(preview.columns, "Expected", 1),
        ]);
        const defaultMetadata = new Set([
          findDefaultColumn(preview.columns, "Metadata", 2),
        ]);

        // Set default columns based on names
        setSelectedInputColumn(defaultInput);
        setSelectedExpectedColumn(defaultExpected);
        setSelectedMetadataColumn(defaultMetadata);

        // Update excluded columns based on current selections
        const newExcluded = new Set(
          preview.columns
            .filter(
              (col) =>
                !defaultInput.has(col.name) &&
                !defaultExpected.has(col.name) &&
                !defaultMetadata.has(col.name),
            )
            .map((col) => col.name),
        );

        setExcludedColumns(newExcluded);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]); // Only depend on preview changes

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const columnName = active.id as string;
    const fromCardId = active.data.current?.fromCardId;
    const toCardId = over.id;

    if (fromCardId === toCardId) return;

    const parsedFromCardId = CardIdSchema.safeParse(fromCardId);
    const parsedToCardId = CardIdSchema.safeParse(toCardId);

    if (!parsedFromCardId.success || !parsedToCardId.success) return;

    // Handle moving column between cards
    moveColumn(
      parsedFromCardId.data,
      parsedToCardId.data,
      columnName,
      {
        input: selectedInputColumn,
        expected: selectedExpectedColumn,
        metadata: selectedMetadataColumn,
        unmapped: excludedColumns,
      },
      {
        input: setSelectedInputColumn,
        expected: setSelectedExpectedColumn,
        metadata: setSelectedMetadataColumn,
        unmapped: setExcludedColumns,
      },
    );
  };

  const generatePresignedUrl = api.utilities.generatePresignedUrl.useMutation();
  const mutImport = api.datasets.importFromCsv.useMutation({
    onSuccess: () => {
      utils.datasets.invalidate();
      setOpen?.(false);
      setPreview(null);
    },
  });

  return (
    <Card className="h-full items-center justify-center overflow-hidden p-2">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Import {preview.fileName}</CardTitle>
        <CardDescription>
          Map your CSV columns to dataset fields. The CSV file must have column
          headers in the first row.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex max-h-full min-h-0 flex-col gap-4">
        <div className="h-3/5 overflow-hidden">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid h-full grid-cols-4 gap-4">
              <ImportCard
                id="input"
                title="Input"
                columns={preview.columns.filter((col) =>
                  selectedInputColumn.has(col.name),
                )}
                onColumnSelect={(columnName) => {
                  setSelectedInputColumn(
                    new Set([...selectedInputColumn, columnName]),
                  );
                }}
                onColumnRemove={(columnName) => {
                  setSelectedInputColumn(
                    new Set(
                      [...selectedInputColumn].filter(
                        (col) => col !== columnName,
                      ),
                    ),
                  );
                }}
              />
              <ImportCard
                id="expected"
                title="Expected"
                columns={preview.columns.filter((col) =>
                  selectedExpectedColumn.has(col.name),
                )}
                onColumnSelect={(columnName) => {
                  setSelectedExpectedColumn(
                    new Set([...selectedExpectedColumn, columnName]),
                  );
                }}
                onColumnRemove={(columnName) => {
                  setSelectedExpectedColumn(
                    new Set(
                      [...selectedExpectedColumn].filter(
                        (col) => col !== columnName,
                      ),
                    ),
                  );
                }}
              />
              <ImportCard
                id="metadata"
                title="Metadata"
                columns={preview.columns.filter((col) =>
                  selectedMetadataColumn.has(col.name),
                )}
                onColumnSelect={(columnName) => {
                  setSelectedMetadataColumn(
                    new Set([...selectedMetadataColumn, columnName]),
                  );
                }}
                onColumnRemove={(columnName) => {
                  setSelectedMetadataColumn(
                    new Set(
                      [...selectedMetadataColumn].filter(
                        (col) => col !== columnName,
                      ),
                    ),
                  );
                }}
              />
              <ImportCard
                id="unmapped"
                title="Not mapped"
                columns={preview.columns.filter((col) =>
                  excludedColumns.has(col.name),
                )}
                onColumnSelect={(columnName) => {
                  setExcludedColumns(new Set([...excludedColumns, columnName]));
                }}
                onColumnRemove={(columnName) => {
                  setExcludedColumns(
                    new Set(
                      [...excludedColumns].filter((col) => col !== columnName),
                    ),
                  );
                }}
              />
            </div>
          </DndContext>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setPreview(null);
              setSelectedInputColumn(new Set());
              setSelectedExpectedColumn(new Set());
              setSelectedMetadataColumn(new Set());
              setExcludedColumns(new Set());
              setCsvFile(null);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={selectedInputColumn.size === 0}
            onClick={async () => {
              if (!csvFile) return;

              const { uploadUrl, bucketPath } =
                await generatePresignedUrl.mutateAsync({
                  projectId,
                  contentType: MediaContentType.CSV,
                });

              // TODO: review if this is the correct way to upload the file, we should probably extract somehow
              const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": "text/csv",
                },
                body: csvFile,
              });

              if (!uploadResponse.ok) return;

              await mutImport.mutateAsync({
                projectId,
                datasetId,
                bucketPath,
                mapping: {
                  input: Array.from(selectedInputColumn),
                  expected: Array.from(selectedExpectedColumn),
                  metadata: Array.from(selectedMetadataColumn),
                },
              });
            }}
          >
            Import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}