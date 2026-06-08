import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import { Question } from '../../questions/entities/question.entity';
import { Questionnaire } from '../../questionnaires/entities/questionnaire.entity';

export default class QuestionSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(Question);
    const questionnaireRepository = dataSource.getRepository(Questionnaire);

    // Buscar questionários existentes
    const questionnaires = await questionnaireRepository.find();

    if (questionnaires.length === 0) {
      console.log('Nenhum questionário encontrado. Execute o QuestionnaireSeeder primeiro.');
      return;
    }

    const questions: Array<{
      questionario_id: number;
      tipo_pergunta: 'resposta_curta' | 'checkbox' | 'combobox';
      texto_pergunta: string;
    }> = [];

    for (const questionnaire of questionnaires) {
      // Criar algumas perguntas para cada questionário
      questions.push(
        {
          questionario_id: questionnaire.id,
          tipo_pergunta: 'resposta_curta',
          texto_pergunta: 'Como você avalia seu desempenho geral?',
        },
        {
          questionario_id: questionnaire.id,
          tipo_pergunta: 'checkbox',
          texto_pergunta: 'Quais habilidades você desenvolveu? (marque todas que se aplicam)',
        },
        {
          questionario_id: questionnaire.id,
          tipo_pergunta: 'combobox',
          texto_pergunta: 'Qual seu nível de satisfação?',
        },
      );
    }

    await repository.insert(questions);
  }
}

