import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import { Referral } from '../../referrals/entities/referral.entity';
import { Student } from '../../students/entities/student.entity';
import { Company } from '../../companies/entities/company.entity';

export default class ReferralSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(Referral);
    const studentRepository = dataSource.getRepository(Student);
    const companyRepository = dataSource.getRepository(Company);

    const students = await studentRepository.find({ take: 5 });
    const companies = await companyRepository.find({ take: 3 });

    if (students.length === 0 || companies.length === 0) {
      console.log('Nenhum aluno ou empresa encontrado. Execute os seeders anteriores primeiro.');
      return;
    }

    const referrals = [
      {
        aluno_id: students[0].id,
        empresa_id: companies[0].id,
        funcao: 'Auxiliar Administrativo',
        data_admissao: new Date('2025-03-01'),
        contato_rh: 'rh@techsolutions.com',
        data_desligamento: null,
        observacao: 'Em adaptação, bom desempenho inicial',
      },
      {
        aluno_id: students[1].id,
        empresa_id: companies[1].id,
        funcao: 'Auxiliar de Estoque',
        data_admissao: new Date('2025-01-15'),
        contato_rh: 'pessoas@inovacaodigital.com',
        data_desligamento: new Date('2025-06-30'),
        observacao: 'Desligamento por término de contrato',
      },
      {
        aluno_id: students[2].id,
        empresa_id: companies[0].id,
        funcao: 'Copeiro',
        data_admissao: new Date('2025-05-01'),
        contato_rh: 'rh@techsolutions.com',
        data_desligamento: null,
        observacao: null,
      },
      {
        aluno_id: students[3].id,
        empresa_id: companies[2 % companies.length].id,
        funcao: 'Auxiliar de Limpeza',
        data_admissao: new Date('2024-11-10'),
        contato_rh: 'contato@desenvolvimentoagil.com',
        data_desligamento: new Date('2025-04-10'),
        observacao: 'Saída voluntária — retornou aos estudos',
      },
      {
        aluno_id: students[4 % students.length].id,
        empresa_id: companies[1 % companies.length].id,
        funcao: 'Atendente',
        data_admissao: new Date('2025-07-01'),
        contato_rh: 'rh@inovacaodigital.com',
        data_desligamento: null,
        observacao: 'Primeiro emprego, acompanhamento semanal',
      },
    ];

    for (const referralData of referrals) {
      const existing = await repository.findOne({
        where: { aluno_id: referralData.aluno_id, empresa_id: referralData.empresa_id },
      });

      if (!existing) {
        await repository.save(referralData);
      }
    }
  }
}
