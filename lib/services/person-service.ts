import { Person } from "@/types";
import { apiFetch } from "@/lib/services/api-client";

interface PersonPayload {
  id: string;
  name: string;
  createdAt: string;
  status: Person["status"];
  materials: [];
}

export const listPersons = async (): Promise<Person[]> => {
  const payload = await apiFetch<{ persons: PersonPayload[] }>("/api/persons");
  return payload.persons.map((person) => ({
    ...person,
    materials: [],
  }));
};

export const createPerson = async (name: string): Promise<Person> => {
  const payload = await apiFetch<{ person: PersonPayload }>("/api/persons", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return { ...payload.person, materials: [] };
};

export const removePerson = async (id: string): Promise<void> => {
  await apiFetch<{ ok: boolean }>(`/api/persons/${id}`, {
    method: "DELETE",
  });
};

export const updatePerson = async (
  id: string,
  data: Partial<Pick<Person, "name" | "status">>
): Promise<Person> => {
  const payload = await apiFetch<{ person: PersonPayload }>(`/api/persons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return { ...payload.person, materials: [] };
};
