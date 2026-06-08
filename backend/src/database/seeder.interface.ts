import { DataSource } from 'typeorm';

export type SeederFactoryManager = unknown;

export interface Seeder {
  run(dataSource: DataSource, factoryManager: any): Promise<void>;
}
