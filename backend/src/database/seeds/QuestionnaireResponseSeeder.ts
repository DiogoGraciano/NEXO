import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import { QuestionnaireResponse } from '../../questionnaire-responses/entities/questionnaire-response.entity';
import { Questionnaire } from '../../questionnaires/entities/questionnaire.entity';
import { Student } from '../../students/entities/student.entity';

const buildResponses = (answers: Record<string, string>) => JSON.stringify(answers);

export default class QuestionnaireResponseSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(QuestionnaireResponse);
    const questionnaireRepository = dataSource.getRepository(Questionnaire);
    const studentRepository = dataSource.getRepository(Student);

    const questionnaires = await questionnaireRepository.find({ take: 1 });
    const students = await studentRepository.find({ take: 3 });

    if (questionnaires.length === 0 || students.length === 0) {
      console.log('Nenhum questionário ou aluno encontrado. Execute os seeders anteriores primeiro.');
      return;
    }

    const questionnaire = questionnaires[0];

    // Gera respostas para as 46 perguntas radio + campos livres
    const radioOptions = ['Sim', 'Não', 'Maioria das vezes', 'Raras vezes'];
    const makeRadioAnswers = (seed: number) => {
      const result: Record<string, string> = {};
      for (let i = 1; i <= 46; i++) {
        result[`pergunta_${i}`] = radioOptions[(seed + i) % radioOptions.length];
      }
      return result;
    };

    const responses = [
      {
        questionario_id: questionnaire.id,
        aluno_id: students[0].id,
        data_envio: new Date('2025-04-10T10:30:00'),
        respostas_json: buildResponses({
          ...makeRadioAnswers(0),
          pergunta_47: 'Sim. O aluno demonstra boa adaptação e interesse contínuo nas atividades.',
          pergunta_12_complemento: 'Reage com irritação em situações de mudança inesperada de rotina.',
          observacoes: 'Aluno apresentou melhora significativa no segundo mês.',
        }),
      },
      {
        questionario_id: questionnaire.id,
        aluno_id: students[1 % students.length].id,
        data_envio: new Date('2025-05-20T14:00:00'),
        respostas_json: buildResponses({
          ...makeRadioAnswers(1),
          pergunta_47: 'Sim, com ressalvas. Precisa de mais apoio na socialização em grupo.',
          pergunta_12_complemento: '',
          observacoes: '',
        }),
      },
      {
        questionario_id: questionnaire.id,
        aluno_id: students[2 % students.length].id,
        data_envio: new Date('2025-06-15T09:00:00'),
        respostas_json: buildResponses({
          ...makeRadioAnswers(2),
          pergunta_47: 'Não no momento. O aluno ainda está desenvolvendo habilidades essenciais.',
          pergunta_12_complemento: 'Demonstra irritação quando contrariado por colegas.',
          observacoes: 'Recomenda-se reavaliação em 60 dias.',
        }),
      },
    ];

    for (const responseData of responses) {
      const existing = await repository.findOne({
        where: {
          questionario_id: responseData.questionario_id,
          aluno_id: responseData.aluno_id,
        },
      });

      if (!existing) {
        await repository.save(responseData);
      }
    }
  }
}
