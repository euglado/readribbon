import { randomBytes } from "node:crypto";
import type { Report } from "./reading.js";

export interface Binding {
  user: string;
  guild: string;
  channel: string;
}
export interface Draft extends Binding {
  report: Report;
  expires: number;
  message: string | null;
}

export class Drafts {
  readonly entries = new Map<string, Draft>();
  readonly users = new Map<string, number>();
  readonly channels = new Map<string, number>();
  constructor(readonly now: () => number = Date.now) {}

  sweep(): void {
    const now = this.now();
    for (const [id, draft] of this.entries) if (draft.expires <= now) this.entries.delete(id);
    for (const map of [this.users, this.channels]) {
      for (const [id, expires] of map) if (expires <= now) map.delete(id);
    }
  }

  reserveUser(binding: Binding): boolean {
    this.sweep();
    const key = `${binding.guild}:${binding.user}`;
    if (this.users.has(key) || this.users.size >= 500) return false;
    this.users.set(key, this.now() + 5000);
    return true;
  }

  create(binding: Binding, report: Report): string | null {
    this.sweep();
    if (this.entries.size >= 100) return null;
    const id = randomBytes(12).toString("hex");
    this.entries.set(id, { ...binding, report, expires: this.now() + 300000, message: null });
    return id;
  }

  bind(id: string, message: string): void {
    const draft = this.entries.get(id);
    if (draft) draft.message = message;
  }

  take(id: string, binding: Binding, message: string, share: boolean): Draft | null {
    this.sweep();
    const draft = this.entries.get(id);
    if (
      !draft ||
      draft.user !== binding.user ||
      draft.guild !== binding.guild ||
      draft.channel !== binding.channel ||
      draft.message !== message
    )
      return null;
    if (share) {
      const key = `${binding.guild}:${binding.channel}`;
      if (this.channels.has(key) || this.channels.size >= 500) return null;
      this.channels.set(key, this.now() + 60000);
    }
    // Consume before any asynchronous work; retries cannot publish twice.
    this.entries.delete(id);
    return draft;
  }
}
