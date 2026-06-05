require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

const categories = [
  { emri: 'Letërsi',            pershkrimi: 'Romane dhe tregime artistike nga autorë të njohur botërorë.',         kategoria_prind_id: null },
  { emri: 'Shkencë-Fantastikë', pershkrimi: 'Botë të ardhshme, teknologji dhe eksplorime kozmike.',               kategoria_prind_id: null },
  { emri: 'Mister & Thriller',  pershkrimi: 'Krime, hetues dhe histori të tensionuara.',                           kategoria_prind_id: null },
  { emri: 'Vetëpërmirësim',     pershkrimi: 'Libra motivues dhe udhëzues për jetë më të mirë.',                   kategoria_prind_id: null },
  { emri: 'Filozofi & Ide',     pershkrimi: 'Mendime, ide dhe vështrime filozofike mbi botën.',                    kategoria_prind_id: null },
];

const authors = [
  {
    emri: 'George', mbiemri: 'Orwell',
    email: 'george.orwell@authors.com', shtati: 'Britani e Madhe',
    website: 'https://www.george-orwell.org',
    biografia: 'Eric Arthur Blair (1903–1950), i njohur si George Orwell, ishte romancier, eseist dhe kritik shoqëror britanik. Veprat e tij shfaqin kritika të forta ndaj totalitarizmit.',
    foto_url: 'https://ui-avatars.com/api/?name=George+Orwell&background=4F46E5&color=fff&size=256&bold=true',
  },
  {
    emri: 'J.K.', mbiemri: 'Rowling',
    email: 'jk.rowling@authors.com', shtati: 'Britani e Madhe',
    website: 'https://www.jkrowling.com',
    biografia: 'Joanne Rowling (lindur 1965) është autore britanike, e njohur kryesisht për serinë e romaneve Harry Potter, e cila u bë fenomeni letrar i brezit të saj.',
    foto_url: 'https://ui-avatars.com/api/?name=JK+Rowling&background=7C3AED&color=fff&size=256&bold=true',
  },
  {
    emri: 'Gabriel', mbiemri: 'Márquez',
    email: 'garcia.marquez@authors.com', shtati: 'Kolumbi',
    website: 'https://www.themodernnovel.org/americas/other-americas/colombia/garcia-marquez/',
    biografia: 'Gabriel José García Márquez (1927–2014) ishte romancier kolumbian dhe fitues i Çmimit Nobel. Njihet si themelues i realizmit magjik në letërsinë latine.',
    foto_url: 'https://ui-avatars.com/api/?name=Garcia+Marquez&background=DC2626&color=fff&size=256&bold=true',
  },
  {
    emri: 'Agatha', mbiemri: 'Christie',
    email: 'agatha.christie@authors.com', shtati: 'Britani e Madhe',
    website: 'https://www.agathachristie.com',
    biografia: 'Dame Agatha Christie (1890–1976) ishte autore britanike e njohur si "Mbretëresha e Krimeve". Librat e saj janë ndër më të lexuarit në histori me mbi 2 miliardë kopje të shitura.',
    foto_url: 'https://ui-avatars.com/api/?name=Agatha+Christie&background=059669&color=fff&size=256&bold=true',
  },
  {
    emri: 'Stephen', mbiemri: 'King',
    email: 'stephen.king@authors.com', shtati: 'Shtetet e Bashkuara',
    website: 'https://www.stephenking.com',
    biografia: 'Stephen Edwin King (lindur 1947) është romancier amerikan i njohur si "Mbreti i Tmerrit". Ka shkruar mbi 60 romane dhe 200 tregime të shkurtra.',
    foto_url: 'https://ui-avatars.com/api/?name=Stephen+King&background=B91C1C&color=fff&size=256&bold=true',
  },
  {
    emri: 'Paulo', mbiemri: 'Coelho',
    email: 'paulo.coelho@authors.com', shtati: 'Brazil',
    website: 'https://www.paulocoelho.com',
    biografia: 'Paulo Coelho de Souza (lindur 1947) është novelist brazilian. Alkimisti i tij është ndër librat me shitje më të lartë në histori me mbi 150 milionë kopje.',
    foto_url: 'https://ui-avatars.com/api/?name=Paulo+Coelho&background=D97706&color=fff&size=256&bold=true',
  },
  {
    emri: 'Frank', mbiemri: 'Herbert',
    email: 'frank.herbert@authors.com', shtati: 'Shtetet e Bashkuara',
    website: 'https://www.dunenovels.com',
    biografia: 'Franklin Patrick Herbert Jr. (1920–1986) ishte romancier amerikan, i njohur kryesisht për epopejën Dune — një nga veprat më të shitura të shkencë-fantastikës.',
    foto_url: 'https://ui-avatars.com/api/?name=Frank+Herbert&background=1D4ED8&color=fff&size=256&bold=true',
  },
  {
    emri: 'Aldous', mbiemri: 'Huxley',
    email: 'aldous.huxley@authors.com', shtati: 'Britani e Madhe',
    website: 'https://www.huxley.net',
    biografia: 'Aldous Leonard Huxley (1894–1963) ishte romancier dhe eseist britanik, i njohur për romane distopike dhe vepra filozofike mbi perceptimin dhe ndërgjegjën.',
    foto_url: 'https://ui-avatars.com/api/?name=Aldous+Huxley&background=0891B2&color=fff&size=256&bold=true',
  },
];

const getBooks = (C, A) => [
  {
    titulli: '1984',
    autori_id: A['Orwell'], isbn: '9780451524935', kategoria_id: C['Shkencë-Fantastikë'],
    botuesi: 'Secker & Warburg', viti_botimit: 1949, cmimi: 14.99, sasia_stok: 45, formati: 'Softcover',
    pershkrimi: 'Romani distopik i Orwell paraqet një shoqëri totalitare ku Partia kontrollon çdo aspekt të jetës. Winston Smith fillon të vë në dyshim sistemin dhe kërkon lirinë.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
  },
  {
    titulli: 'Animal Farm',
    autori_id: A['Orwell'], isbn: '9780451526342', kategoria_id: C['Letërsi'],
    botuesi: 'Secker & Warburg', viti_botimit: 1945, cmimi: 12.99, sasia_stok: 62, formati: 'Softcover',
    pershkrimi: 'Satira alegorike ku kafshët e një ferme revoltohen kundër pronarit të tyre. Paraqet një kritikë të mprehtë të totalitarizmit dhe korrupsionit të pushtetit.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg',
  },
  {
    titulli: 'Harry Potter dhe Guri i Filozofëve',
    autori_id: A['Rowling'], isbn: '9780439708180', kategoria_id: C['Letërsi'],
    botuesi: 'Bloomsbury', viti_botimit: 1997, cmimi: 19.99, sasia_stok: 78, formati: 'Hardcover',
    pershkrimi: 'Harry zbulon se është magjistar dhe fillon studimet në Hogwarts, ku ndesh me forcat e errësirës. Libri i parë i serisë që ndryshoi letërsinë për fëmijë.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg',
  },
  {
    titulli: 'Harry Potter dhe Dhoma e Sekreteve',
    autori_id: A['Rowling'], isbn: '9780439064873', kategoria_id: C['Letërsi'],
    botuesi: 'Bloomsbury', viti_botimit: 1998, cmimi: 19.99, sasia_stok: 55, formati: 'Hardcover',
    pershkrimi: 'Viti i dytë në Hogwarts sjell sulme misterioze ndaj studentëve. Harry duhet të zbulojë sekretin pas Dhomës së Sekreteve para se të jetë tepër vonë.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780439064873-L.jpg',
  },
  {
    titulli: 'Njëqind Vjet Vetmi',
    autori_id: A['Márquez'], isbn: '9780060883287', kategoria_id: C['Letërsi'],
    botuesi: 'Harper & Row', viti_botimit: 1967, cmimi: 16.99, sasia_stok: 34, formati: 'Softcover',
    pershkrimi: 'Kryevepra e García Márquez ndjek shtatë breza të familjes Buendía në qytetin imagjinar Macondo. Vepra themelore e realizmit magjik.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780060883287-L.jpg',
  },
  {
    titulli: 'Dashuria në Kohë të Kolerës',
    autori_id: A['Márquez'], isbn: '9780307389732', kategoria_id: C['Letërsi'],
    botuesi: 'Oveja Negra', viti_botimit: 1985, cmimi: 15.99, sasia_stok: 28, formati: 'Softcover',
    pershkrimi: 'Historia e dashurisë midis Florentino Ariza dhe Fermina Daza gjatë pesëdhjetë vjetëve. Një ode e mahnitshme ndaj dashurisë, kohës dhe jetës.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780307389732-L.jpg',
  },
  {
    titulli: 'Vrasja në Orient Express',
    autori_id: A['Christie'], isbn: '9780062693662', kategoria_id: C['Mister & Thriller'],
    botuesi: 'Collins Crime Club', viti_botimit: 1934, cmimi: 13.99, sasia_stok: 50, formati: 'Softcover',
    pershkrimi: 'Hercule Poirot ndeshet me një vrasje misterioze në bordin e trenit Orient Express. Çdo udhëtar është i dyshimtë dhe Poirot duhet të zbulojë të vërtetën.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780062693662-L.jpg',
  },
  {
    titulli: 'Dhe Nuk Mbeti Asnjë',
    autori_id: A['Christie'], isbn: '9780062073488', kategoria_id: C['Mister & Thriller'],
    botuesi: 'Collins Crime Club', viti_botimit: 1939, cmimi: 12.99, sasia_stok: 40, formati: 'Softcover',
    pershkrimi: 'Dhjetë të huaj ftohen në një ishull të izoluar dhe fillojnë të vriten njëri pas tjetrit. Romani më i shitur i mistere i të gjitha kohërave.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780062073488-L.jpg',
  },
  {
    titulli: 'The Shining',
    autori_id: A['King'], isbn: '9780307743657', kategoria_id: C['Mister & Thriller'],
    botuesi: 'Doubleday', viti_botimit: 1977, cmimi: 15.99, sasia_stok: 35, formati: 'Softcover',
    pershkrimi: 'Jack Torrance merr punën e kujdestarit të hotelit Overlook gjatë dimrit. Izolimi dhe forcat e errëta të hotelit fillojnë të shkatërrojnë mendjen e tij.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780307743657-L.jpg',
  },
  {
    titulli: 'It',
    autori_id: A['King'], isbn: '9780450411844', kategoria_id: C['Mister & Thriller'],
    botuesi: 'Viking Press', viti_botimit: 1986, cmimi: 19.99, sasia_stok: 22, formati: 'Hardcover',
    pershkrimi: 'Shtatë fëmijë në Derry, Maine, takohen me entitetin e tmerrshëm Pennywise. Tridhjetë vjet më vonë, duhet të kthehen për ta mposhtur përfundimisht.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780450411844-L.jpg',
  },
  {
    titulli: 'Alkimisti',
    autori_id: A['Coelho'], isbn: '9780062315007', kategoria_id: C['Vetëpërmirësim'],
    botuesi: 'HarperOne', viti_botimit: 1988, cmimi: 13.99, sasia_stok: 85, formati: 'Softcover',
    pershkrimi: 'Santiago, një bari i ri, ndjek ëndrrën e tij për të gjetur thesarin pranë piramidave. Udhëtimi bëhet mësim i madh mbi fatin personal dhe gëzimin e jetës.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg',
  },
  {
    titulli: 'Njëmbëdhjetë Minuta',
    autori_id: A['Coelho'], isbn: '9780061339080', kategoria_id: C['Letërsi'],
    botuesi: 'HarperCollins', viti_botimit: 2003, cmimi: 13.99, sasia_stok: 42, formati: 'Softcover',
    pershkrimi: 'Historia e Maria, një vajze braziliane me ëndrra të mëdha që gjendet duke punuar në Gjenevë. Romani eksploron dashurinë, seksualitetin dhe kuptimin e jetës.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780061339080-L.jpg',
  },
  {
    titulli: 'Dune',
    autori_id: A['Herbert'], isbn: '9780441013593', kategoria_id: C['Shkencë-Fantastikë'],
    botuesi: 'Chilton Books', viti_botimit: 1965, cmimi: 18.99, sasia_stok: 30, formati: 'Hardcover',
    pershkrimi: 'Paul Atreides udhëton në planetin e rrezikshëm Arrakis, burimi i vetëm i erëzës kozmike. Epopeja që ka ndikuar gjithë shkencë-fantastikën moderne.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg',
  },
  {
    titulli: 'Bota e Re e Guximshme',
    autori_id: A['Huxley'], isbn: '9780060850524', kategoria_id: C['Shkencë-Fantastikë'],
    botuesi: 'Chatto & Windus', viti_botimit: 1932, cmimi: 14.99, sasia_stok: 38, formati: 'Softcover',
    pershkrimi: 'Shoqëri e ardhshme ku njerëzit prodhohen industrialisht dhe kondiciohen për lumturi artificiale. Kritikë e zgjuar e teknologjisë dhe shoqërisë konsumeriste.',
    foto_url: 'https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg',
  },
  {
    titulli: 'Dyert e Perceptimit',
    autori_id: A['Huxley'], isbn: '9780061792403', kategoria_id: C['Filozofi & Ide'],
    botuesi: 'Chatto & Windus', viti_botimit: 1954, cmimi: 12.99, sasia_stok: 25, formati: 'Softcover',
    pershkrimi: 'Ese filozofike mbi eksperiencën e Huxley me meskalinin. Eksploron perceptimin, ndërgjegjën dhe kufijtë e mendjes njerëzore. Ndikoi thellë kontrakulturën e viteve 1960.',
    foto_url: 'https://covers.openlibrary.org/b/id/6622313-L.jpg',
  },
];

async function seed() {
  const conn = await mysql.createConnection({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'online_book_store',
    multipleStatements: true,
    charset:            'utf8mb4',
  });

  await conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");

  try {
    console.log('Clearing books, authors, categories...');
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    await conn.query('TRUNCATE TABLE Librat');
    await conn.query('TRUNCATE TABLE Autoret');
    await conn.query('TRUNCATE TABLE Kategorite');
    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    // Fix charset of existing tables in case they were created under a different collation
    const tables = ['Klientet','Autoret','Kategorite','Librat','Porosite','Detajet_Porosise',
                    'Dergesat','Vleresimet','Lista_Deshirave','Kuponat','Pagesat','Adresat_Dergeses'];
    for (const t of tables) {
      try {
        await conn.query(`ALTER TABLE ${t} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      } catch (_) { /* table may not exist yet — ignore */ }
    }

    console.log('Inserting categories...');
    const C = {};
    for (const cat of categories) {
      const [r] = await conn.query('INSERT INTO Kategorite SET ?', [cat]);
      C[cat.emri] = r.insertId;
    }

    console.log('Inserting authors...');
    const A = {};
    for (const author of authors) {
      const [r] = await conn.query('INSERT INTO Autoret SET ?', [author]);
      A[author.mbiemri] = r.insertId;
    }

    console.log('Inserting books...');
    const books = getBooks(C, A);
    for (const book of books) {
      await conn.query('INSERT INTO Librat SET ?', [book]);
    }

    console.log('Seeding admin user...');
    const hash = await bcrypt.hash('admin123', 10);
    await conn.query(
      `INSERT INTO Adminet (emri,mbiemri,email,fjalekalimi_hash,roli)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE fjalekalimi_hash=VALUES(fjalekalimi_hash)`,
      ['Admin', 'Bookstore', 'admin@bookstore.com', hash, 'admin']
    );

    console.log('\nSeed complete!');
    console.log(`   ${categories.length} categories`);
    console.log(`   ${authors.length} authors`);
    console.log(`   ${books.length} books`);
    console.log('   Admin: admin@bookstore.com / admin123\n');
  } finally {
    await conn.end();
    process.exit(0);
  }
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
