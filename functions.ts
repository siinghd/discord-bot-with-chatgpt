import { Database } from 'bun:sqlite';
import SingletonDatabase from './db';

const db: Database = SingletonDatabase.getInstance();

// Function to save a message to the database
export const saveMessage = (
  userId: string,
  content: string,
  role: 'system' | 'user' | 'assistant'
): void => {
  const timestamp = Date.now();

  db.query(
    'INSERT INTO interactions (userId, content, timestamp, role) VALUES (?, ?, ?, ?)'
  ).run(userId, content, timestamp, role);

  db.query(
    'DELETE FROM interactions WHERE userId = ? AND timestamp NOT IN (SELECT timestamp FROM interactions WHERE userId = ? ORDER BY timestamp DESC LIMIT 5)'
  ).run(userId, userId);
};
interface MessageRow {
  content: string;
  role: 'system' | 'user' | 'assistant';
}

// Function to retrieve the last messages for a user
export const getLastMessages = (userId: string): MessageRow[] => {
  try {
    const query = db.query(
      'SELECT content, role FROM interactions WHERE userId = ? ORDER BY timestamp DESC LIMIT 5'
    );
    const rows = query.all(userId) as MessageRow[];
    return rows.map((row) => ({
      content: row.content,
      role: row.role as 'system' | 'user' | 'assistant',
    }));
  } catch (err) {
    console.error('Error retrieving messages:', err);
    return [];
  }
};
