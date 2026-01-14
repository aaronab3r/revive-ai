'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { Phone, ArrowUpDown, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Lead, LeadStatus } from '@/types';
import { formatPhoneNumber, formatDate } from '@/lib/utils';
import { makeCall } from '@/app/actions/make-call';
import { deleteLead, deleteAllLeads } from '@/app/actions/leads';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LeadsDataTableProps {
  data: Lead[];
  onDeleteAll?: () => void;
}

const statusVariantMap: Record<LeadStatus, 'pending' | 'calling' | 'contacted' | 'booked' | 'voicemail' | 'failed'> = {
  Pending: 'pending',
  Calling: 'calling',
  Contacted: 'contacted',
  Booked: 'booked',
  Voicemail: 'voicemail',
  Failed: 'failed',
};

// CallButton component to handle individual row state
function CallButton({ lead, onStatusChange }: { 
  lead: Lead; 
  onStatusChange: (id: string, status: LeadStatus) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isDisabled = lead.status === 'Calling' || lead.status === 'Booked' || isPending;

  const handleCall = () => {
    const originalStatus = lead.status;
    
    // Optimistic update
    onStatusChange(lead.id, 'Calling');
    
    startTransition(async () => {
      const result = await makeCall({ 
        name: lead.name, 
        phone: lead.phone,
        interest: lead.interest
      });

      if (result.success) {
        toast.success(`Calling ${lead.name}...`, {
          description: `Dialing ${formatPhoneNumber(lead.phone)}`,
        });
        // Keep status as "Calling" - it will be updated via webhook in production
      } else {
        toast.error('Call failed', {
          description: result.error,
        });
        // Revert to original status on error
        onStatusChange(lead.id, originalStatus);
      }
    });
  };

  return (
    <Button
      size="sm"
      variant={isDisabled ? 'outline' : 'default'}
      disabled={isDisabled}
      onClick={handleCall}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Phone className="h-3.5 w-3.5" />
      )}
      {isPending ? 'Calling...' : 'Call Now'}
    </Button>
  );
}

// DeleteButton component for individual lead deletion
function DeleteButton({ lead, onDelete }: { 
  lead: Lead; 
  onDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    setShowConfirm(false);
    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (result.success) {
        toast.success(`Deleted ${lead.name}`);
        onDelete(lead.id);
      } else {
        toast.error('Failed to delete lead', { description: result.error });
      }
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setShowConfirm(true)}
      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 h-8 w-8"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

export function LeadsDataTable({ data: initialData, onDeleteAll }: LeadsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [leads, setLeads] = useState<Lead[]>(initialData);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync internal state with props when initialData changes (e.g. on file upload)
  useEffect(() => {
    setLeads(initialData);
  }, [initialData]);

  const handleStatusChange = (id: string, newStatus: LeadStatus) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === id 
          ? { ...lead, status: newStatus, lastContacted: newStatus === 'Calling' ? new Date() : lead.lastContacted }
          : lead
      )
    );
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    const result = await deleteAllLeads();
    setIsDeleting(false);
    setShowDeleteAllConfirm(false);
    
    if (result.success) {
      toast.success('All leads deleted successfully');
      setLeads([]);
      onDeleteAll?.();
    } else {
      toast.error('Failed to delete leads', { description: result.error });
    }
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="text-sm text-slate-500">{row.original.interest}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        return (
          <span className="font-mono text-sm text-slate-600">
            {formatPhoneNumber(row.original.phone)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={statusVariantMap[status]}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lastContacted',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Last Contacted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <span className="text-sm text-slate-600">
            {formatDate(row.original.lastContacted)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            <CallButton 
              lead={row.original} 
              onStatusChange={handleStatusChange}
            />
            <DeleteButton
              lead={row.original}
              onDelete={handleDeleteLead}
            />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Delete All Leads?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              This will permanently delete all {leads.length} leads from your pipeline. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteAllConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete All Leads'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Button */}
      {leads.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteAllConfirm(true)}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-slate-50/50">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No leads found. Upload a CSV to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {table.getRowModel().rows.length} of {leads.length} leads
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
