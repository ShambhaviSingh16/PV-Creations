import {DatabaseSync} from 'node:sqlite';
// Local adapter implements the D1 methods used by the service. Production uses the real D1 binding.
export function sqliteAdapter(filename=':memory:'){
 const connection=new DatabaseSync(filename);connection.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
 const wrap=(sql,params=[])=>({bind(...args){return wrap(sql,args);},async all(){return {results:connection.prepare(sql).all(...params)};},async first(){return connection.prepare(sql).get(...params)||null;},async run(){const r=connection.prepare(sql).run(...params);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};},_sql:sql,_params:params});
 return {prepare:wrap,async batch(statements){connection.exec('BEGIN IMMEDIATE');try{const results=[];for(const s of statements)results.push(await s.run());connection.exec('COMMIT');return results;}catch(e){connection.exec('ROLLBACK');throw e;}},exec:sql=>connection.exec(sql),close:()=>connection.close()};
}
