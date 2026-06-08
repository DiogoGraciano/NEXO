import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Student } from '../../students/entities/student.entity';
import { Company } from '../../companies/entities/company.entity';

export default class EventSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(Event);
    const studentRepository = dataSource.getRepository(Student);
    const companyRepository = dataSource.getRepository(Company);

    const students = await studentRepository.find({ take: 3 });
    const companies = await companyRepository.find({ take: 2 });

    const alunoId = students[0]?.id ?? null;
    const aluno2Id = students[1]?.id ?? null;
    const empresaId = companies[0]?.id ?? null;
    const empresa2Id = companies[1]?.id ?? null;

    const events = [
      {
        titulo: 'Visita de acompanhamento — Carlos Pereira',
        descricao: 'Visita mensal de acompanhamento do aluno na empresa parceira.',
        data_inicio: new Date('2025-08-10T09:00:00'),
        data_fim: new Date('2025-08-10T10:30:00'),
        tipo: 'visita_aluno' as const,
        local: 'Tech Solutions Ltda — Sala de Reuniões',
        observacao: 'Aluno demonstrou boa adaptação',
        aluno_id: alunoId,
        empresa_id: empresaId,
      },
      {
        titulo: 'Reunião com RH — Inovação Digital',
        descricao: 'Reunião para alinhamento sobre vagas disponíveis para o próximo semestre.',
        data_inicio: new Date('2025-08-20T14:00:00'),
        data_fim: new Date('2025-08-20T15:00:00'),
        tipo: 'visita_empresa' as const,
        local: 'Inovação Digital S.A. — Sede RJ',
        observacao: null,
        aluno_id: null,
        empresa_id: empresa2Id,
      },
      {
        titulo: 'Visita conjunta — Ana e empresa',
        descricao: 'Visita de apresentação da aluna ao novo local de trabalho.',
        data_inicio: new Date('2025-09-05T10:00:00'),
        data_fim: new Date('2025-09-05T12:00:00'),
        tipo: 'visita_ambos' as const,
        local: 'Inovação Digital S.A. — Andar 3',
        observacao: 'Primeira visita formal, acompanhada por coordenadora',
        aluno_id: aluno2Id,
        empresa_id: empresa2Id,
      },
      {
        titulo: 'Palestra: Mercado de Trabalho e Inclusão',
        descricao: 'Palestra aberta para todos os alunos da instituição sobre inclusão no mercado de trabalho.',
        data_inicio: new Date('2025-09-15T09:00:00'),
        data_fim: new Date('2025-09-15T11:30:00'),
        tipo: 'generico' as const,
        local: 'Auditório da Instituição',
        observacao: 'Confirmada presença de representantes de 3 empresas parceiras',
        aluno_id: null,
        empresa_id: null,
      },
      {
        titulo: 'Avaliação semestral — Bruno Costa',
        descricao: 'Avaliação de desempenho semestral na empresa.',
        data_inicio: new Date('2025-10-02T13:00:00'),
        data_fim: new Date('2025-10-02T14:00:00'),
        tipo: 'visita_aluno' as const,
        local: 'Tech Solutions Ltda',
        observacao: null,
        aluno_id: students[2]?.id ?? alunoId,
        empresa_id: empresaId,
      },
    ];

    for (const eventData of events) {
      const existing = await repository.findOne({
        where: { titulo: eventData.titulo },
      });

      if (!existing) {
        await repository.save(eventData);
      }
    }
  }
}
