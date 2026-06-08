import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import { Function } from '../../functions/entities/function.entity';

export default class FunctionSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(Function);

    const functionsToInsert = [
      {
        codigo: 'ADM',
        nome_funcao: 'Administrador',
      },
      {
        codigo: 'PROF',
        nome_funcao: 'Professor',
      },
      {
        codigo: 'COORD',
        nome_funcao: 'Coordenador',
      },
      {
        codigo: 'RH',
        nome_funcao: 'Recursos Humanos',
      },
      {
        codigo: 'DIR',
        nome_funcao: 'Diretor',
      },
    ];

    // Verifica e insere apenas se não existir
    for (const functionData of functionsToInsert) {
      const existing = await repository.findOne({
        where: { codigo: functionData.codigo },
      });

      if (!existing) {
        await repository.save(functionData);
      }
    }
  }
}

