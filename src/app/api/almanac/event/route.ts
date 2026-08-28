import { NextResponse } from "next/server";
import { createAlmanacEvent } from "@/lib/almanac";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { title, notes, date, startTime, endTime } = body ?? {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  try {
    const event = await createAlmanacEvent({
      title,
      notes: typeof notes === "string" ? notes : undefined,
      date,
      startTime: typeof startTime === "string" && startTime ? startTime : undefined,
      endTime: typeof endTime === "string" && endTime ? endTime : undefined,
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't create event" },
      { status: 502 }
    );
  }
}
