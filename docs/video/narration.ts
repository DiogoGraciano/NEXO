/**
 * Roteiro de narração do vídeo demo do NEXO — fonte ÚNICA de texto.
 *
 * Consumido por:
 *  - generate-tts.mjs  -> gera 1 mp3 por cena (edge-tts) + durations.json
 *  - record.spec.ts     -> usa a ordem das seções/cenas para pacing da gravação
 *  - build.mjs          -> usa títulos das seções para capítulos e nomes de clipe
 *
 * Para ajustar o ritmo: edite o `text` da cena e rode `bun run video:tts`
 * novamente (só as cenas alteradas são regeneradas).
 */

export interface Scene {
  /** id único e estável (= nome do arquivo de áudio: audio/<id>.mp3) */
  id: string;
  /** texto narrado em PT-BR (frases curtas) */
  text: string;
}

export interface Section {
  /** chave estável da seção (= nome do webm/clipe: raw/<NN-key>.webm) */
  key: string;
  /** título legível usado nos capítulos do MP4 */
  title: string;
  scenes: Scene[];
}

export const SECTIONS: Section[] = [
  {
    key: '01-login',
    title: 'Introdução e Acesso',
    scenes: [
      {
        id: '01-intro',
        text: 'Bem-vindo ao NEXO, o sistema de acompanhamento acadêmico e profissional. Neste vídeo vamos percorrer todas as telas do sistema e mostrar como cada funcionalidade funciona.',
      },
      {
        id: '01-login-form',
        text: 'Tudo começa pela tela de acesso. O usuário informa o e-mail e a senha e clica em Entrar para acessar o sistema.',
      },
      {
        id: '01-login-erro',
        text: 'Se a senha estiver incorreta, o sistema exibe uma mensagem de erro, sem revelar detalhes, por segurança.',
      },
      {
        id: '01-forgot',
        text: 'Esqueceu a senha? O link Esqueceu sua senha leva ao fluxo de recuperação, onde basta informar o e-mail para receber as instruções por mensagem.',
      },
      {
        id: '01-reset',
        text: 'A partir do link recebido, o usuário define uma nova senha com segurança e volta a acessar o sistema normalmente.',
      },
    ],
  },
  {
    key: '02-dashboard',
    title: 'Painel Principal',
    scenes: [
      {
        id: '02-dash-kpis',
        text: 'Após o login chegamos ao Painel principal. No topo, seis indicadores resumem a operação: total de alunos, alunos colocados, empresas parceiras, encaminhamentos ativos, respostas recebidas e eventos próximos.',
      },
      {
        id: '02-dash-graficos',
        text: 'Logo abaixo, gráficos interativos mostram a taxa de colocação, a evolução nos últimos doze meses, as empresas que mais recebem alunos e a distribuição por estado.',
      },
      {
        id: '02-dash-atividade',
        text: 'O painel ainda destaca a atividade recente e alerta sobre encaminhamentos próximos do desligamento, ajudando a equipe a agir a tempo.',
      },
    ],
  },
  {
    key: '03-alunos',
    title: 'Cadastro de Alunos',
    scenes: [
      {
        id: '03-alunos-lista',
        text: 'No menu Cadastros abrimos a tela de Alunos. Aqui ficam todos os estudantes acompanhados, com busca rápida por nome.',
      },
      {
        id: '03-alunos-novo',
        text: 'Para cadastrar um novo aluno, abrimos o formulário e preenchemos os dados pessoais e o código. O endereço é preenchido automaticamente a partir do CEP.',
      },
      {
        id: '03-alunos-salvar',
        text: 'Ao salvar, o aluno passa a aparecer na lista. Seus dados podem ser editados a qualquer momento.',
      },
      {
        id: '03-alunos-encaminhamento',
        text: 'Cada aluno tem encaminhamentos, que são os vínculos com empresas. Registramos a empresa, a função, a data de admissão e o contato do RH.',
      },
      {
        id: '03-alunos-relatorio',
        text: 'Também é possível gerar relatórios em PDF da lista de alunos e excluir registros quando necessário.',
      },
    ],
  },
  {
    key: '04-empresas',
    title: 'Cadastro de Empresas',
    scenes: [
      {
        id: '04-emp-lista',
        text: 'A tela de Empresas reúne todas as parceiras que recebem os alunos, com o número de vínculos de cada uma.',
      },
      {
        id: '04-emp-novo',
        text: 'Ao cadastrar uma empresa, o sistema valida o CNPJ automaticamente e preenche o endereço pelo CEP, evitando erros de digitação.',
      },
      {
        id: '04-emp-relatorio',
        text: 'Os relatórios permitem exportar a lista completa de empresas ou agrupada por estado.',
      },
    ],
  },
  {
    key: '05-funcionarios',
    title: 'Cadastro de Funcionários',
    scenes: [
      {
        id: '05-func-lista',
        text: 'Em Funcionários gerenciamos a equipe interna do sistema, com filtro por função.',
      },
      {
        id: '05-func-novo',
        text: 'Cada funcionário recebe uma função, como Administrador, Coordenador ou RH, e uma senha de acesso. A função define o que ele pode ver e fazer no sistema.',
      },
      {
        id: '05-func-relatorio',
        text: 'Os relatórios listam a equipe completa ou agrupada por função.',
      },
    ],
  },
  {
    key: '06-questionarios',
    title: 'Construtor de Questionários',
    scenes: [
      {
        id: '06-quest-lista',
        text: 'Os Questionários são formulários personalizados. O construtor visual permite montar o formulário campo a campo.',
      },
      {
        id: '06-quest-campos',
        text: 'Adicionamos campos de texto, seleção, múltipla escolha e caixas de marcação, definindo o rótulo de cada um e se é obrigatório.',
      },
      {
        id: '06-quest-preview',
        text: 'Para usuários avançados há também o modo JSON, além de uma pré-visualização do formulário antes de salvar.',
      },
    ],
  },
  {
    key: '07-responder',
    title: 'Responder Questionários',
    scenes: [
      {
        id: '07-resp-lista',
        text: 'Na área Responder Questionários, o usuário vê os formulários disponíveis e escolhe um para responder.',
      },
      {
        id: '07-resp-form',
        text: 'O formulário é montado dinamicamente a partir da definição. Os campos obrigatórios são validados antes do envio.',
      },
      {
        id: '07-resp-sucesso',
        text: 'Ao enviar, uma confirmação mostra que a resposta foi registrada com sucesso.',
      },
    ],
  },
  {
    key: '08-respostas',
    title: 'Respostas dos Questionários',
    scenes: [
      {
        id: '08-ans-seletor',
        text: 'Em Acompanhamentos, a tela de Respostas reúne tudo o que foi respondido. Selecionamos um questionário para ver os resultados.',
      },
      {
        id: '08-ans-stats',
        text: 'As estatísticas mostram o total de respostas, as mais recentes e a taxa de conclusão.',
      },
      {
        id: '08-ans-detalhe',
        text: 'Podemos abrir cada resposta e ver as perguntas e respostas em detalhe.',
      },
    ],
  },
  {
    key: '09-agenda',
    title: 'Agenda e Eventos',
    scenes: [
      {
        id: '09-ag-mes',
        text: 'A Agenda traz um calendário completo de visitas e eventos.',
      },
      {
        id: '09-ag-novo',
        text: 'Criamos um evento informando título, datas, tipo e os vínculos com aluno e empresa. As cores diferenciam visitas ao aluno, à empresa ou a ambos.',
      },
      {
        id: '09-ag-editar',
        text: 'Os eventos podem ser editados ou removidos diretamente no calendário.',
      },
    ],
  },
  {
    key: '10-smtp',
    title: 'Configuração de E-mail (SMTP)',
    scenes: [
      {
        id: '10-smtp-form',
        text: 'Em Configurações definimos o servidor de e-mail, o SMTP, usado para os envios do sistema, como a recuperação de senha.',
      },
      {
        id: '10-smtp-teste',
        text: 'O botão Testar Conexão valida as credenciais antes de salvar, evitando erros de configuração.',
      },
    ],
  },
  {
    key: '11-outro',
    title: 'Encerramento',
    scenes: [
      {
        id: '11-outro-resumo',
        text: 'E assim percorremos todas as telas do NEXO: do cadastro de alunos e empresas aos questionários, à agenda e aos relatórios, tudo integrado em um só lugar.',
      },
      {
        id: '11-outro-logout',
        text: 'Para encerrar a sessão, basta usar o botão Sair na barra lateral. Obrigado por assistir.',
      },
    ],
  },
];

/** Lista achatada de todas as cenas, na ordem do vídeo. */
export const SCENES: Scene[] = SECTIONS.flatMap((s) => s.scenes);
