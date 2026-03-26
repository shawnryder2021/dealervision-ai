import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";
import type { Vehicle } from "@/lib/types";

export async function getVehicles(dealershipId: string): Promise<Vehicle[]> {
  if (isDemoMode()) {
    return useAppStore.getState().vehicles;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function addVehicle(
  vehicle: Omit<Vehicle, "id" | "created_at" | "updated_at">
): Promise<Vehicle> {
  if (isDemoMode()) {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `demo-vehicle-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { vehicles, setVehicles } = useAppStore.getState();
    setVehicles([newVehicle, ...vehicles]);
    return newVehicle;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .insert(vehicle)
    .select()
    .single();
  if (error) throw error;
  return data as Vehicle;
}

export async function updateVehicle(
  id: string,
  updates: Partial<Vehicle>
): Promise<Vehicle> {
  if (isDemoMode()) {
    const { vehicles, setVehicles } = useAppStore.getState();
    const updated = vehicles.map((v) =>
      v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v
    );
    setVehicles(updated);
    return updated.find((v) => v.id === id)!;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  if (isDemoMode()) {
    const { vehicles, setVehicles } = useAppStore.getState();
    setVehicles(vehicles.filter((v) => v.id !== id));
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}
