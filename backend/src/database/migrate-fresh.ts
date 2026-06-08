import { dataSource } from './data-source';
import MainSeeder from './seeds/MainSeeder';
import { config } from 'dotenv';

config();

const withSeed = process.argv.includes('--seed');

(async () => {
  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('Conexão estabelecida.');

    console.log('Dropando todas as tabelas...');
    await dataSource.synchronize(true);
    console.log('Tabelas recriadas com sucesso.');

    if (withSeed) {
      console.log('Executando seeders...');
      await new MainSeeder().run(dataSource, null);
      console.log('Seeders executados com sucesso.');
    }

    await dataSource.destroy();
    console.log('Pronto.');
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
})();
