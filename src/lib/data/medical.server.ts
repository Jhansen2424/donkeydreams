"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getMedicalEntries() {
  return db.medicalEntry.findMany({
    orderBy: { date: "desc" },
  });
}

export async function getMedicalEntriesForAnimal(animalName: string) {
  return db.medicalEntry.findMany({
    where: { animalName },
    orderBy: { date: "desc" },
  });
}

export async function addMedicalEntry(data: {
  animalName: string;
  type: string;
  title: string;
  date: string;
  description: string;
  urgent: boolean;
}) {
  const animal = await db.animal.findFirst({
    where: { name: data.animalName },
  });

  await db.medicalEntry.create({
    data: {
      animalId: animal?.id ?? "",
      animalName: data.animalName,
      type: data.type,
      title: data.title,
      date: data.date,
      description: data.description,
      urgent: data.urgent,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/medical");
}

export async function deleteMedicalEntry(id: string) {
  await db.medicalEntry.delete({ where: { id } });

  revalidatePath("/app/medical");
}
