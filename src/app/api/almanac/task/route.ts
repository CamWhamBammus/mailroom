import { NextResponse } from "next/server";
import { createAlmanacTask } from "@/lib/almanac";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { title, notes, dueDate } = body ?? {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  try {
    const task = await createAlmanacTask({
      title,
      notes: typeof notes === "string" ? notes : undefined,
      dueDate: typeof dueDate === "string" && dueDate ? dueDate : null,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't create task" },
      { status: 502 }
    );
  }
}
