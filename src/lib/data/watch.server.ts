"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getWatchAlerts(includeResolved = false) {
  return db.watchAlert.findMany({
    where: includeResolved ? {} : { resolved: false },
    orderBy: [
      { severity: "asc" }, // high sorts first alphabetically
      { createdAt: "desc" },
    ],
  });
}

export async function addWatchAlert(data: {
  animalName: string;
  issue: string;
  treatment: string;
  assignedTo: string;
  severity: string;
}) {
  const animal = await db.animal.findFirst({
    where: { name: data.animalName },
  });

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

  await db.watchAlert.create({
    data: {
      animalId: animal?.id ?? "",
      animalName: data.animalName,
      date: dateStr,
      issue: data.issue,
      treatment: data.treatment,
      assignedTo: data.assignedTo,
      severity: data.severity,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/watch");
}

export async function resolveWatchAlert(id: string) {
  await db.watchAlert.update({
    where: { id },
    data: { resolved: true },
  });

  revalidatePath("/app");
  revalidatePath("/app/watch");
}

export async function deleteWatchAlert(id: string) {
  await db.watchAlert.delete({ where: { id } });

  revalidatePath("/app");
  revalidatePath("/app/watch");
}
