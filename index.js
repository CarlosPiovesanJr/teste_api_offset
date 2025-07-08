require('dotenv').config();
const fs = require('fs');
const clintApi = require('@api/clint-api');

const API_TOKEN = process.env.API_TOKEN;

const TOTAL_PAGINAS = 10;
const LIMIT = 100;

const allIds = new Set();
const duplicates = new Set();

const testarPaginacao = async () => {
  const todosContatos = [];
  for (let page = 1; page <= TOTAL_PAGINAS; page++) {
    try {
      const { data } = await clintApi.getContacts({
        limit: LIMIT.toString(),
        offset: ((page - 1) * LIMIT).toString(),
        page: page.toString(),
        'api-token': API_TOKEN
      });

      const contatos = data.data || [];
      todosContatos.push(...contatos);

      console.log(`Página ${page}: ${contatos.length} contatos`);

      for (const contato of contatos) {
        const contatoId = contato.id;
        if (typeof contatoId !== 'string') {
          console.warn('ID inválido ou ausente detectado:', contato);
        }

        if (allIds.has(contatoId)) {
          duplicates.add(contatoId);
        } else {
          allIds.add(contatoId);
        }
      }
    } catch (error) {
      console.error(`Erro na página ${page}:`, error.message || error);
    }
  }

  console.log(`\nTotal de duplicados: ${duplicates.size}`);
  if (duplicates.size > 0) {
    console.log('IDs duplicados:', [...duplicates]);
  }

  todosContatos.forEach((contato, index) => {
    contato.contagem = index + 1;
  });

  fs.writeFileSync('contatos_completos.json', JSON.stringify(todosContatos, null, 2));
  fs.writeFileSync('ids_duplicados.json', JSON.stringify([...duplicates], null, 2));
  console.log('\nArquivos contatos_completos.json e ids_duplicados.json exportados com sucesso!');
};

testarPaginacao();