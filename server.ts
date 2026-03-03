import 'dotenv/config';
import path from 'path';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API Routes

// Reset and upload participants
app.post('/api/participants', (req: Request, res: Response) => {
  const { names } = req.body;
  if (!names || !Array.isArray(names) || names.length < 2) {
    res.status(400).json({ error: "Please provide at least 2 names." });
    return;
  }

  try {
    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM participants').run();
      const insert = db.prepare('INSERT INTO participants (name) VALUES (?)');
      for (const name of names as string[]) {
        insert.run(name.trim());
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ success: true, count: names.length });
  } catch (error: any) {
    console.error("Error uploading participants:", error);
    res
      .status(500)
      .json({ error: "Failed to upload participants. Names must be unique." });
  }
});

// Draw a recipient
app.post('/api/draw', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    // 1. Find the user (fuzzy match)
    const users = db
      .prepare("SELECT * FROM participants WHERE name LIKE ?")
      .all(`%${name}%`);

    if (users.length === 0) {
      res.status(404).json({ error: "Name not found in the list." });
      return;
    }
    if (users.length > 1) {
      res
        .status(400)
        .json({
          error: "Multiple matches found. Please enter your full name.",
        });
      return;
    }

    const user = users[0] as any;

    // 2. Check if already drawn
    if (user.recipient_id) {
      const recipient = db
        .prepare("SELECT name FROM participants WHERE id = ?")
        .get(user.recipient_id) as any;
      res.json({ recipient: recipient.name, alreadyDrawn: true });
      return;
    }

    // 3. Find available recipients
    // Must not be self
    // Must not be already assigned to someone else
    const availableRecipients = db
      .prepare(
        `
      SELECT * FROM participants 
      WHERE id != ? 
      AND id NOT IN (SELECT recipient_id FROM participants WHERE recipient_id IS NOT NULL)
    `,
      )
      .all(user.id) as any[];

    if (availableRecipients.length === 0) {
      // Deadlock case: Last person left, but only self is available (which is filtered out above).
      // Or simply no one left (which shouldn't happen if N > 1 and logic is sound, but with random draws it can happen).
      // If A, B, C.
      // A draws B.
      // B draws A.
      // C is left. C cannot draw C.

      // Fix: Swap with someone.
      // Find a random person who has already drawn (e.g., A).
      // A drew B.
      // We assign B to C (current user).
      // We assign A to C (current user) -> Wait.
      // A drew B.
      // C needs a match.
      // Assign C -> B.
      // Reassign A -> C.
      // Result: A->C, C->B, B->A. Valid cycle.

      // Let's implement this swap logic.
      const alreadyMatched = db
        .prepare("SELECT * FROM participants WHERE recipient_id IS NOT NULL")
        .all() as any[];
      if (alreadyMatched.length === 0) {
        res
          .status(500)
          .json({
            error:
              "Critical error: No available recipients and no previous matches to swap with.",
          });
        return;
      }

      const randomSwapper =
        alreadyMatched[Math.floor(Math.random() * alreadyMatched.length)];
      const originalRecipientId = randomSwapper.recipient_id;

      // Assign current user to the swapper's original recipient
      // Assign swapper to current user

      db.exec('BEGIN');
      try {
        db.prepare('UPDATE participants SET recipient_id = ? WHERE id = ?').run(originalRecipientId, user.id);
        db.prepare('UPDATE participants SET recipient_id = ? WHERE id = ?').run(user.id, randomSwapper.id);
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      const newRecipient = db
        .prepare("SELECT name FROM participants WHERE id = ?")
        .get(originalRecipientId) as any;
      res.json({ recipient: newRecipient.name });
      return;
    } else {
      // Normal draw
      const randomRecipient =
        availableRecipients[
          Math.floor(Math.random() * availableRecipients.length)
        ];

      db.prepare("UPDATE participants SET recipient_id = ? WHERE id = ?").run(
        randomRecipient.id,
        user.id,
      );

      res.json({ recipient: randomRecipient.name });
      return;
    }
  } catch (error: any) {
    console.error("Error drawing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Get all matches
app.get('/api/admin/matches', (_req: Request, res: Response) => {
  try {
    const matches = db
      .prepare(
        `
      SELECT 
        p1.name as giver, 
        p2.name as receiver 
      FROM participants p1
      LEFT JOIN participants p2 ON p1.recipient_id = p2.id
    `,
      )
      .all();
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// Vite Middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve('dist', 'index.html'));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
