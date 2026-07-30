import Link from "next/link"
import { BedDouble, Bus, Hotel, MapPinned, Plus } from "lucide-react"
import { EndAllocation } from "@/components/allocation-actions"
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

type Hostel = {
  _id: string
  name: string
  code: string
  gender: string
  address: string
  status: string
}
type Room = {
  _id: string
  roomNumber: string
  floor?: number
  capacity: number
  occupiedBeds: number
  monthlyFeeMinor: number
  hostel: { name: string; code: string }
}
type Person = { firstName: string; lastName: string; email?: string }
type HostelAllocation = {
  _id: string
  student: { studentId: string; user: Person }
  hostel: { name: string }
  room: { roomNumber: string }
  bedNumber: string
  startsAt: string
  endsAt?: string
  status: string
}
type Vehicle = {
  _id: string
  registrationNumber: string
  name: string
  type: string
  capacity: number
  driverName?: string
  status: string
}
type Route = {
  _id: string
  name: string
  code: string
  stops: { name: string; pickupTime: string }[]
  monthlyFeeMinor: number
  vehicle: Vehicle
}
type TransportAllocation = {
  _id: string
  user: Person
  route: { name: string; code: string }
  vehicle: { registrationNumber: string; name: string }
  pickupStop: string
  startsAt: string
  endsAt?: string
  status: string
}

export default async function FacilitiesPage() {
  let hostels: Hostel[] = [],
    rooms: Room[] = [],
    hostelAllocations: HostelAllocation[] = [],
    vehicles: Vehicle[] = [],
    routes: Route[] = [],
    transportAllocations: TransportAllocation[] = [],
    error = ""
  try {
    const data = await Promise.all([
      authenticatedRequest<{ hostels: Hostel[] }>("/facilities/hostels"),
      authenticatedRequest<{ rooms: Room[] }>("/facilities/rooms"),
      authenticatedRequest<{ allocations: HostelAllocation[] }>(
        "/facilities/hostel-allocations?status=active",
      ),
      authenticatedRequest<{ vehicles: Vehicle[] }>("/facilities/vehicles"),
      authenticatedRequest<{ routes: Route[] }>("/facilities/transport-routes"),
      authenticatedRequest<{ allocations: TransportAllocation[] }>(
        "/facilities/transport-allocations?status=active",
      ),
    ])
    hostels = data[0].data.hostels
    rooms = data[1].data.rooms
    hostelAllocations = data[2].data.allocations
    vehicles = data[3].data.vehicles
    routes = data[4].data.routes
    transportAllocations = data[5].data.allocations
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Facility data unavailable"
  }
  const beds = rooms.reduce((sum, room) => sum + room.capacity, 0)
  const occupied = rooms.reduce((sum, room) => sum + room.occupiedBeds, 0)
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Campus operations</p>
          <h1 className="mt-1 text-3xl font-bold">Facilities & transport</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accommodation capacity, active allocations, fleet, and routes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/dashboard/facilities/hostels/new" />}>
            <Plus />
            Hostel
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/facilities/rooms/new" />}>
            <Plus />
            Room
          </Button>
          <Button render={<Link href="/dashboard/facilities/allocate-hostel" />}>
            <BedDouble />
            Allocate bed
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/facilities/vehicles/new" />}>
            <Plus />
            Vehicle
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/facilities/routes/new" />}>
            <Plus />
            Route
          </Button>
          <Button render={<Link href="/dashboard/facilities/allocate-transport" />}>
            <Bus />
            Allocate transport
          </Button>
        </div>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Hotel />} value={hostels.length} label="Hostels" />
        <Metric icon={<BedDouble />} value={`${occupied}/${beds}`} label="Occupied beds" />
        <Metric icon={<Bus />} value={vehicles.length} label="Fleet vehicles" />
        <Metric icon={<MapPinned />} value={routes.length} label="Transport routes" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hostels & room capacity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostel / room</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Monthly fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room._id}>
                    <TableCell>
                      <p className="font-medium">
                        {room.hostel?.name ?? "Hostel"} · {room.roomNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">{room.hostel?.code}</p>
                    </TableCell>
                    <TableCell>{room.floor ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={room.occupiedBeds >= room.capacity ? "destructive" : "secondary"}
                      >
                        {room.occupiedBeds}/{room.capacity}
                      </Badge>
                    </TableCell>
                    <TableCell>৳{(room.monthlyFeeMinor / 100).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active hostel allocations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostelAllocations.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <p className="font-medium">
                        {item.student?.user?.firstName} {item.student?.user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.student?.studentId}</p>
                    </TableCell>
                    <TableCell>
                      {item.hostel?.name} · {item.room?.roomNumber} · Bed {item.bedNumber}
                    </TableCell>
                    <TableCell>{new Date(item.startsAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <EndAllocation id={item._id} type="hostel" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fleet & routes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.map((route) => (
              <div
                key={route._id}
                className="flex items-start justify-between rounded-xl border p-4"
              >
                <div>
                  <p className="font-semibold">
                    {route.name}{" "}
                    <span className="font-mono text-xs text-muted-foreground">({route.code})</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {route.vehicle?.name} · {route.vehicle?.registrationNumber} ·{" "}
                    {route.stops.length} stops
                  </p>
                </div>
                <Badge variant="outline">৳{(route.monthlyFeeMinor / 100).toLocaleString()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active transport allocations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Route / pickup</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transportAllocations.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      {item.user?.firstName} {item.user?.lastName}
                    </TableCell>
                    <TableCell>
                      <p>{item.route?.name}</p>
                      <p className="text-xs text-muted-foreground">{item.pickupStop}</p>
                    </TableCell>
                    <TableCell>{item.vehicle?.registrationNumber}</TableCell>
                    <TableCell>
                      <EndAllocation id={item._id} type="transport" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
}) {
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
