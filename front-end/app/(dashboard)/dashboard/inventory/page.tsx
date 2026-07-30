import Link from "next/link"
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authenticatedRequest } from "@/lib/auth"

type Item = {
  _id: string
  sku: string
  name: string
  category: string
  unit: string
  quantity: number
  reorderLevel: number
  location?: string
  status: string
}
type Person = { firstName: string; lastName: string }
type Transaction = {
  _id: string
  transactionNumber: string
  item: Pick<Item, "sku" | "name" | "unit">
  type: string
  quantity: number
  balanceAfter: number
  reason: string
  issuedTo?: Person
  performedBy?: Person
  createdAt: string
}

export default async function InventoryPage() {
  let items: Item[] = [],
    transactions: Transaction[] = [],
    error = ""
  try {
    const data = await Promise.all([
      authenticatedRequest<{ items: Item[] }>("/inventory/items?limit=100"),
      authenticatedRequest<{ items: Transaction[] }>("/inventory/transactions?limit=20"),
    ])
    items = data[0].data.items
    transactions = data[1].data.items
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Inventory data unavailable"
  }
  const lowStock = items.filter((item) => item.quantity <= item.reorderLevel)
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Resource operations</p>
          <h1 className="mt-1 text-3xl font-bold">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stock levels, reorder alerts, and an auditable movement ledger.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/dashboard/inventory/items/new" />}>
            <Plus />
            New item
          </Button>
          <Button render={<Link href="/dashboard/inventory/move" />}>
            <Boxes />
            Move stock
          </Button>
        </div>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={<Boxes />} value={items.length} label="Inventory items" />
        <Metric icon={<AlertTriangle />} value={lowStock.length} label="Low-stock alerts" />
        <Metric
          icon={<ArrowDownToLine />}
          value={items.reduce((sum, item) => sum + item.quantity, 0)}
          label="Units on hand"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Stock register</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU / item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>On hand</TableHead>
                <TableHead>Reorder at</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const low = item.quantity <= item.reorderLevel
                return (
                  <TableRow key={item._id}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.location ?? "—"}</TableCell>
                    <TableCell className="font-semibold">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      {item.reorderLevel} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={low ? "destructive" : "secondary"}>
                        {low ? "Reorder" : item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent stock movements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Reason / recipient</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell className="font-mono text-xs">{tx.transactionNumber}</TableCell>
                  <TableCell>
                    <p className="font-medium">{tx.item?.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.item?.sku}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.quantity < 0 ? "outline" : "secondary"}>
                      {tx.quantity > 0 ? <ArrowDownToLine /> : <ArrowUpFromLine />}
                      {tx.quantity > 0 ? "+" : ""}
                      {tx.quantity} {tx.item?.unit}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.balanceAfter}</TableCell>
                  <TableCell>
                    <p>{tx.reason}</p>
                    {tx.issuedTo && (
                      <p className="text-xs text-muted-foreground">
                        To {tx.issuedTo.firstName} {tx.issuedTo.lastName}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-primary [&_svg]:size-5">{icon}</div>
        <p className="mt-4 text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
