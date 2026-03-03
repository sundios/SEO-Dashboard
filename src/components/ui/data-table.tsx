"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  FilterFn,
} from "@tanstack/react-table"
import { ChevronDown, Filter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Custom filter function for numeric comparisons
const numericFilter: FilterFn<any> = (row, columnId, filterValue: any) => {
  const value = row.getValue(columnId)
  const { operator, value: filterVal } = filterValue
  
  if (value === null || value === undefined) return false
  
  const numValue = typeof value === 'number' ? value : parseFloat(String(value))
  const numFilter = parseFloat(String(filterVal))
  
  if (isNaN(numValue) || isNaN(numFilter)) return false
  
  switch (operator) {
    case 'equals':
      return numValue === numFilter
    case 'not-equals':
      return numValue !== numFilter
    case 'greater-than':
      return numValue > numFilter
    case 'less-than':
      return numValue < numFilter
    case 'greater-than-equals':
      return numValue >= numFilter
    case 'less-than-equals':
      return numValue <= numFilter
    default:
      return true
  }
}

// Custom filter function for text content
const textFilter: FilterFn<any> = (row, columnId, filterValue: any) => {
  const value = row.getValue(columnId)
  const { operator, value: filterVal } = filterValue
  
  if (!value || !filterVal) return true
  
  const textValue = String(value).toLowerCase()
  const textFilter = String(filterVal).toLowerCase()
  
  switch (operator) {
    case 'contains':
      return textValue.includes(textFilter)
    case 'not-contains':
      return !textValue.includes(textFilter)
    case 'exact':
      return textValue === textFilter
    case 'starts-with':
      return textValue.startsWith(textFilter)
    case 'ends-with':
      return textValue.endsWith(textFilter)
    default:
      return true
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  showColumnToggle?: boolean
  showPagination?: boolean
  showSearch?: boolean
  showAdvancedFilters?: boolean
  pageSize?: number
  className?: string
}

interface FilterConfig {
  column: string
  operator: string
  value: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  showColumnToggle = true,
  showPagination = true,
  showSearch = true,
  showAdvancedFilters = true,
  pageSize = 20,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [advancedFilters, setAdvancedFilters] = React.useState<FilterConfig[]>([])
  const [showFilters, setShowFilters] = React.useState(false)

  // Apply advanced filters to column filters
  React.useEffect(() => {
    const newColumnFilters: ColumnFiltersState = []
    
    advancedFilters.forEach(filter => {
      if (filter.value) {
        newColumnFilters.push({
          id: filter.column,
          value: {
            operator: filter.operator,
            value: filter.value
          }
        })
      }
    })
    
    setColumnFilters(newColumnFilters)
  }, [advancedFilters])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    filterFns: {
      numericFilter,
      textFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const addFilter = () => {
    setAdvancedFilters([...advancedFilters, { column: '', operator: 'contains', value: '' }])
  }

  const removeFilter = (index: number) => {
    setAdvancedFilters(advancedFilters.filter((_, i) => i !== index))
  }

  const updateFilter = (index: number, field: keyof FilterConfig, value: string) => {
    const newFilters = [...advancedFilters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setAdvancedFilters(newFilters)
  }

  const clearAllFilters = () => {
    setAdvancedFilters([])
  }

  const getColumnOptions = () => {
    return columns.map(col => ({
      value: (col as any).accessorKey as string,
      label: typeof col.header === 'string' ? col.header : (col as any).accessorKey as string
    }))
  }

  const getOperatorOptions = (columnType: string) => {
    if (columnType === 'query' || columnType === 'page') {
      return [
        { value: 'contains', label: 'Contains' },
        { value: 'not-contains', label: 'Not Contains' },
        { value: 'exact', label: 'Exact Match' },
        { value: 'starts-with', label: 'Starts With' },
        { value: 'ends-with', label: 'Ends With' },
      ]
    } else {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'not-equals', label: 'Not Equals' },
        { value: 'greater-than', label: 'Greater Than' },
        { value: 'less-than', label: 'Less Than' },
        { value: 'greater-than-equals', label: 'Greater Than or Equal' },
        { value: 'less-than-equals', label: 'Less Than or Equal' },
      ]
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center py-4 gap-2">
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {showAdvancedFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {advancedFilters.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                {advancedFilters.length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && showAdvancedFilters && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Advanced Filters</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                disabled={advancedFilters.length === 0}
              >
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addFilter}
              >
                Add Filter
              </Button>
            </div>
          </div>
          
          {advancedFilters.length === 0 && (
            <p className="text-sm text-gray-500 mb-4">
              No filters applied. Click "Add Filter" to start filtering your data.
            </p>
          )}
          
          <div className="space-y-3">
            {advancedFilters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={filter.column}
                  onValueChange={(value) => updateFilter(index, 'column', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Column" />
                  </SelectTrigger>
                  <SelectContent>
                    {getColumnOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={filter.operator}
                  onValueChange={(value) => updateFilter(index, 'operator', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOperatorOptions(filter.column).map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Value"
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className="flex-1"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
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
      )}
    </div>
  )
} 