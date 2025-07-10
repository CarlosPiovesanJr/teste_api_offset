require('dotenv').config();
const fs = require('fs');
const clintApi = require('@api/clint-api');

const API_TOKEN = process.env.API_TOKEN;

// Validate API token
if (!API_TOKEN) {
  console.error('❌ API_TOKEN não encontrado no arquivo .env');
  console.error('Por favor, verifique se o arquivo .env existe e contém o API_TOKEN');
  process.exit(1);
}

console.log('✓ API_TOKEN carregado do arquivo .env');

// Configure API client with timeout and retry settings
clintApi.config({
  timeout: 60000, // 60 seconds timeout
});

const TOTAL_PAGINAS = 10;
const LIMIT = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const allIds = new Set();
const duplicates = new Set();

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function for API calls
const retryApiCall = async (apiCall, retries = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`Tentativa ${attempt} falhou:`, error.message);

      if (attempt === retries) {
        throw error;
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' ||
        error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        console.log(`Aguardando ${RETRY_DELAY * attempt}ms antes da próxima tentativa...`);
        await delay(RETRY_DELAY * attempt); // Exponential backoff
      } else {
        throw error; // Re-throw non-network errors immediately
      }
    }
  }
};

// Test connectivity to API
const testConnectivity = async () => {
  console.log('Testando conectividade com a API...');
  try {
    // Simple test call to check if API is reachable
    const result = await retryApiCall(async () => {
      return await clintApi.getContacts({
        limit: '1',
        page: '1',
        'api-token': API_TOKEN
      });
    }, 1); // Only 1 retry for connectivity test

    console.log('✓ Conectividade com a API estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('✗ Falha na conectividade com a API:', error.message);
    console.error('Verifique sua conexão de internet e o token da API');
    return false;
  }
};

const testarPaginacao = async () => {
  const todosContatos = [];

  // Test connectivity first
  const isConnected = await testConnectivity();
  if (!isConnected) {
    console.error('Não foi possível estabelecer conexão com a API. Encerrando execução.');
    return;
  }

  console.log('Iniciando teste de paginação com retry automático...');

  for (let page = 1; page <= TOTAL_PAGINAS; page++) {
    try {
      console.log(`Processando página ${page}/${TOTAL_PAGINAS}...`);

      const result = await retryApiCall(async () => {
        return await clintApi.getContacts({
          limit: LIMIT.toString(),
          offset: ((page - 1) * LIMIT).toString(),
          page: page.toString(),
          'api-token': API_TOKEN
        });
      });

      const { data } = result;
      const contatos = data.data || [];
      todosContatos.push(...contatos);

      console.log(`✓ Página ${page}: ${contatos.length} contatos obtidos com sucesso`);

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

      // Add a small delay between requests to avoid overwhelming the API
      if (page < TOTAL_PAGINAS) {
        await delay(500); // 500ms delay between pages
      }

    } catch (error) {
      console.error(`✗ Erro fatal na página ${page} após ${MAX_RETRIES} tentativas:`, error.message || error);
      console.log('Continuando com a próxima página...');
    }
  }

  console.log(`\n=== RELATÓRIO FINAL ===`);
  console.log(`Total de contatos obtidos: ${todosContatos.length}`);
  console.log(`Total de IDs únicos: ${allIds.size}`);
  console.log(`Total de duplicados: ${duplicates.size}`);

  if (duplicates.size > 0) {
    console.log('IDs duplicados:', [...duplicates]);
  }

  // Only export files if we have data
  if (todosContatos.length > 0) {
    try {
      // Add counting to contacts
      todosContatos.forEach((contato, index) => {
        contato.contagem = index + 1;
      });


      // Export JSON files
      fs.writeFileSync('contatos_completos.json', JSON.stringify(todosContatos, null, 2));
      console.log('✓ Arquivo contatos_completos.json exportado com sucesso!');

      fs.writeFileSync('ids_duplicados.json', JSON.stringify([...duplicates], null, 2));
      console.log('✓ Arquivo ids_duplicados.json exportado com sucesso!');

      console.log('\n✓ Todos os arquivos foram exportados com sucesso!');
    } catch (exportError) {
      console.error('✗ Erro ao exportar arquivos:', exportError.message);
    }
  } else {
    console.warn('⚠️ Nenhum contato foi obtido. Não há dados para exportar.');
  }
};

testarPaginacao();