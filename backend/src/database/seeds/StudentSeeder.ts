import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import { Student } from '../../students/entities/student.entity';

export default class StudentSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(Student);

    const students = [
      {
        codigo: 'AL001',
        nome: 'Carlos Eduardo Pereira',
        email: 'carlos.pereira@email.com',
        telefone: '(11) 94567-1234',
        cpf: '321.654.987-01',
        cep: '01310-100',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Bela Vista',
        pais: 'Brasil',
        numero_endereco: '45',
        complemento: 'Apto 3',
        responsavel: 'João Pereira',
        observacao: 'Aluno dedicado e pontual',
      },
      {
        codigo: 'AL002',
        nome: 'Ana Lucia Ferreira',
        email: 'ana.ferreira@email.com',
        telefone: '(11) 93456-7890',
        cpf: '456.789.123-02',
        cep: '04552-000',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Vila Olímpia',
        pais: 'Brasil',
        numero_endereco: '120',
        complemento: null,
        responsavel: 'Maria Santos',
        observacao: null,
      },
      {
        codigo: 'AL003',
        nome: 'Bruno Henrique Costa',
        email: 'bruno.costa@email.com',
        telefone: '(21) 98765-4321',
        cpf: '654.321.098-03',
        cep: '20040-020',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        bairro: 'Centro',
        pais: 'Brasil',
        numero_endereco: '78',
        complemento: 'Bloco B',
        responsavel: 'Paula Costa',
        observacao: 'Em acompanhamento terapêutico',
      },
      {
        codigo: 'AL004',
        nome: 'Fernanda Lima Souza',
        email: 'fernanda.souza@email.com',
        telefone: '(31) 97654-3210',
        cpf: '789.012.345-04',
        cep: '30130-010',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        bairro: 'Savassi',
        pais: 'Brasil',
        numero_endereco: '200',
        complemento: null,
        responsavel: 'Roberto Souza',
        observacao: 'Boa comunicação e integração social',
      },
      {
        codigo: 'AL005',
        nome: 'Lucas Martins Rocha',
        email: 'lucas.rocha@email.com',
        telefone: '(11) 96543-2109',
        cpf: '012.345.678-05',
        cep: '01153-000',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Barra Funda',
        pais: 'Brasil',
        numero_endereco: '310',
        complemento: 'Casa',
        responsavel: 'Sandra Rocha',
        observacao: null,
      },
    ];

    // Verifica e insere apenas se não existir
    for (const studentData of students) {
      const existing = await repository.findOne({
        where: { codigo: studentData.codigo },
      });

      if (!existing) {
        await repository.save(studentData);
      }
    }

  }
}

