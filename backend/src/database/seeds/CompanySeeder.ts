import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export default class CompanySeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(Company);

    const companiesToInsert = [
      {
        razao_social: 'Tech Solutions Ltda',
        cnpj: '12.345.678/0001-90',
        cep: '01310-100',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Bela Vista',
        pais: 'Brasil',
        numero_endereco: '100',
        complemento: 'Sala 10',
      },
      {
        razao_social: 'Inovação Digital S.A.',
        cnpj: '98.765.432/0001-10',
        cep: '20040-020',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        bairro: 'Centro',
        pais: 'Brasil',
        numero_endereco: '200',
        complemento: null,
      },
      {
        razao_social: 'Desenvolvimento Ágil ME',
        cnpj: '11.222.333/0001-44',
        cep: '30130-010',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        bairro: 'Centro',
        pais: 'Brasil',
        numero_endereco: '300',
        complemento: 'Andar 5',
      },
    ];

    // Verifica e insere apenas se não existir
    for (const companyData of companiesToInsert) {
      const existing = await repository.findOne({
        where: { cnpj: companyData.cnpj },
      });

      if (!existing) {
        await repository.save(companyData);
      }
    }

  }
}

