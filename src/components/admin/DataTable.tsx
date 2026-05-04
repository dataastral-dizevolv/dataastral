import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
}

export function DataTable<T>({ columns, rows, emptyMessage }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border/70">
            {columns.map((column) => (
              <th key={column.key} className={cn("px-4 py-3 font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border/70 align-top transition-colors hover:bg-muted/20">
              {columns.map((column) => (
                <td key={`${column.key}-${index}`} className={cn("px-4 py-3 text-foreground", column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
