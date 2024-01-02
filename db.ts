import { Database } from 'bun:sqlite';

class SingletonDatabase {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!this.instance) {
      this.instance = new Database('mydb.sqlite');
    }
    return this.instance;
  }
}

export default SingletonDatabase;
