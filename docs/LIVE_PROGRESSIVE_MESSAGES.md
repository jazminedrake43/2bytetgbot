# Live Progressive Messages

A live progressive message is a Telegram message that updates in real-time as tasks progress. It displays a list of items with status icons and an animated spinner for the currently running task.

## Overview

The system consists of two classes:

- **`Message2bytePool`** — a message wrapper that tracks its own text and supports in-place updates
- **`Message2ByteLiveProgressive`** — a live task list that updates the pool message with formatted items and animated progress bars

---

## Quick Start

### Inside a Section

```typescript
async runMyTasks() {
  // Step 1: create a pool message (updates existing message in callback context)
  const msgPool = this.createUpdatePoolMessage("Starting...");
  await msgPool.send();

  // Step 2: create a live progressive instance from the pool
  const msgProgressive = msgPool.liveProgressive();
  await msgProgressive.setBaseMessage("Task progress:").send();

  // Step 3: run tasks and update items
  for (let i = 1; i <= 3; i++) {
    await msgProgressive.appendItem(i, `Task ${i}`).send();
    await msgProgressive.sleepProgressBar(2000).send(); // animated spinner for 2s
    await msgProgressive.setItemStatusCompleted(i).send();
  }

  // Step 4: stop progress bar and finalize message
  await msgProgressive.stopSleepProgress();
  await msgPool.append("\n\nAll done!").send();
}
```

### Without a Section (standalone)

```typescript
import { Message2Byte } from "@2byte/tgbot-framework";

// Manually answer callback query first
await this.ctx.answerCbQuery();

const msgPool = Message2Byte.init(this.ctx).createUpdatePoolMessage("Starting...");
await msgPool.send();

const msgProgressive = msgPool.liveProgressive();
// ... same API as above
```

---

## Message2bytePool API

Obtained via `this.createUpdatePoolMessage(message)` or `this.createPoolMessage(message)` inside a Section.

| Method | Description |
|---|---|
| `message(text)` | Replace current message text |
| `update(text)` | Same as `message()`, always forces an edit |
| `append(text)` | Append text to current message |
| `prepend(text)` | Prepend text to current message |
| `liveProgressive()` | Create a `Message2ByteLiveProgressive` bound to this pool |
| `inlineKeyboard(kb)` | Attach an inline keyboard |
| `markdown()` | Enable Markdown parse mode |
| `html()` | Enable HTML parse mode |
| `send()` | Send or edit the message, returns the Telegram entity |
| `sendReturnThis()` | Same as `send()`, but returns `this` for chaining |
| `sleepProgressBar(waitText, ms)` | Show a simple spinner in the message for `ms` milliseconds |

### `createPoolMessage` vs `createUpdatePoolMessage`

- **`createPoolMessage`** — sends a new message in non-callback context; edits in callback context
- **`createUpdatePoolMessage`** — always edits the current message (used for live updates)

---

## Message2ByteLiveProgressive API

Obtained via `msgPool.liveProgressive()`.

### Setting the base message

```typescript
msgProgressive.setBaseMessage("Processing tasks:");
```

The base message appears above the item list.

---

### Managing items

#### `appendItem(id, text, status?)`
Adds a new item with a given ID. Default status is `pending`.

```typescript
await msgProgressive.appendItem(1, "Downloading data").send();
await msgProgressive.appendItem(2, "Processing", "active").send();
```

#### `changeItem(id, text, status?)`
Replaces the text of an existing item. Optionally updates status.

```typescript
await msgProgressive.changeItem(1, "Download complete", "completed").send();
```

#### `removeItem(id)`
Removes an item from the list.

```typescript
await msgProgressive.removeItem(3).send();
```

---

### Item status

Each item has a status that controls the icon displayed next to it.

| Status | Icon | Description |
|---|---|---|
| `pending` | ⏳ | Waiting to start |
| `active` | 🔄 | Currently running |
| `completed` | ✅ | Finished successfully |
| `error` | ❌ | Failed |

#### `setItemStatus(id, status)`
```typescript
await msgProgressive.setItemStatus(1, "active").send();
```

#### `setItemStatusCompleted(id)`
Shorthand for `setItemStatus(id, "completed")`.
```typescript
await msgProgressive.setItemStatusCompleted(1).send();
```

#### `setItemStatusError(id, errorText?)`
Marks item as error. Optionally appends an error description to the item text.
```typescript
await msgProgressive.setItemStatusError(2, "Connection refused").send();
```

---

### Item captions

A caption is displayed below an item in italic (when using Markdown or HTML parse mode).

```typescript
await msgProgressive.setItemCaption(1, "Details about this step").send();
await msgProgressive.changeItemCaption(1, "Updated detail").send();
```

---

### Progress bar (spinner)

The spinner animates the Braille character set next to the active item: ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏

#### `sleepProgressBar(duration?, itemId?)`
Starts the spinner animation. The spinner is attached to the **last item** if `itemId` is not specified.

- `duration` (ms) — how long to run the spinner before auto-stopping. If omitted, runs indefinitely.
- `itemId` — attach spinner to a specific item instead of the last one.

> **Note:** Always call `.send()` right after `sleepProgressBar()` to trigger the first animation frame.

```typescript
await msgProgressive.appendItem(1, "Uploading file").send();
await msgProgressive.sleepProgressBar(3000).send(); // spins for 3 seconds
await msgProgressive.setItemStatusCompleted(1).send();
```

#### `stopSleepProgress()`
Stops an indefinitely running spinner and marks the active item as completed.

```typescript
await msgProgressive.stopSleepProgress();
```

> Use `stopSleepProgress()` when you started the spinner without a duration and want to stop it manually.

---

### Utility methods

| Method | Description |
|---|---|
| `clear()` | Remove all items |
| `getItems()` | Returns all items sorted by ID |
| `getItem(id)` | Returns a single item by ID |
| `send()` | Rebuild and send the current message state |

---

## Complete Example

```typescript
async processItems() {
  const msgPool = this.createUpdatePoolMessage("Initializing...");
  await msgPool.send();

  const msg = msgPool.liveProgressive();
  await msg.setBaseMessage("Processing 3 items:").send();

  for (let i = 1; i <= 3; i++) {
    // Add item in pending state
    await msg.appendItem(i, `Item ${i}`).send();

    // Show spinner while working
    await msg.sleepProgressBar(2000).send();

    // Optionally update item text
    await msg.changeItem(i, `Item ${i} processed`).send();

    // Mark completed
    await msg.setItemStatusCompleted(i).send();
  }

  await msg.stopSleepProgress();
  await msgPool.append("\n\n✅ All items processed!").send();
}
```

**Resulting message format:**

```
Processing 3 items:

✅ Item 1 processed
✅ Item 2 processed
🔄 Item 3 ⠸

All items processed!
```

---

## Notes

- Items are always rendered sorted by their numeric `id`, regardless of insertion order.
- Calling `.send()` on `Message2ByteLiveProgressive` rebuilds the full message from the current state of all items and delegates to the underlying `Message2bytePool.send()`.
- The spinner updates every **200ms** via an internal `setInterval`. High-frequency `.send()` calls from business logic and from the spinner run concurrently — Telegram's flood limits apply, but the framework sends without throwing.
- Parse mode (`markdown()` / `html()`) must be set on the **pool** before creating the progressive instance, as the formatting is applied there.
