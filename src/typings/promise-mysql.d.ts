declare module "promise-mysql" {
    export function createConnection(options: {
        host: string,
        user: string,
        password: string,
        database: string
    }): Promise<MysqlConnection>;

    export interface MysqlConnection {
        query(query: string, placeholders?: any[]): Promise<Object[]>;
    }
}