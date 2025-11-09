import type { Database } from "bun:sqlite";
import { MakeManualPaginateButtonsParams, ModelPaginateParams, PaginateResult } from "..";
import { Section } from "..";

export abstract class Model {
  protected static db: Database;
  protected static tableName: string;

  static setDatabase(database: Database) {
    this.db = database;
  }

  protected static query(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  protected static queryOne(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params);
  }

  protected static execute(sql: string, params: any[] = []): void {
    const stmt = this.db.prepare(sql);
    stmt.run(...params);
  }

  protected static transaction<T>(callback: () => T): T {
    return this.db.transaction(callback)();
  }

  public static async paginate(paginateParams: ModelPaginateParams): Promise<PaginateResult> {
    const { page, route, routeParams, limit, whereSql, whereParams } = paginateParams;
    const offset = (page - 1) * limit;
    const sql = `SELECT * FROM ${this.tableName} ${whereSql} LIMIT ${offset}, ${limit}`;

    const result = await this.query(sql, whereParams);
    const queryTotal = await this.queryOne(`SELECT COUNT(*) as count FROM ${this.tableName} ${whereSql}`, whereParams);
    const total = queryTotal ? queryTotal.count : 0;
    const totalPages = Math.ceil(total / limit);
    const hasPreviousPage = page > 1;
    const hasNextPage = page < totalPages;
    
    return {
      items: result,
      paginateButtons: Section.makeManualPaginateButtons({
        callbackDataAction: route,
        paramsQuery: routeParams || {},
        currentPage: page,
        totalRecords: total,
        perPage: limit,
      } as MakeManualPaginateButtonsParams),
      total,
      totalPages,
      hasPreviousPage,
      hasNextPage,
      currentPage: page,
    } as PaginateResult;
  }

  static getConnection(): Database {
    if (db) {
      return db;
    }
    throw new Error("Database connection is not set.");
  }
}
