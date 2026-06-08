import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import { Questionnaire } from '../../questionnaires/entities/questionnaire.entity';

// Avaliação Usuário em período de Experiência - Instituto de Educação Especial Diomício Freitas
const avaliacaoExperienciaFields = [
  // Perguntas 1-46: Radio com opções Sim / Não / Maioria das vezes / Raras vezes
  ...[
    '1 - Atende as regras.',
    '2 - Socializa com o grupo.',
    '3 - Isola-se do grupo.',
    '4 - Possui tolerância a frustração.',
    '5 - Respeita colega e professores.',
    '6 - Faz relatos fantasiosos.',
    '7 - Concentra-se nas atividades.',
    '8 - Tem iniciativa.',
    '9 - Sonolência durante as atividades em sala de aula.',
    '10 - Alterações intensas de humor.',
    '11 - Indica oscilação repentina de humor.',
    '12 - Irrita-se com facilidade.',
    '13 - Ansiedade.',
    '14 - Escuta quando seus colegas falam.',
    '15 - Escuta e segue orientação dos professores.',
    '16 - Mantém-se em sala de aula.',
    '17 - Desloca-se muito na sala.',
    '18 - Fala demasiadamente.',
    '19 - É pontual.',
    '20 - É assíduo.',
    '21 - Demonstra desejo de trabalhar.',
    '22 - Apropria-se indevidamente daquilo que não é seu.',
    '23 - Indica hábito de banho diário.',
    '24 - Indica hábito de escovação e qualidade na escovação.',
    '25 - Indica cuidado com a aparência e limpeza do uniforme.',
    '26 - Indica autonomia quanto a estes hábitos (23, 24, 25).',
    '27 - Indica falta do uso de medicação com oscilações de comportamento.',
    '28 - Tem meio articulado de conseguir receitas e aquisições das medicações.',
    '29 - Traz seus materiais organizados.',
    '30 - Usa transporte coletivo.',
    '31 - Tem iniciativa diante das atividades propostas.',
    '32 - Localiza-se no espaço da Instituição.',
    '33 - Situa-se nas trocas de sala e atividades.',
    '34 - Interage par a par.',
    '35 - Interage em grupo.',
    '36 - Cria conflitos e intrigas.',
    '37 - Promove a harmonia.',
    '38 - Faz intrigas entre colegas x professores.',
    '39 - Demonstra interesse em participar das atividades extraclasses.',
    '40 - Você percebe que existe interação/participação da família em apoio ao usuário na Instituição.',
    '41 - Você percebe superproteção por parte da família quanto a autonomia do usuário.',
    '42 - Usuário traz relatos negativos da família (de forma geral).',
    '43 - Usuário traz relatos positivos da família (de forma geral).',
    '44 - Você percebe incentivo quanto a busca de autonomia para o usuário por parte da família.',
    '45 - Você percebe incentivo quanto a inserção do usuário no mercado de trabalho por parte da família.',
    '46 - Traz os documentos enviados pela Instituição assinado.',
  ].map((label, index) => ({
    id: `pergunta_${index + 1}`,
    type: 'radio' as const,
    label,
    required: true,
    options: ['Sim', 'Não', 'Maioria das vezes', 'Raras vezes'],
  })),
  // Pergunta 47 - Textarea
  {
    id: 'pergunta_47',
    type: 'textarea' as const,
    label: '47 - Em sua opinião o usuário tem perfil para esta instituição? Por quê?',
    required: true,
    placeholder: 'Descreva sua opinião...',
  },
  // Campo extra referente ao asterisco (*) da pergunta 12
  {
    id: 'pergunta_12_complemento',
    type: 'textarea' as const,
    label: '* Em que situações demonstra irritações?',
    required: false,
    placeholder: 'Descreva as situações...',
  },
  // Observações gerais
  {
    id: 'observacoes',
    type: 'textarea' as const,
    label: 'Observações',
    required: false,
    placeholder: 'Observações adicionais...',
  },
];

export default class QuestionnaireSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(Questionnaire);

    const questionnaireData = {
      nome: 'Avaliação Usuário em Período de Experiência',
      questionario_json: JSON.stringify(avaliacaoExperienciaFields, null, 2),
    };

    const existing = await repository.findOne({
      where: { nome: questionnaireData.nome },
    });

    if (!existing) {
      await repository.save(questionnaireData);
    }
  }
}
