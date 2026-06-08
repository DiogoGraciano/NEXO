import { Seeder, SeederFactoryManager } from '../seeder.interface';
import { DataSource } from 'typeorm';
import FunctionSeeder from './FunctionSeeder';
import CompanySeeder from './CompanySeeder';
import EmployeeSeeder from './EmployeeSeeder';
import StudentSeeder from './StudentSeeder';
import QuestionnaireSeeder from './QuestionnaireSeeder';
import QuestionSeeder from './QuestionSeeder';
import SmtpConfigSeeder from './SmtpConfigSeeder';
import ReferralSeeder from './ReferralSeeder';
import EventSeeder from './EventSeeder';
import QuestionnaireResponseSeeder from './QuestionnaireResponseSeeder';

export default class MainSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    console.log('Iniciando seeders...');

    console.log('1. Executando FunctionSeeder...');
    await new FunctionSeeder().run(dataSource, factoryManager);

    console.log('2. Executando CompanySeeder...');
    await new CompanySeeder().run(dataSource, factoryManager);

    console.log('3. Executando EmployeeSeeder...');
    await new EmployeeSeeder().run(dataSource, factoryManager);

    console.log('4. Executando StudentSeeder...');
    await new StudentSeeder().run(dataSource, factoryManager);

    console.log('5. Executando QuestionnaireSeeder...');
    await new QuestionnaireSeeder().run(dataSource, factoryManager);

    console.log('6. Executando QuestionSeeder...');
    await new QuestionSeeder().run(dataSource, factoryManager);

    console.log('7. Executando SmtpConfigSeeder...');
    await new SmtpConfigSeeder().run(dataSource, factoryManager);

    console.log('8. Executando ReferralSeeder...');
    await new ReferralSeeder().run(dataSource, factoryManager);

    console.log('9. Executando EventSeeder...');
    await new EventSeeder().run(dataSource, factoryManager);

    console.log('10. Executando QuestionnaireResponseSeeder...');
    await new QuestionnaireResponseSeeder().run(dataSource, factoryManager);

    console.log('Todos os seeders foram executados com sucesso!');
  }
}

